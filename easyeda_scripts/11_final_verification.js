// Live readback only. This is not final schematic approval.
const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
const project=await eda.dmt_Project.getCurrentProjectInfo();
if(page.uuid!=='d5e34c82cc3ba89c'||project.uuid!=='d84c4be0ef2e467fa17955faa23c6314')throw Error('Wrong project/page');
const components=[];
for(const c of await eda.sch_PrimitiveComponent.getAll()){
 const id=c.getState_PrimitiveId();const pins=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(id);
 components.push({id,type:c.getState_ComponentType(),ref:c.getState_Designator(),name:c.getState_Name(),mpn:c.getState_ManufacturerId(),manufacturer:c.getState_Manufacturer(),symbol:c.getState_Symbol(),pins:pins.map(p=>({number:p.getState_PinNumber(),name:p.getState_PinName(),x:p.getState_X(),y:p.getState_Y(),noConnected:p.getState_NoConnected()===true}))});
}
const wires=(await eda.sch_PrimitiveWire.getAll()).map(w=>({id:w.getState_PrimitiveId(),net:w.getState_Net(),line:w.getState_Line()}));
return {status:'READBACK_NOT_FINAL_APPROVAL',projectUuid:project.uuid,pageUuid:page.uuid,components,wires,requiredRemainingChecks:['complete released physical-pin canonical dictionary','native netlist parity','strict native ERC','actual PDF/PNG visual review']};
