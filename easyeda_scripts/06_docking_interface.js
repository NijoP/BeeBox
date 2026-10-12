/*
 * section_generator.template.js â€” PCB Flow schematic section generator (EasyEDA Pro).
 *
 * PATTERN: Engine + CONFIG (P1). Everything above the CONFIG line is board-agnostic
 * and never changes. Everything in CONFIG is data you fill from build_sheet.md.
 *
 * RUN: EasyEDA Pro â–¸ Settings â–¸ Extensions â–¸ Standalone Script â–¸ paste â–¸ Run.
 * THEN: Design â–¸ Annotate (project-wide) â€” the API cannot reliably set designators.
 *
 * HARD RULES (see docs/06_EASYEDA_INTEGRATION.md):
 *   - Connect BY NET NAME (arg 2 of sch_PrimitiveWire.create). Use SHORT stubs
 *     (long collinear stubs from adjacent parts auto-merge â†’ shorts).
 *   - Never search()[0] for an IC â€” token-match, reject array parts.
 *   - Verify a picked part by its manufacturerId, not the search string.
 *   - One schematic, multiple PAGES â€” never separate schematic files.
 */

/* ============================ ENGINE (do not edit) ============================ */
const OUT = 40;                              // short stub length (units) â€” see hard rules
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function hay(it) {
  return ((it.name||"")+" "+(it.symbolName||"")+" "+(it.manufacturer||"")+" "
    +(it.manufacturerId||"")+" "+(it.description||"")).toLowerCase();
}
function isArrayPart(name) {
  return /^4d\d|cay16|cay10|exb[-_]|isolated|array|network|\brn\b/.test((name||"").toLowerCase());
}
function isWrongType(name, kind) {                 // kind: "R" | "C"
  const s = (name||"").toLowerCase();
  if (kind === "R" && /(cap|Âµf|uf|nf|pf|inductor|Âµh|uh)/.test(s)) return true;
  if (kind === "C" && /(ohm|kÏ‰|resistor|inductor|Âµh|uh)/.test(s)) return true;
  return false;
}
async function searchRetry(query, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try { const r = await eda.lib_Device.search(query); if (r) return r; }
    catch (e) {}
    await sleep(800 * (i + 1));                     // backoff
  }
  return null;
}
function unwrap(r) {
  return Array.isArray(r) ? r : (r && (r.deviceList||r.list||r.items||r.result||r.data)) || [];
}
async function pick(query, token) {                 // token = "a|b|c" disambiguation
  const arr = unwrap(await searchRetry(query));
  if (token.toLowerCase().startsWith('id:')) {
    const wanted = token.slice(3).toLowerCase();
    return arr.find(it => it && it.uuid && it.libraryUuid && (it.manufacturerId||'').toLowerCase() === wanted) || null;
  }
  const tks = token.toLowerCase().split("|");
  for (const it of arr) { if (!it || !it.uuid || !it.libraryUuid || isArrayPart(it.name||it.symbolName||'')) continue; const h = hay(it);
    for (const t of tks) if (t && h.indexOf(t) >= 0) return it; }
  return null;                                       // NEVER arr[0] for an IC
}
function eiaCode(kind, val) {                         // secondary value discriminator
  // e.g. "100n"->"104", "47"->"470"(+letter tol). Fill per your value scheme.
  return String(val).replace(/[^0-9]/g, "");
}
async function pickPassive(kind, val) {
  const q = `${val} 0603 ${kind === "R" ? "resistor" : "capacitor"}`;
  const arr = unwrap(await searchRetry(q)).filter(
    (it) => !isArrayPart(it.name) && !isWrongType(it.name, kind));
  const code = eiaCode(kind, val);
  for (const it of arr) if (it && it.uuid && it.libraryUuid && (it.name||"").indexOf(code) >= 0) return it;   // EIA match wins
  // Verified 0603 library exemplars; the requested electrical value is written explicitly.
  const exemplar = kind === 'R' ? '0603WAF2201T5E' : '0603B104K500NT_C30926';
  const exact = unwrap(await searchRetry(exemplar)).find(it => it && it.uuid && it.libraryUuid && (it.manufacturerId === (kind === 'R' ? '0603WAF2201T5E' : '0603B104K500NT')));
  return exact || null;
}
function pinDir(pin, mx, my) {                        // stub direction from rotation + centroid
  const r = ((+pin.rotation || 0) % 360 + 360) % 360;
  if (r === 0 || r === 180) return [Math.sign(pin.x - mx) || 1, 0];
  return [0, Math.sign(pin.y - my) || 1];
}
async function wirePins(comp, pinMap) {
  const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(comp.getState_PrimitiveId());
  let mx = 0, my = 0; for (const p of pins) { mx += p.getState_X(); my += p.getState_Y(); }
  mx /= pins.length; my /= pins.length;
  for (const p of pins) {
    const name = p.getState_PinName();
    if (!Object.prototype.hasOwnProperty.call(pinMap, name)) throw new Error(`unmapped pin ${name} on ${comp.getState_PrimitiveId()}`);
    const net = pinMap[name];
    if (net == null) continue;                        // explicit null = intentional NC
    const px=p.getState_X(), py=p.getState_Y(), pr=p.getState_Rotation();
    const [dx, dy] = pinDir({rotation:pr,x:px,y:py}, mx, my);
    await eda.sch_PrimitiveWire.create([px, py, px + dx*OUT, py + dy*OUT], net);
  }
}
async function placeIC(part, x, y, rot, ref) {
  if (!part || !part.uuid || !part.libraryUuid) throw new Error('Library result lacks uuid/libraryUuid');
  const c = await eda.sch_PrimitiveComponent.create({libraryUuid:part.libraryUuid, uuid:part.uuid}, x, y, undefined, rot || 0, false, true, true);
  if (!c) throw new Error('component create returned empty');
  if (ref) await eda.sch_PrimitiveComponent.modify(c,{designator:ref,otherProperty:{MPN:part.manufacturerId||part.name||''}});
  await sleep(150);
  return c;
}
async function placePassive(ref, kind, val, netA, netB, x, y) {
  const part=await pickPassive(kind,val); if (!part) throw new Error(`no ${kind} ${val} for ${ref}`);
  const c=await placeIC(part,x,y,0,ref); await eda.sch_PrimitiveComponent.modify(c,{value:val,otherProperty:{MPN:part.manufacturerId||part.name||'',Package:'0603 preliminary'}}); const pins=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.getState_PrimitiveId());
  if (!pins || pins.length<2) throw new Error(`passive ${ref} does not expose two pins`);
  let mx=0,my=0; for (const p of pins) { mx+=p.getState_X(); my+=p.getState_Y(); } mx/=pins.length; my/=pins.length;
  for (const [p,n] of [[pins[0],netA],[pins[1],netB]]) { const px=p.getState_X(),py=p.getState_Y(); const [dx,dy]=pinDir({rotation:p.getState_Rotation(),x:px,y:py},mx,my); await eda.sch_PrimitiveWire.create([px,py,px+dx*OUT,py+dy*OUT],n); }
  return c;
}

