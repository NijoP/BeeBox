/*
 * section_generator.template.js — PCB Flow schematic section generator (EasyEDA Pro).
 *
 * PATTERN: Engine + CONFIG (P1). Everything above the CONFIG line is board-agnostic
 * and never changes. Everything in CONFIG is data you fill from build_sheet.md.
 *
 * RUN: EasyEDA Pro ▸ Settings ▸ Extensions ▸ Standalone Script ▸ paste ▸ Run.
 * THEN: Design ▸ Annotate (project-wide) — the API cannot reliably set designators.
 *
 * HARD RULES (see docs/06_EASYEDA_INTEGRATION.md):
 *   - Connect by genuine electrical net objects. EasyEDA 3.2 uses createNetPort();
 *     createNetLabel() exists as a stub but is functional only from EDA v4.
 *   - Use SHORT local stubs only for pin-to-net-port attachment; no long wires across sections.
 *   - Never search()[0] for an IC — token-match, reject array parts.
 *   - Verify a picked part by its manufacturerId, not the search string.
 *   - One schematic, multiple PAGES — never separate schematic files.
 */

 /* ============================ ENGINE (do not edit) ============================ */
const LOCAL_STUB = 120;                          // reference-style text-clearance corridor
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CONNECTION_RECORDS = [];
const CONNECTION_AT = new Map();

