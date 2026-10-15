/* BeeBox whole-schematic live verification. Read-only; never promotes missing checks to PASS. */
const BUILD_ID='BEEBOX-VERIFY-20261015-R1';
const TARGET_PROJECT='d84c4be0ef2e467fa17955faa23c6314';
const TARGET_PAGE='d5e34c82cc3ba89c';
const REQUIRED_REFS=['J1','D6','F1','R6','R7','C21','C22','U2','U6','U11','J4','U3','Q1','L1','U1','U4','U7','MIC1','U12','D5','J2','U8','MIC2','U9','D2','D3','D4','R1','R2','R3',...Array.from({length:12},(_,i)=>`TP${i+1}`)];
const EXPECTED_REVIEWED_PINS={
 D6:{'1':'USB_DP_CONN','2':'GND','3':'USB_DN_CONN','4':'USB_D_N','5':'VBUS_USB','6':'USB_D_P'},
 J1:{A1B12:'GND',A4B9:'VBUS_USB',B8:null,A5:'USB_CC1',B7:'USB_DN_CONN',A6:'USB_DP_CONN',A7:'USB_DN_CONN',B6:'USB_DP_CONN',A8:null,B5:'USB_CC2',B4A9:'VBUS_USB',B1A12:'GND','1':'GND','2':'GND','3':'GND','4':'GND'},
 J4:{'1':'VBAT','2':'GND'},
 R6:{'1':'USB_CC1','2':'GND'},R7:{'1':'USB_CC2','2':'GND'},C21:{'1':'VBUS_USB','2':'GND'},C22:{'1':'VBUS_USB','2':'GND'},
};
return await (async()=>{
 const started=Date.now(),project=await eda.dmt_Project.getCurrentProjectInfo(),page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
 if(project?.uuid!==TARGET_PROJECT||page?.uuid!==TARGET_PAGE)throw new Error(`Wrong project/page ${project?.uuid}/${page?.uuid}`);
 const components=[],byRef=new Map(),duplicateRefs=[];
 for(const c of await eda.sch_PrimitiveComponent.getAll()){
  const id=c.getState_PrimitiveId(),ref=c.getState_Designator?.(),pins=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(id);
  const item={id,ref,type:c.getState_ComponentType?.(),name:c.getState_Name?.(),mpn:c.getState_ManufacturerId?.(),manufacturer:c.getState_Manufacturer?.(),x:c.getState_X?.(),y:c.getState_Y?.(),pins:pins.map(p=>({number:String(p.getState_PinNumber()),name:p.getState_PinName(),x:p.getState_X(),y:p.getState_Y(),noConnect:p.getState_NoConnected()===true}))};
  components.push(item);if(ref){if(byRef.has(ref))duplicateRefs.push(ref);else byRef.set(ref,item);}
 }
 const wires=(await eda.sch_PrimitiveWire.getAll()).map(w=>({id:w.getState_PrimitiveId(),net:w.getState_Net(),line:w.getState_Line()}));
 const missingRequiredRefs=REQUIRED_REFS.filter(ref=>!byRef.has(ref));
 const reviewedPinInventory=[];
 for(const [ref,map] of Object.entries(EXPECTED_REVIEWED_PINS)){
  const actual=byRef.get(ref);if(!actual){reviewedPinInventory.push({ref,status:'VERIFIED_FAIL',reason:'component missing'});continue;}
  const observed=actual.pins.map(p=>p.number),expected=Object.keys(map),missing=expected.filter(x=>!observed.includes(x)),extra=observed.filter(x=>!expected.includes(x));
  const ncErrors=actual.pins.filter(p=>Object.prototype.hasOwnProperty.call(map,p.number)&&((map[p.number]===null)!==p.noConnect)).map(p=>({pin:p.number,expectedNet:map[p.number],observedNoConnect:p.noConnect}));
  reviewedPinInventory.push({ref,status:missing.length||extra.length||ncErrors.length?'VERIFIED_FAIL':'VERIFIED_PASS',missing,extra,ncErrors,note:'Pin inventory/NC only; native net membership requires independent netlist/readback'});
 }
 const nonFinite=components.filter(c=>![c.x,c.y].every(Number.isFinite)).map(c=>c.ref||c.id);
 const outOfBounds=components.filter(c=>Number.isFinite(c.x)&&Number.isFinite(c.y)&&(c.x<100||c.x>4550||c.y<100||c.y>3050)).map(c=>({ref:c.ref,id:c.id,x:c.x,y:c.y}));
 const electricalStatus=missingRequiredRefs.length||duplicateRefs.length||reviewedPinInventory.some(x=>x.status==='VERIFIED_FAIL')?'VERIFIED_FAIL':'NOT_TESTED';
 return {buildId:BUILD_ID,status:electricalStatus,elapsedMs:Date.now()-started,projectUuid:project.uuid,pageUuid:page.uuid,
  inventory:{componentObjects:components.length,wires:wires.length,missingRequiredRefs,duplicateRefs:[...new Set(duplicateRefs)],nonFinite,outOfBounds},
  reviewedPinInventory,components,wires,
  checks:{exactMpnAndFootprint:'NOT_TESTED_FOR_WHOLE_DESIGN',physicalPinInventory:reviewedPinInventory.every(x=>x.status==='VERIFIED_PASS')?'VERIFIED_PASS_SUBSET_ONLY':'VERIFIED_FAIL',canonicalNetComparison:'NOT_TESTED_NATIVE_NETLIST_UNAVAILABLE_OR_TIMEOUT_PRONE',nativeErc:'NOT_TESTED_RUN_IN_GUI_AND_RETAIN_RESULTS',pdfVisualReview:'NOT_TESTED_REQUIRES_REAL_EASYEDA_EXPORT',fpcBoardAssignment:'VERIFIED_FAIL_PAGE_NOT_PRESENT'},
  release:'BLOCKED_NOT_MANUFACTURING_READY'};
})();