/* ============================ CONFIG (fill this) ============================= */
const SECTION = "DOCKING";
const BASE = [200, 200];                              // tile origin for this section
const GRID_X = 600;                                   // compact A4/A0-safe section spacing
const GRID_Y = 500;

// PARTS: one entry per IC/discrete. pinMap keys = EXACT library pin names.
const PARTS = [
  { ref: 'U4', query: 'TCA9546A', token: 'tca9546a', col: 0, row: 0, rot: 0, pinMap: {"VCC": "+3V3", "GND": "GND", "SDA": "I2C_MAIN_SDA", "SCL": "I2C_MAIN_SCL", "SD0": "DOCK_SDA", "SC0": "DOCK_SCL"} },
  { ref: 'D5', query: 'TPD4E05U06', token: 'tpd4e05', col: 1, row: 0, rot: 0, pinMap: {"GND": "GND"} },
  { ref: 'J3', query: 'Mill-Max 0906', token: 'mill-max|0906', col: 2, row: 0, rot: 0, pinMap: {"1": "GND", "2": "GND", "3": "GND", "4": "VDOCK", "5": "VDOCK", "6": "+3V3_FPC", "7": "DOCK_SDA", "8": "DOCK_SCL", "9": "DOCK_BCLK", "10": "DOCK_WS", "11": "DOCK_SD", "12": "DOCK_PRESENT_ID"} }
];

// PASSIVES: [ref, kind("R"|"C"), value, netA, netB]
const PASSIVES = [
  ['R4', 'R', '2.2k', 'I2C_MAIN_SDA', '+3V3'],
  ['R5', 'R', '2.2k', 'I2C_MAIN_SCL', '+3V3']
];

/* ============================ DRIVER ======================================== */
(async () => {
  const log = [];
  const existing = new Set();
  for (const id of (await eda.sch_PrimitiveComponent.getAllPrimitiveId(undefined,true)) || []) {
    const old = await eda.sch_PrimitiveComponent.get(id);
    const d = old && old.getState_Designator && old.getState_Designator();
    if (d) existing.add(d);
  }
  for (const p of PARTS) {
    const part = await pick(p.query, p.token);
    if (existing.has(p.ref)) throw new Error(`duplicate existing designator ${p.ref}`);
    if (!part) { log.push(`FAIL ${p.ref}: no token match for "${p.query}"`); throw new Error(`missing library part ${p.ref}`); }
    const x = BASE[0] + p.col * GRID_X, y = BASE[1] + p.row * GRID_Y;
    const comp = await placeIC(part, x, y, p.rot, p.ref);
    await wirePins(comp, p.pinMap);
    log.push(`OK ${p.ref} <- ${part.name} (${part.manufacturerId||"?"})`);  // verify this ID!
  }
  for (let i=0; i<PASSIVES.length; i++) {
    const [ref, kind, val, a, b] = PASSIVES[i];
    if (existing.has(ref)) throw new Error(`duplicate existing designator ${ref}`);
    const part = await pickPassive(kind, val);
    if (!part) { log.push(`FAIL ${ref}: no ${val} ${kind}`); throw new Error(`missing passive ${ref}`); }
    await placePassive(ref, kind, val, a, b, BASE[0] + 800 + i * 300, BASE[1] + 600);
    log.push(`OK ${ref} ${val} ${a}-${b} <- ${part.name}`);
  }
  eda.sys_MessageBox.showInformationMessage(
    `${SECTION}\n` + log.join("\n") + `\n\nNEXT: Design â–¸ Annotate (project-wide).`);
})();