function hay(it) {
  return ((it.name||"")+" "+(it.symbolName||"")+" "+(it.manufacturer||"")+" "
    +(it.manufacturerId||"")+" "+(it.description||"")).toLowerCase();
}
function isArrayPart(name) {
  return /^4d\d|cay16|cay10|exb[-_]|isolated|array|network|\brn\b/.test((name||"").toLowerCase());
}
function isWrongType(name, kind) {                 // kind: "R" | "C" | "L"
  const s = (name||"").toLowerCase();
  if (kind === "R" && /(cap|µf|uf|nf|pf|inductor|µh|uh)/.test(s)) return true;
  if (kind === "C" && /(ohm|kω|resistor|inductor|µh|uh)/.test(s)) return true;
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
async function getReviewedRecord(spec) {
  // Fetch pinned UUID directly: a paginated/relevance search may omit a valid
  // exact record from its first ten results. Identity checks remain strict.
  const raw=await eda.lib_Device.get(spec.uuid,spec.libraryUuid);
  const p=raw?.property,a=raw?.association;
  if(!raw||raw.uuid!==spec.uuid||raw.libraryUuid!==spec.libraryUuid||p?.manufacturerId!==spec.mpn||p?.manufacturer!==spec.manufacturer
    ||(spec.supplierId&&p?.supplierId!==spec.supplierId)||(spec.symbolUuid&&a?.symbolUuid!==spec.symbolUuid)||(spec.footprintUuid&&a?.footprintUuid!==spec.footprintUuid))
    throw new Error(`Reviewed UUID identity mismatch: ${spec.mpn}`);
  return {uuid:raw.uuid,libraryUuid:raw.libraryUuid,name:p.name||raw.name,manufacturer:p.manufacturer,manufacturerId:p.manufacturerId,supplierId:p.supplierId,
    otherProperty:p.otherProperty||{},symbolUuid:a.symbolUuid,footprintUuid:a.footprintUuid,footprintName:p.otherProperty?.['Supplier Footprint']||''};
}
async function pick(query, token, ref) {                 // exact reviewed identities win
  const verified = DEVICE_LIBRARY[ref];
  if (verified) {
    if(!verified.physicalPinNets||!Object.keys(verified.physicalPinNets).length)throw new Error(`${ref}: no reviewed physical-pin map`);
    return await getReviewedRecord(verified);
  }
  throw new Error(`Unverified device ${ref}: ${query}; exact manufacturer/UUID manifest required`);
}
async function pickPassive(ref, kind, val) {
  const spec = PASSIVE_LIBRARY[ref];
  if (!spec || spec.kind !== kind || spec.value !== val)
    throw new Error(`Unverified passive ${ref}: ${kind} ${val}; no substitutions allowed`);
  for (const key of ['mpn','manufacturer','package','tolerance','rating','evidence','uuid','libraryUuid'])
    if (!spec[key]) throw new Error(`${ref}: verified passive lacks ${key}`);
  if (kind === 'C' && !spec.dielectric) throw new Error(`${ref}: missing dielectric`);
  return await getReviewedRecord(spec);
}
function pinDir(pin, mx, my) {                        // actual EasyEDA pin orientation
  const r=((+pin.rotation||0)%360+360)%360;
  if(r===0)return[1,0];if(r===180)return[-1,0];if(r===90)return[0,1];if(r===270)return[0,-1];
  throw new Error(`unsupported physical pin rotation ${r}`);
}

/**
 * Attach a canonical named wire stub in the same visual style as the supplied
 * reference PDF. EasyEDA stores the native net name on the wire itself; no
 * arrow-shaped port is placed against the symbol.
 */
async function attachNetLabel(pin, net, mx, my, ownerRef) {
  if(typeof net!=="string"||!net.trim()||net!==net.trim())throw new Error(`${ownerRef}: invalid canonical net label ${String(net)}`);
  const px=pin.getState_X(),py=pin.getState_Y(),pr=pin.getState_Rotation()||0;
  if(![px,py,pr].every(Number.isFinite))throw new Error(`${ownerRef}: nonfinite physical pin geometry`);
  const [dx,dy]=pinDir({rotation:pr,x:px,y:py},mx,my),lx=px+dx*LOCAL_STUB,ly=py+dy*LOCAL_STUB;
  const locationKey=`${lx},${ly}`,prior=CONNECTION_AT.get(locationKey);
  if(prior&&prior!==net)throw new Error(`${ownerRef}: conflicting nets ${prior}/${net} at stub endpoint ${locationKey}`);
  if(prior===net)return CONNECTION_RECORDS.find(r=>r.labelX===lx&&r.labelY===ly&&r.net===net);
  const stub=await eda.sch_PrimitiveWire.create([px,py,lx,ly],net);
  if(!stub||stub.getState_Net?.()!==net)throw new Error(`${ownerRef}: named-wire readback mismatch ${net}`);
  CONNECTION_AT.set(locationKey,net);
  const record={ownerRef,pin:String(pin.getState_PinNumber()),net,pinX:px,pinY:py,labelX:lx,labelY:ly,stubId:stub.getState_PrimitiveId(),labelObjectType:'named-wire'};
  CONNECTION_RECORDS.push(record);return record;
}

async function markNoConnect(pin,ref,key){
  const asyncPin=pin.toAsync();
  asyncPin.setState_NoConnected(true);
  const updated=await asyncPin.done();
  if(!updated||updated.getState_NoConnected()!==true)throw new Error(`${ref}.${key}: explicit NC marker readback failed`);
  CONNECTION_RECORDS.push({ownerRef:ref,pin:String(pin.getState_PinNumber()),net:null,noConnect:true});
}

async function wirePinsWithNetLabels(comp, pinMap, ref) {
  const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(comp.getState_PrimitiveId());
  const physicalMap = DEVICE_LIBRARY[ref]?.physicalPinNets;
  if (physicalMap) {
    const observed = pins.map(p => String(p.getState_PinNumber()));
    const expected = Object.keys(physicalMap);
    if (new Set(observed).size !== observed.length || observed.length !== expected.length || expected.some(k => !observed.includes(k)))
      throw new Error(`${ref}: physical-pin inventory mismatch`);
  }

  // Compute component centroid for pin direction
  let mx = 0, my = 0;
  for (const p of pins) { mx += p.getState_X(); my += p.getState_Y(); }
  mx /= pins.length; my /= pins.length;

  const createdLabels = [];
  for (const p of pins) {
    const physical = DEVICE_LIBRARY[ref] && DEVICE_LIBRARY[ref].physicalPinNets;
    const map = physical || pinMap;
    const key = physical ? String(p.getState_PinNumber()) : p.getState_PinName();
    if (!Object.prototype.hasOwnProperty.call(map, key)) throw new Error(`unmapped pin ${key} on ${comp.getState_PrimitiveId()}`);
    const net=map[key];
    if(net==null){await markNoConnect(p,ref,key);continue;}
    if(p.getState_NoConnected()===true)throw new Error(`${ref}.${key}: connected pin is marked NC`);
    await attachNetLabel(p,net,mx,my,ref);
    createdLabels.push({pin: key, net});
  }
  return createdLabels;
}

async function placeIC(part, x, y, rot, ref) {
  if (!part || !part.uuid || !part.libraryUuid) throw new Error('Library result lacks uuid/libraryUuid');
  const c = await eda.sch_PrimitiveComponent.create({libraryUuid: part.libraryUuid, uuid: part.uuid}, x, y, undefined, rot || 0, false, true, true);
  if (!c) throw new Error('component create returned empty');
  if (ref) await eda.sch_PrimitiveComponent.modify(c.getState_PrimitiveId(), {designator: ref, name: part.name || null, manufacturer: part.manufacturer || null, manufacturerId: part.manufacturerId || null, otherProperty: {Package: part.footprintName || ''}});
  const readback = await eda.sch_PrimitiveComponent.get(c.getState_PrimitiveId());
  if (!readback || readback.getState_Designator() !== ref || readback.getState_ManufacturerId() !== part.manufacturerId)
    throw new Error(`Identity readback failed for ${ref}`);
  return readback;
}

async function placePassive(ref, kind, val, netA, netB, x, y) {
  const part = await pickPassive(ref, kind, val);
  if (!part) throw new Error(`no ${kind} ${val} for ${ref}`);
  const c = await placeIC(part, x, y, 0, ref);
  await eda.sch_PrimitiveComponent.modify(c.getState_PrimitiveId(), {designator: ref, name: val, manufacturer: part.manufacturer || null, manufacturerId: part.manufacturerId || null, otherProperty: {Package: part.footprintName || '0603'}});
  const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.getState_PrimitiveId());
  const verified = await eda.sch_PrimitiveComponent.get(c.getState_PrimitiveId());
  if (!verified || verified.getState_Name() !== val || verified.getState_Designator() !== ref || verified.getState_ManufacturerId() !== part.manufacturerId)
    throw new Error(`Passive readback mismatch ${ref}`);
  if (!pins || pins.length !== 2) throw new Error(`passive ${ref} must expose exactly two pins`);

  // Compute centroid for pin direction
  let mx = 0, my = 0;
  for (const p of pins) { mx += p.getState_X(); my += p.getState_Y(); }
  mx /= pins.length; my /= pins.length;

  // Physical pin 1 is canonical netA and physical pin 2 is canonical netB.
  pins.sort((a,b)=>String(a.getState_PinNumber()).localeCompare(String(b.getState_PinNumber()),undefined,{numeric:true}));
  await attachNetLabel(pins[0], netA, mx, my, ref);
  await attachNetLabel(pins[1], netB, mx, my, ref);
  return c;
}

