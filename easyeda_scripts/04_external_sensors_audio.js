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
const LOCAL_STUB = 12;                           // pin-to-label stub, schematic 10mil units
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
function pinDir(pin, mx, my) {                        // stub direction from rotation + centroid
  const r = ((+pin.rotation || 0) % 360 + 360) % 360;
  if (r === 0 || r === 180) return [Math.sign(pin.x - mx) || 1, 0];
  return [0, Math.sign(pin.y - my) || 1];
}

/**
 * Attach a canonical net to a component pin through a short local stub and a
 * genuine EasyEDA electrical net-port. createNetLabel() is documented as EDA
 * v4-only and returns undefined in the installed 3.2.149 build; createNetPort()
 * is the verified native 3.2 electrical alternative, not visual text.
 */
async function attachNetLabel(pin, net, mx, my, ownerRef) {
  if(typeof net!=="string"||!net.trim()||net!==net.trim())throw new Error(`${ownerRef}: invalid canonical net label ${String(net)}`);
  if(typeof eda.sch_PrimitiveComponent?.createNetPort!=="function")throw new Error('Installed EasyEDA API does not expose a genuine electrical net-port API; refuse visual-only labels');
  const px=pin.getState_X(),py=pin.getState_Y(),pr=pin.getState_Rotation()||0;
  if(![px,py,pr].every(Number.isFinite))throw new Error(`${ownerRef}: nonfinite physical pin geometry`);
  const [dx,dy]=pinDir({rotation:pr,x:px,y:py},mx,my);
  const lx=px+dx*LOCAL_STUB,ly=py+dy*LOCAL_STUB;
  const locationKey=`${lx},${ly}`;
  const prior=CONNECTION_AT.get(locationKey);
  if(prior&&prior!==net)throw new Error(`${ownerRef}: conflicting nets ${prior}/${net} at label coordinate ${locationKey}`);
  if(prior===net)return CONNECTION_RECORDS.find(r=>r.labelX===lx&&r.labelY===ly&&r.net===net);
  const stub=await eda.sch_PrimitiveWire.create([px,py,lx,ly],net);
  if(!stub)throw new Error(`${ownerRef}: failed short net stub ${net}`);
  const port=await eda.sch_PrimitiveComponent.createNetPort('BI',net,lx,ly,0,false);
  if(!port){await eda.sch_PrimitiveWire.delete(stub.getState_PrimitiveId());throw new Error(`${ownerRef}: failed genuine electrical net-port ${net}`);}
  const portId=port.getState_PrimitiveId();
  const refreshed=await eda.sch_PrimitiveComponent.get(portId);
  if(!refreshed||refreshed.getState_ComponentType?.()!=='netport'||refreshed.getState_Net?.()!==net){
    await eda.sch_PrimitiveComponent.delete(portId);await eda.sch_PrimitiveWire.delete(stub.getState_PrimitiveId());
    throw new Error(`${ownerRef}: electrical net-port readback mismatch for ${net}`);
  }
  CONNECTION_AT.set(locationKey,net);
  const record={ownerRef,pin:String(pin.getState_PinNumber()),net,pinX:px,pinY:py,labelX:lx,labelY:ly,stubId:stub.getState_PrimitiveId(),labelId:portId,labelObjectType:'netport'};
  CONNECTION_RECORDS.push(record);return record;
}

async function markNoConnect(pin,ref,key){
  const updated=await eda.sch_PrimitivePin.modify(pin,{noConnected:true});
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

  // Attach net labels to both pins
  await attachNetLabel(pins[0], netA, mx, my, ref);
  await attachNetLabel(pins[1], netB, mx, my, ref);
  return c;
}

