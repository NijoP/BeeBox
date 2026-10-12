/* STATUS_TEST test-point completion. Uses verified one-pin 5011-Testpointblack record. */
const dlist = await eda.lib_Device.search('5011-Testpointblack');
const d = dlist.find(x => x.manufacturerId === '5011-Testpointblack');
if (!d) throw new Error('missing one-pin testpoint 5011-Testpointblack');
const nets = ['GND','+3V3','VSYS','VDOCK','I2C_MAIN_SDA','I2C_MAIN_SCL','I2S_BCLK','I2S_WS','I2S_SD','USB_D_P','USB_D_N','ESP_EN'];
for (let i=0;i<nets.length;i++) {
  const ref = `TP${i+1}`;
  const ids = await eda.sch_PrimitiveComponent.getAllPrimitiveId(undefined,true);
  for (const id of ids) { const old=await eda.sch_PrimitiveComponent.get(id); if (old && old.getState_Designator && old.getState_Designator()===ref) throw new Error(`duplicate existing designator ${ref}`); }
  const c = await eda.sch_PrimitiveComponent.create({libraryUuid:d.libraryUuid,uuid:d.uuid}, 2600+(i%4)*220, 2300+Math.floor(i/4)*260, undefined, 0, false, true, true);
  await eda.sch_PrimitiveComponent.modify(c,{designator:ref,name:ref,manufacturer:d.manufacturer,manufacturerId:d.manufacturerId,otherProperty:{Package:d.footprintName}});
  const p=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.getState_PrimitiveId());
  if (p.length!==1) throw new Error(`${ref} is not one-pin`);
  await eda.sch_PrimitiveWire.create([p[0].getState_X(),p[0].getState_Y(),p[0].getState_X()+40,p[0].getState_Y()],nets[i]);
}
return {section:'STATUS_TEST_POINTS',count:nets.length,nets};
