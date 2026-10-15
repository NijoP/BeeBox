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
 *   - Connect BY NET NAME (arg 2 of sch_PrimitiveWire.create). Use SHORT stubs
 *     (long collinear stubs from adjacent parts auto-merge → shorts).
 *   - Never search()[0] for an IC — token-match, reject array parts.
 *   - Verify a picked part by its manufacturerId, not the search string.
 *   - One schematic, multiple PAGES — never separate schematic files.
 */

/* ============================ ENGINE (do not edit) ============================ */
const OUT = 40;                              // short stub length (units) — see hard rules
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
  if (verified) return await getReviewedRecord(verified);
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
  return await getReviewedRecord(spec);
}
function pinDir(pin, mx, my) {                        // stub direction from rotation + centroid
  const r = ((+pin.rotation || 0) % 360 + 360) % 360;
  if (r === 0 || r === 180) return [Math.sign(pin.x - mx) || 1, 0];
  return [0, Math.sign(pin.y - my) || 1];
}
async function wirePins(comp, pinMap, ref) {
  const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(comp.getState_PrimitiveId());
  let mx = 0, my = 0; for (const p of pins) { mx += p.getState_X(); my += p.getState_Y(); }
  mx /= pins.length; my /= pins.length;
  for (const p of pins) {
    const physical=DEVICE_LIBRARY[ref] && DEVICE_LIBRARY[ref].physicalPinNets;
    const map=physical || pinMap;
    const key=physical ? String(p.getState_PinNumber()) : p.getState_PinName();
    if (!Object.prototype.hasOwnProperty.call(map, key)) throw new Error(`unmapped pin ${key} on ${comp.getState_PrimitiveId()}`);
    const net = map[key];
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
  if (ref) await eda.sch_PrimitiveComponent.modify(c.getState_PrimitiveId(),{designator:ref,name:part.name||null,manufacturer:part.manufacturer||null,manufacturerId:part.manufacturerId||null,otherProperty:{Package:part.footprintName||''}});
  const readback = await eda.sch_PrimitiveComponent.get(c.getState_PrimitiveId());
  if (!readback || readback.getState_Designator() !== ref
      || readback.getState_ManufacturerId() !== part.manufacturerId)
    throw new Error(`Identity readback failed for ${ref}`);
  return readback;
}
async function placePassive(ref, kind, val, netA, netB, x, y) {
  const part=await pickPassive(ref,kind,val); if (!part) throw new Error(`no ${kind} ${val} for ${ref}`);
  const c=await placeIC(part,x,y,0,ref); await eda.sch_PrimitiveComponent.modify(c.getState_PrimitiveId(),{designator:ref,name:val,manufacturer:part.manufacturer||null,manufacturerId:part.manufacturerId||null,otherProperty:{Package:part.footprintName||'0603'}}); const pins=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.getState_PrimitiveId());
  const verified = await eda.sch_PrimitiveComponent.get(c.getState_PrimitiveId());
  if (!verified || verified.getState_Name() !== val || verified.getState_Designator() !== ref
      || verified.getState_ManufacturerId() !== part.manufacturerId)
    throw new Error(`Passive readback mismatch ${ref}`);
  if (!pins || pins.length!==2) throw new Error(`passive ${ref} must expose exactly two pins`);
  let mx=0,my=0; for (const p of pins) { mx+=p.getState_X(); my+=p.getState_Y(); } mx/=pins.length; my/=pins.length;
  for (const [p,n] of [[pins[0],netA],[pins[1],netB]]) { const px=p.getState_X(),py=p.getState_Y(); const [dx,dy]=pinDir({rotation:p.getState_Rotation(),x:px,y:py},mx,my); await eda.sch_PrimitiveWire.create([px,py,px+dx*OUT,py+dy*OUT],n); }
  return c;
}