/* ============================ CONFIG (fill this) ============================= */
// Filled by the Python generator from the reviewed per-reference manifest.
const PASSIVE_LIBRARY = {};
const DEVICE_LIBRARY = {};
const TARGET_PROJECT='d84c4be0ef2e467fa17955faa23c6314';
const TARGET_PAGE='d5e34c82cc3ba89c';
const SECTION = "<BLOCK NAME>";
const SECTION_HEADING = "<BLOCK HEADING>";
const SECTION_NOTE = "";
const BASE = [200, 200];
const FRAME = [100,100,1600,700];                    // x,y,width,height; generated per A0 zone
const GRID_X = 500;
const GRID_Y = 250;

// PARTS: one entry per IC/discrete. pinMap keys = EXACT library pin names.
const PARTS = [
  { ref: "U1", query: "<search term>", token: "<a|b|c>", col: 0, row: 0, rot: 0,
    pinMap: { "<PIN>": "<NET>", "<PIN2>": "<NET2>", "<NC_PIN>": null } },
];

// PASSIVES: [ref, kind("R"|"C"), value, netA, netB]
const PASSIVES = [
  ["R1", "R", "5.1k", "<netA>", "<netB>"],
  ["C1", "C", "10u",  "<netA>", "<netB>"],
];
// Explicit interface contacts for which no false substitute library component is allowed.
const BOUNDARY_CONTACTS = [];