/* ============================ CONFIG (fill this) ============================= */
// Filled by the Python generator from the reviewed per-reference manifest.
const PASSIVE_LIBRARY = {"R6": {"manufacturer": "UNI-ROYAL(厚声)", "uuid": "5e5266518f0e41f791738aa9f7251c1d", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C23186", "symbolUuid": "b4fa75aca573465ea40a9fa52694d51f", "footprintUuid": "b44c1b381d26462586b8a8d9fac22ec8", "mpn": "0603WAF5101T5E", "kind": "R", "value": "5.1k", "package": "0603", "tolerance": "1%", "rating": "100mW,75V", "evidence": "projects/beebox/05_schematic_audit/usb_support_search.json"}, "R7": {"manufacturer": "UNI-ROYAL(厚声)", "uuid": "5e5266518f0e41f791738aa9f7251c1d", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C23186", "symbolUuid": "b4fa75aca573465ea40a9fa52694d51f", "footprintUuid": "b44c1b381d26462586b8a8d9fac22ec8", "mpn": "0603WAF5101T5E", "kind": "R", "value": "5.1k", "package": "0603", "tolerance": "1%", "rating": "100mW,75V", "evidence": "projects/beebox/05_schematic_audit/usb_support_search.json"}, "C21": {"manufacturer": "SAMSUNG(三星)", "uuid": "e17be92a8eac408885c635361c15f72c", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C107365", "symbolUuid": "b1d9f24967ef4fe499c86faec02c4ca4", "footprintUuid": "9376364c15854e01b3fabcf032810a22", "mpn": "CL21B475KOFNNNE", "kind": "C", "value": "4.7uF", "package": "0805", "tolerance": "10%", "rating": "16V", "dielectric": "X7R", "evidence": "datasheets/C21_Samsung_CL21B475KOFNNNE.pdf: Samsung part numbering; c21_inrush_revision_search.json; TI_BQ24074.pdf section9.3.1 USB inrush discussion:10uF total ceiling"}, "C22": {"manufacturer": "SAMSUNG(三星)", "uuid": "860ad348098247a18e65be2d4651b260", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C1589", "symbolUuid": "aa71f1470a514f8c891201f3071c3ab2", "footprintUuid": "f499007f726c45dbbd59d7d6a82bc126", "mpn": "CL10B103KB8NNNC", "kind": "C", "value": "10nF", "package": "0603", "tolerance": "10%", "rating": "50V", "evidence": "projects/beebox/05_schematic_audit/usb_support_search.json", "dielectric": "X7R"}};
const DEVICE_LIBRARY = {"D6": {"mpn": "USBLC6-2SC6", "manufacturer": "ST(意法半导体)", "uuid": "5f9a995bc73746278024add8c7b330e3", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C7519", "symbolUuid": "a1ce4cdfd8c34673b2774988c19b159e", "evidence": "projects/beebox/05_schematic_audit/d6_library_search.json; datasheets/ST_USBLC6-2.pdf, Doc ID 11265 Rev 5 Figure 1", "physicalPinNets": {"1": "USB_DP_CONN", "2": "GND", "3": "USB_DN_CONN", "4": "USB_D_N", "5": "VBUS_USB", "6": "USB_D_P"}, "footprintUuid": "136db59d42184a44ac8441e35d752b13", "package": "SOT-23-6_L2.9-W1.6-P0.95-LS2.8-BL"}, "J1": {"manufacturer": "韩国韩荣", "uuid": "730e76758f9742ca9ca85c73f4ec0ecd", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C165948", "symbolUuid": "e30d694d838e433dbe5423a6e817759e", "footprintUuid": "45d257a27a304edd865bdb43b1945b61", "mpn": "TYPE-C-31-M-12", "package": "USB-C_SMD-TYPE-C-31-M-12_1", "evidence": "datasheets/J1_HRO_TYPE_C_31_M_12.pdf manufacturer drawing, reviewed J1_pin_drawing.png; usb_support_search.json C165948", "physicalPinNets": {"A1B12": "GND", "A4B9": "VBUS_USB", "B8": null, "A5": "USB_CC1", "B7": "USB_DN_CONN", "A6": "USB_DP_CONN", "A7": "USB_DN_CONN", "B6": "USB_DP_CONN", "A8": null, "B5": "USB_CC2", "B4A9": "VBUS_USB", "B1A12": "GND", "1": "GND", "2": "GND", "3": "GND", "4": "GND"}}, "J4": {"mpn": "S2B-PH-SM4-TB(LF)(SN)", "manufacturer": "JST", "uuid": "e36262a38c7e4ab8a1efe0df793ebdea", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C295747", "symbolUuid": "949051c2dc9b46d28b8116ac48c62b1a", "footprintUuid": "09ed7394b5f04eccb36be7738c45b2ef", "package": "CONN-SMD_P2.00_S2B-PH-SM4-TB-LF-SN", "evidence": "projects/beebox/05_schematic_audit/power_library_candidates.json exact JST record; manufacturer 2-position drawing/record", "physicalPinNets": {"1": "VBAT", "2": "GND"}}};
const TARGET_PROJECT='d84c4be0ef2e467fa17955faa23c6314';
const TARGET_PAGE='d5e34c82cc3ba89c';
const SECTION = "EXTERNAL_SENSORS_AUDIO";
const SECTION_HEADING = "EXTERNAL SENSORS / AUDIO";
const BASE = [1800, 1980];
const FRAME = [1650, 2350, 1050, 950];                    // x,y,width,height; generated per A0 zone
const GRID_X = 250;
const GRID_Y = 250;

// PARTS: one entry per IC/discrete. pinMap keys = EXACT library pin names.
const PARTS = [
  { ref: 'U7', query: 'SHT45-AD1B-R2', token: 'id:SHT45-AD1B-R2', col: 0, row: 0, rot: 0, pinMap: {"VDD": "+3V3", "VSS": "GND", "GND": "GND", "SDA": "LOCAL_SDA", "SCL": "LOCAL_SCL", "5": null} },
  { ref: 'MIC1', query: 'ICS-43434', token: 'id:ICS-43434', col: 1, row: 0, rot: 0, pinMap: {"VDD": "+3V3", "GND": "GND", "SCK": "I2S_BCLK", "WS": "I2S_WS", "SD": "I2S_SD_EXT", "LR": "GND"} }
];

// PASSIVES: [ref, kind("R"|"C"), value, netA, netB]
const PASSIVES = [
  ['C3', 'C', '100n', '+3V3', 'GND']
];

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
  for (const p of PARTS) {
    if (p.ref === 'J3' && p.query === '0906-0-15-20-75-14-11-0')
      throw new Error('J3 requires twelve independently mapped Mill-Max contacts; a one-contact part cannot implement a 12-pin connector');
    const part = await pick(p.query, p.token, p.ref);
    if (!part) throw new Error(`missing exact library part ${p.ref}`);
    resolved.set(p.ref, part);
  }
  for(const [ref,kind,val]of PASSIVES)resolved.set(ref,await pickPassive(ref,kind,val));
  for(const p of PARTS){const old=existing.get(p.ref),part=resolved.get(p.ref);if(old&&old.getState_ManufacturerId()!==part.manufacturerId)throw new Error(`${p.ref}: existing identity conflicts with reviewed record`);}
  for(const [ref,,val]of PASSIVES){const old=existing.get(ref),part=resolved.get(ref);if(old&&(old.getState_ManufacturerId()!==part.manufacturerId||old.getState_Name()!==val))throw new Error(`${ref}: existing passive identity/value conflict`);}
  const missing=[...requested].filter(ref=>!existing.has(ref));
  if(!missing.length)return {section:SECTION,status:'ALREADY_PRESENT_NO_MUTATION',log,connections:[],verification:'INDEPENDENT_NATIVE_NETLIST_COMPARISON_REQUIRED'};
  const source=await eda.sys_FileManager.getDocumentSource();if(!source)throw new Error('Native rollback source unavailable');
  try{
    await eda.sch_PrimitiveRectangle.create(FRAME[0],FRAME[1],FRAME[2],FRAME[3],0,0,'#777777',null,1,'dashed','none');
    await eda.sch_PrimitiveText.create(FRAME[0]+25,FRAME[1]+25,SECTION_HEADING,0,'#222222',null,13,true);
    for(const p of PARTS){const part=resolved.get(p.ref);if(existing.has(p.ref)){log.push(`REUSE ${p.ref}; connection migration/verification required`);continue;}const x=BASE[0]+p.col*GRID_X,y=BASE[1]+p.row*GRID_Y;const comp=await placeIC(part,x,y,p.rot,p.ref);await wirePinsWithNetLabels(comp,p.pinMap,p.ref);log.push(`OK ${p.ref} <- ${part.name} (${part.manufacturerId||'?'})`);}
    let passiveIndex=0;for(const [ref,kind,val,a,b]of PASSIVES){const part=resolved.get(ref);if(existing.has(ref)){log.push(`REUSE ${ref}; connection migration/verification required`);continue;}await placePassive(ref,kind,val,a,b,BASE[0]+300+(passiveIndex%4)*150,BASE[1]+250+Math.floor(passiveIndex/4)*120);passiveIndex++;log.push(`OK ${ref} ${val} ${a}-${b} <- ${part.name}`);}
    return {section:SECTION,status:'MUTATED_REQUIRES_NATIVE_VERIFICATION',log,connections:CONNECTION_RECORDS,verification:'LABEL_OBJECT_AND_STUB_READBACK_ONLY; NATIVE_NETLIST_COMPARISON_REQUIRED'};
  }catch(e){const now=await eda.dmt_Schematic.getCurrentSchematicPageInfo();if(now?.uuid!==TARGET_PAGE)throw new Error(`Refuse rollback on changed page after: ${String(e)}`);await eda.sys_FileManager.setDocumentSource(source);throw e;}
})();
