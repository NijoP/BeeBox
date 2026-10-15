#!/usr/bin/env python3
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
d=json.loads((R/'schematic/verified_device_library.json').read_text(encoding='utf8'));p=json.loads((R/'schematic/verified_passive_library.json').read_text(encoding='utf8'))
D={k:d[k] for k in ['J1','D6']};P={k:p[k] for k in ['R6','R7','C21','C22']}
js=r'''/* BeeBox reference-style USB generator: named stubs, no arrow-port clutter. */
const TARGET_PROJECT='d84c4be0ef2e467fa17955faa23c6314',TARGET_PAGE='d5e34c82cc3ba89c';
const D=__D__,P=__P__,REFS=['J1','D6','R6','R7','C21','C22'];
async function reviewed(s){const d=await eda.lib_Device.get(s.uuid,s.libraryUuid),p=d?.property,a=d?.association;if(!d||d.uuid!==s.uuid||p?.manufacturerId!==s.mpn||p?.manufacturer!==s.manufacturer||(s.supplierId&&p?.supplierId!==s.supplierId)||(s.symbolUuid&&a?.symbolUuid!==s.symbolUuid)||(s.footprintUuid&&a?.footprintUuid!==s.footprintUuid))throw Error('identity '+s.mpn);return {uuid:d.uuid,libraryUuid:d.libraryUuid,manufacturer:p.manufacturer,manufacturerId:p.manufacturerId,footprint:p.otherProperty?.['Supplier Footprint']||''};}
const project=await eda.dmt_Project.getCurrentProjectInfo(),page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();if(project?.uuid!==TARGET_PROJECT||page?.uuid!==TARGET_PAGE)throw Error('wrong page');
const old=(await eda.sch_PrimitiveComponent.getAll()).filter(c=>REFS.includes(c.getState_Designator?.()));if(old.length)throw Error('page not empty/duplicate USB refs');
const specs={J1:D.J1,D6:D.D6,R6:P.R6,R7:P.R7,C21:P.C21,C22:P.C22},rec={};for(const r of REFS)rec[r]=await reviewed(specs[r]);const source=await eda.sys_FileManager.getDocumentSource();
async function make(ref,x,y,rotation=0){const q=rec[ref],c=await eda.sch_PrimitiveComponent.create({libraryUuid:q.libraryUuid,uuid:q.uuid},x,y,undefined,rotation,false,true,true);if(!c)throw Error('create '+ref);const id=c.getState_PrimitiveId();await eda.sch_PrimitiveComponent.modify(id,{designator:ref,name:ref,manufacturer:q.manufacturer,manufacturerId:q.manufacturerId,otherProperty:{Package:q.footprint}});return await eda.sch_PrimitiveComponent.get(id);}
async function pmap(c){return new Map((await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.getState_PrimitiveId())).map(p=>[String(p.getState_PinNumber()),p]));}
async function stub(c,p,net,len=150){const x=p.getState_X(),y=p.getState_Y(),r=((p.getState_Rotation()||0)%360+360)%360;let dx=0,dy=0;if(r===0)dx=1;else if(r===180)dx=-1;else if(r===90)dy=1;else if(r===270)dy=-1;else throw Error(`unsupported pin rotation ${r}`);const w=await eda.sch_PrimitiveWire.create([x,y,x+dx*len,y+dy*len],net);if(!w||w.getState_Net?.()!==net)throw Error(`named stub ${net}`);return {pin:p.getState_PinNumber(),net,x,y,exit:[dx,dy],end:[x+dx*len,y+dy*len]};}
try{
 const J1=await make('J1',650,850,0),D6=await make('D6',1250,850,90),R6=await make('R6',700,1200,0),R7=await make('R7',1050,1200,0),C21=await make('C21',1400,1200,0),C22=await make('C22',1700,1200,0);const maps={J1:await pmap(J1),D6:await pmap(D6),R6:await pmap(R6),R7:await pmap(R7),C21:await pmap(C21),C22:await pmap(C22)};
 for(const ref of ['J1','D6']){const got=[...maps[ref].keys()].sort(),want=Object.keys(D[ref].physicalPinNets).sort();if(JSON.stringify(got)!==JSON.stringify(want))throw Error(ref+' pin inventory');}
 const records=[];for(const [n,net] of Object.entries(D.J1.physicalPinNets)){const pin=maps.J1.get(n);if(net==null){const a=pin.toAsync();a.setState_NoConnected(true);await a.done();records.push({pin:n,net:null,nc:true});}else records.push(await stub(J1,pin,net,165));}
 for(const [n,net] of Object.entries(D.D6.physicalPinNets))records.push(await stub(D6,maps.D6.get(n),net,145));
 for(const [ref,a,b] of [['R6','USB_CC1','GND'],['R7','USB_CC2','GND'],['C21','VBUS_USB','GND'],['C22','VBUS_USB','GND']]){const pins=[...maps[ref].values()].sort((x,y)=>x.getState_X()-y.getState_X());records.push(await stub(eval(ref),pins[0],a,120),await stub(eval(ref),pins[1],b,120));}
 await eda.sch_PrimitiveText.create(480,560,'USB-C INPUT / USB2 DATA / CC / ESD',0,'#222222',null,13,true);
 return {status:'USB_REFERENCE_STYLE_CREATED',refs:REFS,records,orientations:{J1:J1.getState_Rotation(),D6:D6.getState_Rotation()}};
}catch(e){await eda.sys_FileManager.setDocumentSource(source);throw e;}
'''.replace('__D__',json.dumps(D,ensure_ascii=False,separators=(',',':'))).replace('__P__',json.dumps(P,ensure_ascii=False,separators=(',',':')))
(R/'easyeda_scripts/01_usb_power_entry.js').write_text(js,encoding='utf8')
