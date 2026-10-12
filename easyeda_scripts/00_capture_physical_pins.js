const components=[];
for(const c of await eda.sch_PrimitiveComponent.getAll()) {
 const id=c.getState_PrimitiveId();
 const pins=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(id);
 components.push({id,ref:c.getState_Designator(),name:c.getState_Name(),mpn:c.getState_ManufacturerId(),manufacturer:c.getState_Manufacturer(),device:c.getState_Component(),footprint:c.getState_Footprint(),x:c.getState_X(),y:c.getState_Y(),pins:pins.map(p=>({number:p.getState_PinNumber(),name:p.getState_PinName(),x:p.getState_X(),y:p.getState_Y(),rotation:p.getState_Rotation()}))});
}
const wires=(await eda.sch_PrimitiveWire.getAll()).map(w=>({id:w.getState_PrimitiveId(),line:w.getState_Line(),net:w.getState_Net()}));
return {components,wires};