const DEVICE_LIBRARY={"D6": {"mpn": "USBLC6-2SC6", "manufacturer": "ST(意法半导体)", "uuid": "5f9a995bc73746278024add8c7b330e3", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C7519", "symbolUuid": "a1ce4cdfd8c34673b2774988c19b159e", "evidence": "projects/beebox/05_schematic_audit/d6_library_search.json; datasheets/ST_USBLC6-2.pdf, Doc ID 11265 Rev 5 Figure 1", "physicalPinNets": {"1": "USB_DP_CONN", "2": "GND", "3": "USB_DN_CONN", "4": "USB_D_N", "5": "VBUS_USB", "6": "USB_D_P"}, "footprintUuid": "136db59d42184a44ac8441e35d752b13", "package": "SOT-23-6_L2.9-W1.6-P0.95-LS2.8-BL"}, "J1": {"manufacturer": "韩国韩荣", "uuid": "730e76758f9742ca9ca85c73f4ec0ecd", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C165948", "symbolUuid": "e30d694d838e433dbe5423a6e817759e", "footprintUuid": "45d257a27a304edd865bdb43b1945b61", "mpn": "TYPE-C-31-M-12", "package": "USB-C_SMD-TYPE-C-31-M-12_1", "evidence": "datasheets/J1_HRO_TYPE_C_31_M_12.pdf manufacturer drawing, reviewed J1_pin_drawing.png; usb_support_search.json C165948", "physicalPinNets": {"A1B12": "GND", "A4B9": "VBUS_USB", "B8": null, "A5": "USB_CC1", "B7": "USB_DN_CONN", "A6": "USB_DP_CONN", "A7": "USB_DN_CONN", "B6": "USB_DP_CONN", "A8": null, "B5": "USB_CC2", "B4A9": "VBUS_USB", "B1A12": "GND", "1": "GND", "2": "GND", "3": "GND", "4": "GND"}}};const PASSIVE_LIBRARY={"R6": {"manufacturer": "UNI-ROYAL(厚声)", "uuid": "5e5266518f0e41f791738aa9f7251c1d", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C23186", "symbolUuid": "b4fa75aca573465ea40a9fa52694d51f", "footprintUuid": "b44c1b381d26462586b8a8d9fac22ec8", "mpn": "0603WAF5101T5E", "kind": "R", "value": "5.1k", "package": "0603", "tolerance": "1%", "rating": "100mW,75V", "evidence": "projects/beebox/05_schematic_audit/usb_support_search.json"}, "R7": {"manufacturer": "UNI-ROYAL(厚声)", "uuid": "5e5266518f0e41f791738aa9f7251c1d", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C23186", "symbolUuid": "b4fa75aca573465ea40a9fa52694d51f", "footprintUuid": "b44c1b381d26462586b8a8d9fac22ec8", "mpn": "0603WAF5101T5E", "kind": "R", "value": "5.1k", "package": "0603", "tolerance": "1%", "rating": "100mW,75V", "evidence": "projects/beebox/05_schematic_audit/usb_support_search.json"}, "C21": {"manufacturer": "SAMSUNG(三星)", "uuid": "e17be92a8eac408885c635361c15f72c", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C107365", "symbolUuid": "b1d9f24967ef4fe499c86faec02c4ca4", "footprintUuid": "9376364c15854e01b3fabcf032810a22", "mpn": "CL21B475KOFNNNE", "kind": "C", "value": "4.7uF", "package": "0805", "tolerance": "10%", "rating": "16V", "dielectric": "X7R", "evidence": "datasheets/C21_Samsung_CL21B475KOFNNNE.pdf: Samsung part numbering; c21_inrush_revision_search.json; TI_BQ24074.pdf section9.3.1 USB inrush discussion:10uF total ceiling"}, "C22": {"manufacturer": "SAMSUNG(三星)", "uuid": "860ad348098247a18e65be2d4651b260", "libraryUuid": "0819f05c4eef4c71ace90d822a990e87", "supplierId": "C1589", "symbolUuid": "aa71f1470a514f8c891201f3071c3ab2", "footprintUuid": "f499007f726c45dbbd59d7d6a82bc126", "mpn": "CL10B103KB8NNNC", "kind": "C", "value": "10nF", "package": "0603", "tolerance": "10%", "rating": "50V", "evidence": "projects/beebox/05_schematic_audit/usb_support_search.json", "dielectric": "X7R"}};const wireIds=["5d61b9dfeafb9edb", "5d61b9dfeafb9edb", "1a8e8e17b31eb27e", "1a8e8e17b31eb27e", "e9a47c8d86534b52", "71199dddbffa1ac6", "ca5d86bce3cd55f6", "719d1c5be03c265b", "d09c64840aefe45d", "e5169d205cda59d8", "851fdfd2656e5f0c", "f6facdb3ff873d3f", "851fdfd2656e5f0c", "f6facdb3ff873d3f", "638a6a0ca74aeec3", "9c23d2d74d3efac2", "ec1b9ea448460651", "0787bf658ccc130c", "fc272aedb4bb9956", "30239fb2fc2e2a8b", "855033ca6aa3e475", "61f372024d8c1361", "debf66ba43b2dcf6", "331a6f449f253a98"];
async function styleUsbLabels(parts,wireIds){
 const jp=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(parts.J1.getState_PrimitiveId());
 const capPins={};for(const ref of ['C21','C22'])capPins[ref]=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(parts[ref].getState_PrimitiveId());
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

const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();if(page.uuid!=='d5e34c82cc3ba89c')throw Error('Wrong page');
const parts={};for(const c of await eda.sch_PrimitiveComponent.getAll())if(['J1','D6','R6','R7','C21','C22'].includes(c.getState_Designator()))parts[c.getState_Designator()]=c;
if(Object.keys(parts).length!==6||parts.C21.getState_ManufacturerId()!=='GRM21BR71A106KE51L')throw Error('Unexpected C21/current USB state');
const record=await pickPassive('C21','C','4.7uF');const old=parts.C21;const source=await eda.sys_FileManager.getDocumentSource();let created;
try{
 created=await placeIC(record,0,0,270,'TEMP_C21_VERIFIED');
 let pp=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(created.getState_PrimitiveId());
 if(pp.length!==2)throw Error('C21 physical pin count');
 if(pp.find(p=>String(p.getState_PinNumber())==='1').getState_Y()<pp.find(p=>String(p.getState_PinNumber())==='2').getState_Y())await eda.sch_PrimitiveComponent.modify(created.getState_PrimitiveId(),{rotation:270});
 await eda.sch_PrimitiveComponent.delete(old.getState_PrimitiveId());
 await eda.sch_PrimitiveComponent.modify(created.getState_PrimitiveId(),{x:old.getState_X(),y:old.getState_Y(),designator:'C21',name:'4.7uF'});
 parts.C21=await eda.sch_PrimitiveComponent.get(created.getState_PrimitiveId());
 const labelEdits=await styleUsbLabels(parts,wireIds);
 if(parts.C21.getState_Name()!=='4.7uF'||parts.C21.getState_ManufacturerId()!==record.manufacturerId)throw Error('C21 identity/value readback');
 return {engineeringReason:'USB total capacitance ceiling10uF incl tolerance;10uF bulk alone already exceeds it.4.7uF +/-10% leaves budget for other USB-side bypasses. Full inrush budget still must be verified.',oldId:old.getState_PrimitiveId(),newId:created.getState_PrimitiveId(),mpn:record.manufacturerId,value:parts.C21.getState_Name(),labelEdits};
}catch(e){const now=await eda.dmt_Schematic.getCurrentSchematicPageInfo();if(now.uuid!==page.uuid)throw Error('Refusing source rollback on changed page: '+String(e));await eda.sys_FileManager.setDocumentSource(source);throw e;}
