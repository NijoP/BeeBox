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
function isWrongType(name, kind) {                 // kind: "R" | "C" | "L"
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
    const matches = arr.filter(it => it && it.uuid && it.libraryUuid && (it.manufacturerId||'').toLowerCase() === wanted);
    return matches.length === 1 ? matches[0] : null; // duplicate MPN records require a reviewed UUID, not first-match selection
  }
  const tks = token.toLowerCase().split("|");
  const matches = arr.filter(it => { if (!it || !it.uuid || !it.libraryUuid || isArrayPart(it.name||it.symbolName||'')) return false; const h = hay(it); return tks.some(t => t && h.indexOf(t) >= 0); });
  return matches.length === 1 ? matches[0] : null;    // ambiguous matches fail; never accept arr[0]
}
async function pickPassive(ref, kind, val) {
  const spec = PASSIVE_LIBRARY[ref];
  if (!spec || spec.kind !== kind || spec.value !== val)
    throw new Error(`Unverified passive ${ref}: ${kind} ${val}; no substitutions allowed`);
  for (const key of ['mpn','manufacturer','package','tolerance','rating','evidence','uuid','libraryUuid'])
    if (!spec[key]) throw new Error(`${ref}: verified passive lacks ${key}`);
  if (kind === 'C' && !spec.dielectric) throw new Error(`${ref}: missing dielectric`);
  const arr = unwrap(await searchRetry(spec.mpn));
  const matches = arr.filter(it => it.uuid === spec.uuid && it.libraryUuid === spec.libraryUuid
    && it.manufacturerId === spec.mpn && it.manufacturer === spec.manufacturer);
  if (matches.length !== 1) throw new Error(`${ref}: exact reviewed library identity unavailable`);
  return matches[0];
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
  if (ref) await eda.sch_PrimitiveComponent.modify(c,{designator:ref,name:part.name||null,manufacturer:part.manufacturer||null,manufacturerId:part.manufacturerId||null,otherProperty:{Package:part.footprintName||''}});
  const readback = await eda.sch_PrimitiveComponent.get(c.getState_PrimitiveId());
  if (!readback || readback.getState_Designator() !== ref
      || readback.getState_ManufacturerId() !== part.manufacturerId)
    throw new Error(`Identity readback failed for ${ref}`);
  return readback;
}
async function placePassive(ref, kind, val, netA, netB, x, y) {
  const part=await pickPassive(ref,kind,val); if (!part) throw new Error(`no ${kind} ${val} for ${ref}`);
  const c=await placeIC(part,x,y,0,ref); await eda.sch_PrimitiveComponent.modify(c,{designator:ref,name:val,manufacturer:part.manufacturer||null,manufacturerId:part.manufacturerId||null,otherProperty:{Package:part.footprintName||'0603'}}); const pins=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.getState_PrimitiveId());
  const verified = await eda.sch_PrimitiveComponent.get(c.getState_PrimitiveId());
  if (!verified || verified.getState_Name() !== val || verified.getState_Designator() !== ref
      || verified.getState_ManufacturerId() !== part.manufacturerId)
    throw new Error(`Passive readback mismatch ${ref}`);
  if (!pins || pins.length!==2) throw new Error(`passive ${ref} must expose exactly two pins`);
  let mx=0,my=0; for (const p of pins) { mx+=p.getState_X(); my+=p.getState_Y(); } mx/=pins.length; my/=pins.length;
  for (const [p,n] of [[pins[0],netA],[pins[1],netB]]) { const px=p.getState_X(),py=p.getState_Y(); const [dx,dy]=pinDir({rotation:p.getState_Rotation(),x:px,y:py},mx,my); await eda.sch_PrimitiveWire.create([px,py,px+dx*OUT,py+dy*OUT],n); }
  return c;
}

/* ============================ CONFIG (fill this) ============================= */
// Filled by the Python generator from the reviewed per-reference manifest.
const PASSIVE_LIBRARY = {};
const SECTION = "STORAGE_RF";
const BASE = [200, 200];                              // tile origin for this section
const GRID_X = 300;                                   // compact grouped A0 zone spacing
const GRID_Y = 350;

// PARTS: one entry per IC/discrete. pinMap keys = EXACT library pin names.
const PARTS = [
  { ref: 'J-SD', query: 'microSD', token: 'microsd', col: 0, row: 0, rot: 0, pinMap: {"VDD": "+3V3", "GND": "GND", "SCLK": "SPI_SCLK", "MOSI": "SPI_MOSI", "MISO": "SPI_MISO", "CS": "SD_CS"} },
  { ref: 'J-RF', query: 'header', token: 'header', col: 1, row: 0, rot: 0, pinMap: {"VCC": "+3V3", "GND": "GND", "SCLK": "SPI_SCLK", "MOSI": "SPI_MOSI", "MISO": "SPI_MISO", "TX": "UART1_TX", "RX": "UART1_RX"} }
];

// PASSIVES: [ref, kind("R"|"C"), value, netA, netB]
const PASSIVES = [

];

/* ============================ DRIVER ======================================== */
return await (async () => {
  const log = [];
  const existing = new Set();
  for (const id of (await eda.sch_PrimitiveComponent.getAllPrimitiveId(undefined,true)) || []) {
    const old = await eda.sch_PrimitiveComponent.get(id);
    const d = old && old.getState_Designator && old.getState_Designator();
    if (d) existing.add(d);
  }
  // Resolve the entire section before any mutation: a missing passive must not
  // leave another partial collection of ICs on the sheet.
  const requested = [...PARTS.map(p=>p.ref), ...PASSIVES.map(p=>p[0])];
  const seen = new Set();
  for (const ref of requested) {
    if (seen.has(ref) || existing.has(ref)) throw new Error(`duplicate designator ${ref}`);
    seen.add(ref);
  }
  const resolved = new Map();
  for (const p of PARTS) {
    if (p.ref === 'J3' && p.query === '0906-0-15-20-75-14-11-0')
      throw new Error('J3 requires twelve independently mapped Mill-Max contacts; a one-contact part cannot implement a 12-pin connector');
    const part = await pick(p.query,p.token);
    if (!part) throw new Error(`missing exact library part ${p.ref}`);
    resolved.set(p.ref,part);
  }
  for (const [ref,kind,val] of PASSIVES) resolved.set(ref,await pickPassive(ref,kind,val));
  for (const p of PARTS) {
    const part = resolved.get(p.ref);
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
    const part = resolved.get(ref);
    if (!part) { log.push(`FAIL ${ref}: no ${val} ${kind}`); throw new Error(`missing passive ${ref}`); }
    await placePassive(ref, kind, val, a, b, BASE[0] + 300 + i * 180, BASE[1] + 350);
    log.push(`OK ${ref} ${val} ${a}-${b} <- ${part.name}`);
  }
  // No modal dialog: automation must return a result, not wait for UI input.
  return {section:SECTION,log};
})();
