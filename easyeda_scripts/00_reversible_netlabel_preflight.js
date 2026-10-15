const PROJECT='d84c4be0ef2e467fa17955faa23c6314';
const PAGE='d5e34c82cc3ba89c';
const project=await eda.dmt_Project.getCurrentProjectInfo();
const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
if(project?.uuid!==PROJECT||page?.uuid!==PAGE)throw new Error('Wrong live target');
const source=await eda.sys_FileManager.getDocumentSource();
if(typeof source!=='string'||!source.length)throw new Error('No recovery source');
const net='__BEEBOX_NETLABEL_PREFLIGHT__';
let evidence={project:project.uuid,page:page.uuid,api:typeof eda?.sch_PrimitiveAttribute?.createNetLabel};
try{
  if(evidence.api!=='function')throw new Error('createNetLabel unavailable');
  const stub=await eda.sch_PrimitiveWire.create([2500,2000,2512,2000],net);
  if(!stub)throw new Error('preflight stub create failed');
  const label=await eda.sch_PrimitiveAttribute.createNetLabel(2512,2000,net);
  if(!label)throw new Error('preflight label create failed');
  const stubId=stub.getState_PrimitiveId();
  const labelId=label.getState_PrimitiveId();
  const refreshed=await eda.sch_PrimitiveAttribute.get(labelId);
  evidence={...evidence,stubId,labelId,stubNet:stub.getState_Net?.(),labelValue:refreshed?.getState_Value?.(),labelX:refreshed?.getState_X?.(),labelY:refreshed?.getState_Y?.()};
  if(evidence.labelValue!==net)throw new Error('Electrical net-label readback mismatch: '+JSON.stringify(evidence));
  if(Number(evidence.labelX)!==2512||Number(evidence.labelY)!==2000)throw new Error('Electrical net-label coordinate mismatch: '+JSON.stringify(evidence));
  evidence.preflight='PASS';
} finally {
  const restored=await eda.sys_FileManager.setDocumentSource(source);
  if(restored!==true)throw new Error('Preflight rollback failed');
}
const components=await eda.sch_PrimitiveComponent.getAll();
const wires=await eda.sch_PrimitiveWire.getAll();
return {...evidence,rollback:'PASS',componentsAfterRollback:components.length,wiresAfterRollback:wires.length};
