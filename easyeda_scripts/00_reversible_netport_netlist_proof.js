const PROJECT='d84c4be0ef2e467fa17955faa23c6314',PAGE='d5e34c82cc3ba89c';
const project=await eda.dmt_Project.getCurrentProjectInfo(),page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
if(project?.uuid!==PROJECT||page?.uuid!==PAGE)throw new Error('Wrong live target');
const source=await eda.sys_FileManager.getDocumentSource();if(!source)throw new Error('No recovery source');
let proof;
try{
  const components=await eda.sch_PrimitiveComponent.getAll();
  const byRef=new Map(components.map(c=>[c.getState_Designator?.(),c]));
  const j1=byRef.get('J1'),d6=byRef.get('D6');if(!j1||!d6)throw new Error('USB proof components missing');
  const jp=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(j1.getState_PrimitiveId());
  const dp=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(d6.getState_PrimitiveId());
  const pins=[jp.find(p=>String(p.getState_PinNumber())==='A6'),jp.find(p=>String(p.getState_PinNumber())==='B6'),dp.find(p=>String(p.getState_PinNumber())==='1')];
  if(pins.some(p=>!p))throw new Error('USB proof physical pins missing');
  const wires=await eda.sch_PrimitiveWire.getAll();
  const old=wires.find(w=>w.getState_Net?.()==='USB_DP_CONN'&&(w.getState_Line?.()||[]).includes(570));if(!old)throw new Error('USB_DP_CONN long wire not found');
  await eda.sch_PrimitiveWire.delete(old.getState_PrimitiveId());
  const created=[];
  for(const p of pins){const x=p.getState_X(),y=p.getState_Y(),r=((p.getState_Rotation()||0)%360+360)%360,dx=(r===180?-1:1);const lx=x+dx*12;
    const w=await eda.sch_PrimitiveWire.create([x,y,lx,y],'USB_DP_CONN');const port=await eda.sch_PrimitiveComponent.createNetPort('BI','USB_DP_CONN',lx,y,0,false);
    if(!w||!port||port.getState_Net?.()!=='USB_DP_CONN')throw new Error('temporary electrical net-port creation failed');
    created.push({pin:String(p.getState_PinNumber()),wire:w.getState_PrimitiveId(),port:port.getState_PrimitiveId(),x:lx,y});
  }
  const f=await eda.sch_ManufactureData.getNetlistFile('beebox_netport_proof','EasyEDA');if(!f)throw new Error('native netlist unavailable');
  proof={created,fileName:f.name,netlist:await f.text()};
} finally {
  const restored=await eda.sys_FileManager.setDocumentSource(source);if(restored!==true)throw new Error('proof rollback failed');
}
return {...proof,rollback:'PASS',componentsAfterRollback:(await eda.sch_PrimitiveComponent.getAll()).length,wiresAfterRollback:(await eda.sch_PrimitiveWire.getAll()).length};
