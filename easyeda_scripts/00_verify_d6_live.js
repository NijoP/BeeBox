const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();if(page.uuid!=='d5e34c82cc3ba89c')throw Error('Wrong page');
const records=await eda.lib_Device.search('USBLC6-2SC6');
const d=records.find(x=>x.uuid==='5f9a995bc73746278024add8c7b330e3'&&x.supplierId==='C7519'&&x.manufacturerId==='USBLC6-2SC6'&&x.manufacturer.startsWith('ST('));
if(!d)throw Error('Exact ST record unavailable');
let c;try {
 c=await eda.sch_PrimitiveComponent.create({libraryUuid:d.libraryUuid,uuid:d.uuid},0,0,undefined,0,false,false,false);
 if(!c)throw Error('create returned no component');
 const pins=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.getState_PrimitiveId());
 const physical=pins.map(p=>({number:String(p.getState_PinNumber()),name:p.getState_PinName(),x:p.getState_X(),y:p.getState_Y(),rotation:p.getState_Rotation()}));
 if(physical.length!==6||physical.map(p=>p.number).sort().join(',')!=='1,2,3,4,5,6')throw Error('Physical pin inventory mismatch');
 return {device:d,pins:physical,manufacturerPinout:{'1':'I/O1','2':'GND','3':'I/O2','4':'I/O2','5':'VBUS','6':'I/O1'},evidence:'ST Doc ID 11265 Rev5 Figure1',probeOnly:true};
} finally {if(c)await eda.sch_PrimitiveComponent.delete([c.getState_PrimitiveId()]);}
