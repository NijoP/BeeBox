const PROJECT='d84c4be0ef2e467fa17955faa23c6314';
const PAGE='d5e34c82cc3ba89c';
const project=await eda.dmt_Project.getCurrentProjectInfo();
const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
if(project?.uuid!==PROJECT||page?.uuid!==PAGE)throw new Error('Wrong live target');
const source=await eda.sys_FileManager.getDocumentSource();
if(typeof source!=='string'||!source.length)throw new Error('No recovery source');
const net='__BEEBOX_NETPORT_PREFLIGHT__';
let result;
try {
  const method=typeof eda?.sch_PrimitiveComponent?.createNetPort;
  if(method!=='function')throw new Error('createNetPort unavailable');
  const stub=await eda.sch_PrimitiveWire.create([2500,2000,2512,2000],net);
  if(!stub)throw new Error('stub create failed');
  const port=await eda.sch_PrimitiveComponent.createNetPort('BI',net,2512,2000,0,false);
  if(!port)throw new Error('createNetPort returned undefined');
  result={method,stubId:stub.getState_PrimitiveId(),stubNet:stub.getState_Net?.(),portId:port.getState_PrimitiveId(),portNet:port.getState_Net?.(),componentType:port.getState_ComponentType?.(),x:port.getState_X?.(),y:port.getState_Y?.()};
  if(result.portNet!==net)throw new Error('Net-port readback mismatch: '+JSON.stringify(result));
} finally {
  const restored=await eda.sys_FileManager.setDocumentSource(source);
  if(restored!==true)throw new Error('rollback failed');
}
return {...result,rollback:'PASS',componentsAfterRollback:(await eda.sch_PrimitiveComponent.getAll()).length,wiresAfterRollback:(await eda.sch_PrimitiveWire.getAll()).length};