/* ============================ DRIVER ======================================== */
return await (async()=>{
  const project=await eda.dmt_Project.getCurrentProjectInfo(),page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
  if(project?.uuid!==TARGET_PROJECT||page?.uuid!==TARGET_PAGE)throw new Error(`Wrong project/page: ${project?.uuid}/${page?.uuid}`);
  const log=[],existing=new Map();
  for(const id of(await eda.sch_PrimitiveComponent.getAllPrimitiveId(undefined,true))||[]){
    const old=await eda.sch_PrimitiveComponent.get(id),d=old?.getState_Designator?.();
    if(d){if(existing.has(d))throw new Error(`duplicate existing designator ${d}`);existing.set(d,old);}
  }
  // Resolve the entire section before any mutation: a missing passive must not
  // leave another partial collection of ICs on the sheet.
  const requested = [...PARTS.map(p => p.ref), ...PASSIVES.map(p => p[0])];
  const seen = new Set();
  for (const ref of requested) {
    if(seen.has(ref))throw new Error(`duplicate requested designator ${ref}`);
    seen.add(ref);
  }
  const resolved = new Map();
  await Promise.all(PARTS.map(async p=>{
    if(p.ref==='J3'&&p.query==='0906-0-15-20-75-14-11-0')throw new Error('J3 requires twelve independently mapped Mill-Max contacts');
    const part=await pick(p.query,p.token,p.ref);if(!part)throw new Error(`missing exact library part ${p.ref}`);resolved.set(p.ref,part);
  }));
  await Promise.all(PASSIVES.map(async([ref,kind,val])=>resolved.set(ref,await pickPassive(ref,kind,val))));
  for(const p of PARTS){const old=existing.get(p.ref),part=resolved.get(p.ref);if(old&&old.getState_ManufacturerId()!==part.manufacturerId)throw new Error(`${p.ref}: existing identity conflicts with reviewed record`);}
  for(const [ref,,val]of PASSIVES){const old=existing.get(ref),part=resolved.get(ref);if(old&&(old.getState_ManufacturerId()!==part.manufacturerId||old.getState_Name()!==val))throw new Error(`${ref}: existing passive identity/value conflict`);}
  const missing=[...requested].filter(ref=>!existing.has(ref));
  if(missing.length!==requested.length&&missing.length)throw new Error(`${SECTION}: partial pre-existing section; refuse mutation and require native-source reset/readback`);
  if(!missing.length)return {section:SECTION,status:'EXISTING_REQUIRES_VERIFICATION_NO_MUTATION',log,connections:[],verification:'COMPONENT_PRESENCE_IS_NOT_CONNECTIVITY_PROOF; RUN FINAL PHYSICAL-PIN PARITY'};
  const source=await eda.sys_FileManager.getDocumentSource();if(!source)throw new Error('Native rollback source unavailable');
  try{
    await eda.sch_PrimitiveText.create(BASE[0],BASE[1]-140,SECTION_HEADING,0,'#222222',null,13,true);
    if(SECTION_NOTE)await eda.sch_PrimitiveText.create(BASE[0],BASE[1]-105,SECTION_NOTE,0,'#444444',null,9,false);
    for(const p of PARTS){const part=resolved.get(p.ref);if(existing.has(p.ref)){log.push(`REUSE ${p.ref}; connection migration/verification required`);continue;}const x=BASE[0]+p.col*GRID_X,y=BASE[1]+p.row*GRID_Y;const comp=await placeIC(part,x,y,p.rot,p.ref);await wirePinsWithNetLabels(comp,p.pinMap,p.ref);log.push(`OK ${p.ref} <- ${part.name} (${part.manufacturerId||'?'})`);}
    let passiveIndex=0;for(const [ref,kind,val,a,b]of PASSIVES){const part=resolved.get(ref);if(existing.has(ref)){log.push(`REUSE ${ref}; connection migration/verification required`);continue;}await placePassive(ref,kind,val,a,b,BASE[0]+300+(passiveIndex%4)*360,BASE[1]+300+Math.floor(passiveIndex/4)*150);passiveIndex++;log.push(`OK ${ref} ${val} ${a}-${b} <- ${part.name}`);}
    let contactIndex=0;for(const contact of BOUNDARY_CONTACTS){const x=BASE[0]+contactIndex*100,y=BASE[1]+650;const port=await eda.sch_PrimitiveComponent.createNetPort('BI',contact.net,x,y,0,false);if(!port||port.getState_Net?.()!==contact.net)throw new Error(`${contact.ref}: boundary net-port failed`);await eda.sch_PrimitiveText.create(x,y-35,`${contact.ref} ${contact.net}`,0,'#333333',null,8,false);CONNECTION_RECORDS.push({ownerRef:contact.ref,pin:'1',net:contact.net,labelId:port.getState_PrimitiveId(),labelObjectType:'netport',provisionalPhysicalContact:true});contactIndex++;}
    return {section:SECTION,status:'MUTATED_REQUIRES_NATIVE_VERIFICATION',log,connections:CONNECTION_RECORDS,verification:'LABEL_OBJECT_AND_STUB_READBACK_ONLY; NATIVE_NETLIST_COMPARISON_REQUIRED'};
  }catch(e){const now=await eda.dmt_Schematic.getCurrentSchematicPageInfo();if(now?.uuid!==TARGET_PAGE)throw new Error(`Refuse rollback on changed page after: ${String(e)}`);await eda.sys_FileManager.setDocumentSource(source);throw e;}
})();