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
 *   - Connect BY NET LABEL (eda.sch_PrimitiveAttribute.createNetLabel) as primary method.
 *   - Use SHORT local stubs only for pin-to-label attachment; no long wires across sections.
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
 * Attach a net label to a component pin via a short local stub.
 * The net label is the primary electrical connection; the stub is visual only.
 * @param {object} pin - pin primitive with getState_X, getState_Y, getState_Rotation
 * @param {string} net - canonical net name
 * @param {number} mx - component centroid X
 * @param {number} my - component centroid Y
 * @returns {Promise<void>}
 */
async function attachNetLabel(pin, net, mx, my, ownerRef) {
  if(typeof net!=="string"||!net.trim()||net!==net.trim())throw new Error(`${ownerRef}: invalid canonical net label ${String(net)}`);
  if(typeof eda.sch_PrimitiveAttribute?.createNetLabel!=="function")throw new Error('Installed EasyEDA API does not expose SCH_PrimitiveAttribute.createNetLabel; refuse visual-only labels');
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
  const label=await eda.sch_PrimitiveAttribute.createNetLabel(lx,ly,net);
  if(!label){await eda.sch_PrimitiveWire.delete(stub.getState_PrimitiveId());throw new Error(`${ownerRef}: failed genuine net label ${net}`);}
  const refreshed=await eda.sch_PrimitiveAttribute.get(label.getState_PrimitiveId());
  if(!refreshed||refreshed.getState_Value()!==net){await eda.sch_PrimitiveWire.delete(stub.getState_PrimitiveId());throw new Error(`${ownerRef}: net-label readback mismatch for ${net}`);}
  CONNECTION_AT.set(locationKey,net);
  const record={ownerRef,pin:String(pin.getState_PinNumber()),net,pinX:px,pinY:py,labelX:lx,labelY:ly,stubId:stub.getState_PrimitiveId(),labelId:label.getState_PrimitiveId()};
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


const DEVICE_LIBRARY = {"D6": {"mpn": "USBLC6-2SC6", "manufacturer": "ST(意法半导体)", "uuid": "5f9a995bc73746278024add8c7b330e3", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C7519", "symbolUuid": "a1ce4cdfd8c34673b2774988c19b159e", "evidence": "projects/beebox/05_schematic_audit/d6_library_search.json; datasheets/ST_USBLC6-2.pdf, Doc ID 11265 Rev 5 Figure 1", "physicalPinNets": {"1": "USB_DP_CONN", "2": "GND", "3": "USB_DN_CONN", "4": "USB_D_N", "5": "VBUS_USB", "6": "USB_D_P"}, "footprintUuid": "136db59d42184a44ac8441e35d752b13", "package": "SOT-23-6_L2.9-W1.6-P0.95-LS2.8-BL"}, "J1": {"manufacturer": "韩国韩荣", "uuid": "730e76758f9742ca9ca85c73f4ec0ecd", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C165948", "symbolUuid": "e30d694d838e433dbe5423a6e817759e", "footprintUuid": "45d257a27a304edd865bdb43b1945b61", "mpn": "TYPE-C-31-M-12", "package": "USB-C_SMD-TYPE-C-31-M-12_1", "evidence": "datasheets/J1_HRO_TYPE_C_31_M_12.pdf manufacturer drawing, reviewed J1_pin_drawing.png; usb_support_search.json C165948", "physicalPinNets": {"A1B12": "GND", "A4B9": "VBUS_USB", "B8": null, "A5": "USB_CC1", "B7": "USB_DN_CONN", "A6": "USB_DP_CONN", "A7": "USB_DN_CONN", "B6": "USB_DP_CONN", "A8": null, "B5": "USB_CC2", "B4A9": "VBUS_USB", "B1A12": "GND", "1": "GND", "2": "GND", "3": "GND", "4": "GND"}}, "J4": {"mpn": "S2B-PH-SM4-TB(LF)(SN)", "manufacturer": "JST", "uuid": "e36262a38c7e4ab8a1efe0df793ebdea", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C295747", "symbolUuid": "949051c2dc9b46d28b8116ac48c62b1a", "footprintUuid": "09ed7394b5f04eccb36be7738c45b2ef", "package": "CONN-SMD_P2.00_S2B-PH-SM4-TB-LF-SN", "evidence": "projects/beebox/05_schematic_audit/power_library_candidates.json exact JST record; manufacturer 2-position drawing/record", "physicalPinNets": {"1": "VBAT", "2": "GND"}}};
const PASSIVE_LIBRARY = {"R6": {"manufacturer": "UNI-ROYAL(厚声)", "uuid": "5e5266518f0e41f791738aa9f7251c1d", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C23186", "symbolUuid": "b4fa75aca573465ea40a9fa52694d51f", "footprintUuid": "b44c1b381d26462586b8a8d9fac22ec8", "mpn": "0603WAF5101T5E", "kind": "R", "value": "5.1k", "package": "0603", "tolerance": "1%", "rating": "100mW,75V", "evidence": "projects/beebox/05_schematic_audit/usb_support_search.json"}, "R7": {"manufacturer": "UNI-ROYAL(厚声)", "uuid": "5e5266518f0e41f791738aa9f7251c1d", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C23186", "symbolUuid": "b4fa75aca573465ea40a9fa52694d51f", "footprintUuid": "b44c1b381d26462586b8a8d9fac22ec8", "mpn": "0603WAF5101T5E", "kind": "R", "value": "5.1k", "package": "0603", "tolerance": "1%", "rating": "100mW,75V", "evidence": "projects/beebox/05_schematic_audit/usb_support_search.json"}, "C21": {"manufacturer": "SAMSUNG(三星)", "uuid": "e17be92a8eac408885c635361c15f72c", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C107365", "symbolUuid": "b1d9f24967ef4fe499c86faec02c4ca4", "footprintUuid": "9376364c15854e01b3fabcf032810a22", "mpn": "CL21B475KOFNNNE", "kind": "C", "value": "4.7uF", "package": "0805", "tolerance": "10%", "rating": "16V", "dielectric": "X7R", "evidence": "datasheets/C21_Samsung_CL21B475KOFNNNE.pdf: Samsung part numbering; c21_inrush_revision_search.json; TI_BQ24074.pdf section9.3.1 USB inrush discussion:10uF total ceiling"}, "C22": {"manufacturer": "SAMSUNG(三星)", "uuid": "860ad348098247a18e65be2d4651b260", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C1589", "symbolUuid": "aa71f1470a514f8c891201f3071c3ab2", "footprintUuid": "f499007f726c45dbbd59d7d6a82bc126", "mpn": "CL10B103KB8NNNC", "kind": "C", "value": "10nF", "package": "0603", "tolerance": "10%", "rating": "50V", "evidence": "projects/beebox/05_schematic_audit/usb_support_search.json", "dielectric": "X7R"}};
async function styleUsbLabels(parts,wireIds){
 const jp=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(parts.J1.getState_PrimitiveId());
 const capPins={};for(const ref of ['C21','C22'])capPins[ref]=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(parts[ref].getState_PrimitiveId());
 for(const ref of ['C21','C22']){const pins=capPins[ref],one=pins.find(p=>String(p.getState_PinNumber())==='1'),two=pins.find(p=>String(p.getState_PinNumber())==='2');if(!one||!two||one.getState_X()!==two.getState_X()||one.getState_Y()<=two.getState_Y())throw Error(ref+': refusing bypass routing that crosses capacitor terminals; measured pin1 must be above pin2');}
 const left=Math.min(...jp.map(p=>p.getState_X())),right=Math.max(...jp.map(p=>p.getState_X()));const edits=[];
 const jNets={A1B12:'GND',B1A12:'GND',A4B9:'VBUS_USB',B4A9:'VBUS_USB','1':'GND','2':'GND','3':'GND','4':'GND'};
 for(const id of new Set(wireIds)){
  const w=await eda.sch_PrimitiveWire.get(id);if(!w)continue;
  const line=w.getState_Line();let label=null;
  if(line.length===4){
   const p=jp.find(p=>jNets[String(p.getState_PinNumber())]&&p.getState_Y()===line[1]&&p.getState_Y()===line[3]&&(p.getState_X()===line[0]||p.getState_X()===line[2]));
   if(p){const isRight=p.getState_X()===right;const net=jNets[String(p.getState_PinNumber())];
    // Wire.modify({line}) resets the named net in this client: always pass
    // the canonical net explicitly and obtain fresh attributes afterward.
    await eda.sch_PrimitiveWire.modify(id,{line:[p.getState_X(),p.getState_Y(),isRight?right+110:left-70,p.getState_Y()],net});
    label={x:isRight?right+70:left-60,y:-p.getState_Y(),rotation:0,value:net,valueVisible:true};
   }
  }
  // Remove unnecessary dangling capacitor tails, keeping the complete
  // three-segment bypass connection and a single explicit rail label.
  if(line.length>4&&(w.getState_Net()==='VBUS_USB'||w.getState_Net()==='GND')){
   const net=w.getState_Net(),num=net==='VBUS_USB'?'1':'2';
   const a=capPins.C21.find(p=>String(p.getState_PinNumber())===num),b=capPins.C22.find(p=>String(p.getState_PinNumber())===num);
   if(line.includes(a.getState_X())&&line.includes(b.getState_X())){
    const ax=a.getState_X(),ay=a.getState_Y(),bx=b.getState_X(),by=b.getState_Y();
    const railY=net==='VBUS_USB'?Math.max(ay,by)+25:Math.min(ay,by)-25;
    await eda.sch_PrimitiveWire.modify(id,{line:[[ax,ay,ax,railY],[ax,railY,bx,railY],[bx,railY,bx,by]],net});
    label={x:(ax+bx)/2,y:-railY,rotation:0,value:net,valueVisible:true};
   }
  }
  // Verified client quirk: Attribute.modify accepts native downward-positive
  // Y, while Attribute.getState_Y and component/pin APIs expose upward-positive
  // Y. Keep this explicit adapter scoped to attribute writes only.
  if(label){const attrs=await eda.sch_PrimitiveAttribute.getAll(id);let first=true;
   for(const a of attrs){if(a.getState_Key()!=='Name')continue;// PDF export ignores valueVisible=false on duplicate Name attributes in
    // this client. Retire only the redundant display attribute; retain the
    // first explicit Name/net and verify the exported native pin map afterward.
    const params=first?label:{key:'',value:'',keyVisible:false,valueVisible:false};first=false;
    await eda.sch_PrimitiveAttribute.modify(a.getState_PrimitiveId(),params);edits.push({wire:id,attribute:a.getState_PrimitiveId(),...params});
   }
  }
 }
 return edits;
}
/* Geometry-measured USB checkpoint, part of section 01. */
return await (async()=>{
 const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
 const project=await eda.dmt_Project.getCurrentProjectInfo();
 if(page.uuid!=='d5e34c82cc3ba89c'||project.uuid!=='d84c4be0ef2e467fa17955faa23c6314')throw Error('Wrong project/page');
 const refs=['J1','D6','R6','R7','C21','C22'];
 const existing=await eda.sch_PrimitiveComponent.getAll();
 for(const c of existing)if(refs.includes(c.getState_Designator()))throw Error('USB checkpoint already present; inspect before rework');
 const records={J1:await pick('TYPE-C-31-M-12','id:TYPE-C-31-M-12','J1'),D6:await pick('USBLC6-2SC6','id:USBLC6-2SC6','D6')};
 for(const ref of refs.slice(2))records[ref]=await pickPassive(ref,PASSIVE_LIBRARY[ref].kind,PASSIVE_LIBRARY[ref].value);
 const created=[],wireIds=[],graphics=[];const parts={};let stage='initialization';
 async function pins(ref){return await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(parts[ref].getState_PrimitiveId());}
 async function pin(ref,num){const p=(await pins(ref)).find(p=>String(p.getState_PinNumber())===String(num));if(!p)throw Error(`Missing physical pin ${ref}.${num}`);return p;}
 async function move(ref,x,y,rotation){await eda.sch_PrimitiveComponent.modify(parts[ref].getState_PrimitiveId(),{x,y,...(rotation===undefined?{}:{rotation})});}
 function bounds(ps){return {left:Math.min(...ps.map(p=>p.getState_X())),right:Math.max(...ps.map(p=>p.getState_X())),top:Math.max(...ps.map(p=>p.getState_Y())),bottom:Math.min(...ps.map(p=>p.getState_Y()))};}
 function point(p){return [p.getState_X(),p.getState_Y()];}
 async function wire(line,net){
  // EasyEDA requires an array of four-coordinate segments for a routed wire,
  // not a flattened polyline. Remove zero-length segments before creation.
  const segments=[];for(let i=0;i<line.length-2;i+=2){const s=line.slice(i,i+4);if(!s.every(Number.isFinite))throw Error(`Nonfinite wire ${net}`);if(s[0]!==s[2]&&s[1]!==s[3])throw Error(`Diagonal wire ${net}`);if(s[0]!==s[2]||s[1]!==s[3])segments.push(s);}
  if(!segments.length)return;
  const w=await eda.sch_PrimitiveWire.create(segments.length===1?segments[0]:segments,net);if(!w)throw Error(`Wire creation failed ${net}`);wireIds.push(w.getState_PrimitiveId());
 }
 async function stub(p,net,length=35){const r=p.getState_Rotation()*Math.PI/180;const dx=Math.round(Math.cos(r)),dy=Math.round(Math.sin(r));const [x,y]=point(p);await wire([x,y,x+dx*length,y+dy*length],net);}
 async function route(p,q,net,lane){const a=point(p),b=point(q);await wire([a[0],a[1],lane,a[1],lane,b[1],b[0],b[1]],net);}
 try{
  // Measure actual pins first; no electrical wires are created until placement is verified.
  for(const ref of refs){stage=`place ${ref}`;parts[ref]=await placeIC(records[ref],0,0,refs.indexOf(ref)>1?90:0,ref);created.push(parts[ref].getState_PrimitiveId());
   if(PASSIVE_LIBRARY[ref])await eda.sch_PrimitiveComponent.modify(parts[ref].getState_PrimitiveId(),{name:PASSIVE_LIBRARY[ref].value});
  }
  stage='geometry placement';
  await eda.sch_PrimitiveComponent.modify(parts.J1.getState_PrimitiveId(),{mirror:true});
  const jb=bounds(await pins('J1')),db=bounds(await pins('D6'));
  const origin={x:100,y:3000};
  const jx=origin.x-jb.left+60,jy=origin.y;
  await move('J1',jx,jy);
  const placedJ=bounds(await pins('J1'));
  // Reserve CC routes/caps between connector and ESD, based on measured pin span.
  const dx=placedJ.right+340-db.left;
  await move('D6',dx,jy);
  const positions={R6:[placedJ.right+100,placedJ.top+105],R7:[placedJ.right+170,placedJ.bottom-85],C21:[jx,placedJ.bottom-200],C22:[jx+130,placedJ.bottom-200]};
  for(const ref of refs.slice(2)){
   let a=await pin(ref,'1'),b=await pin(ref,'2');
   if(a.getState_Y()<b.getState_Y())await move(ref,0,0,270);
   await move(ref,...positions[ref]);
  }
  for(const num of ['B8','A8']){
   const marked=await eda.sch_PrimitivePin.modify(await pin('J1',num),{noConnected:true});
   if(!marked||marked.getState_NoConnected()!==true)throw Error(`NC marker failed J1.${num}`);
  }
  // Local USB data connections: connector-side nets enter the flow-through ESD
  // pins; MCU-side nets leave pins6/4, enforcing the intended protection route.
  stage='local wires';
  const d1=await pin('D6','1'),d3=await pin('D6','3');
  for(const num of ['A6','B6'])await route(await pin('J1',num),d1,'USB_DP_CONN',placedJ.right+40);
  for(const num of ['A7','B7'])await route(await pin('J1',num),d3,'USB_DN_CONN',placedJ.right+65);
  await stub(await pin('D6','6'),'USB_D_P',70);await stub(await pin('D6','4'),'USB_D_N',70);
  for(const [ref,num,net] of [['R6','A5','USB_CC1'],['R7','B5','USB_CC2']]){
   const a=await pin('J1',num),b=await pin(ref,'1');
   await route(a,b,net,placedJ.right+15);await stub(await pin(ref,'2'),'GND',35);
  }
  // Bulk and HF bypass share visibly wired local supply and ground buses.
  for(const n of ['1','2']){const a=await pin('C21',n),b=await pin('C22',n);const [ax,ay]=point(a),[bx,by]=point(b);const railY=n==='1'?Math.max(ay,by)+25:Math.min(ay,by)-25;await wire([ax,ay,ax,railY,bx,railY,bx,by],n==='1'?'VBUS_USB':'GND');}
  await stub(await pin('C21','1'),'VBUS_USB',35);await stub(await pin('C21','2'),'GND',35);
  for(const num of ['A4B9','B4A9'])await stub(await pin('J1',num),'VBUS_USB',10);
  for(const num of ['A1B12','B1A12','1','2','3','4'])await stub(await pin('J1',num),'GND',10);
  await stub(await pin('D6','2'),'GND',40);await stub(await pin('D6','5'),'VBUS_USB',40);
  const all=[];for(const ref of refs)all.push(...await pins(ref));
  const bb=bounds(all);const frame={left:bb.left-90,right:bb.right+140,top:bb.top+95,bottom:bb.bottom-95};
  if(frame.left<0||frame.right>4680||frame.top>3310||frame.bottom<0)throw Error('USB measured bounds outside A0 area');
  stage='section rectangle';
  const rectangle=await eda.sch_PrimitiveRectangle.create(frame.left,frame.top,frame.right-frame.left,frame.top-frame.bottom,0,0,'#555555',null,1);
  if(!rectangle)throw Error('Frame creation failed');graphics.push({kind:'rectangle',id:rectangle.getState_PrimitiveId()});
  stage='section heading';
  const heading=await eda.sch_PrimitiveText.create(frame.left+20,frame.top-25,'01A  USB-C INPUT / CC / ST USB ESD',0,'#222222',null,12,true);
  if(!heading)throw Error('Heading creation failed');graphics.push({kind:'text',id:heading.getState_PrimitiveId()});
  stage='readability attributes';
  const labelEdits=await styleUsbLabels(parts,wireIds);
  const readback=[];
  for(const ref of refs){const c=await eda.sch_PrimitiveComponent.get(parts[ref].getState_PrimitiveId());if(c.getState_Designator()!==ref||c.getState_ManufacturerId()!==records[ref].manufacturerId)throw Error(`Identity mismatch ${ref}`);if(PASSIVE_LIBRARY[ref]&&c.getState_Name()!==PASSIVE_LIBRARY[ref].value)throw Error(`Displayed value mismatch ${ref}: ${c.getState_Name()}`);readback.push({ref,id:c.getState_PrimitiveId(),mpn:c.getState_ManufacturerId(),value:c.getState_Name(),x:c.getState_X(),y:c.getState_Y(),pins:(await pins(ref)).map(p=>({number:p.getState_PinNumber(),name:p.getState_PinName(),x:p.getState_X(),y:p.getState_Y()}))});}
  return {section:'01A_USB_CHECKPOINT_NOT_FULL_POWER',readback,wireIds,graphics,frame,labelEdits,assumptions:['No USB-PD negotiation;5V sink only','Higher USB current requires validated source advertisement/enumeration control','Complete power section still requires fuse/protected VBUS,external input,mux and charging circuits'],visualVerdict:'REQUIRES_ACTUAL_EXPORT_INSPECTION'};
 }catch(e){
  if(wireIds.length)await eda.sch_PrimitiveWire.delete(wireIds);
  if(created.length)await eda.sch_PrimitiveComponent.delete(created);
  for(const g of graphics)await(g.kind==='text'?eda.sch_PrimitiveText:eda.sch_PrimitiveRectangle).delete([g.id]);
  throw Error(`USB checkpoint failed at ${stage}: ${e.message}`);
 }
})();
