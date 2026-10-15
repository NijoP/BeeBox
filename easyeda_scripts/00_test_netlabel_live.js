const PROJECT='d84c4be0ef2e467fa17955faa23c6314';
const PAGE='d5e34c82cc3ba89c';
const project=await eda.dmt_Project.getCurrentProjectInfo();
const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
if(project?.uuid!==PROJECT||page?.uuid!==PAGE)throw new Error('Wrong live target');
const source=await eda.sys_FileManager.getDocumentSource();
if(typeof source!=='string'||!source.length)throw new Error('No recovery source');
const net='__BEEBOX_NETLABEL_TEST__';
let result;
try{
  if(typeof eda.sch_PrimitiveAttribute?.createNetLabel!=='function')throw new Error('createNetLabel not available');
  const stub=await eda.sch_PrimitiveWire.create([100,100,112,100],net);
  if(!stub)throw new Error('stub create failed');
  const label=await eda.sch_PrimitiveAttribute.createNetLabel(112,100,net);
  if(!label){await eda.sch_PrimitiveWire.delete(stub.getState_PrimitiveId());throw new Error('label create failed');}
  const labelId=label.getState_PrimitiveId();
  const refreshed=await eda.sch_PrimitiveAttribute.get(labelId);
  if(!refreshed||refreshed.getState_Value()!==net){await eda.sch_PrimitiveWire.delete(stub.getState_PrimitiveId());await eda.sch_PrimitiveAttribute.delete(labelId);throw new Error('label readback mismatch');}
  result={stubId:stub.getState_PrimitiveId(),labelId,labelValue:refreshed.getState_Value(),labelX:refreshed.getState_X(),labelY:refreshed.getState_Y()};
} finally{
  const restored=await eda.sys_FileManager.setDocumentSource(source);
  if(restored!==true)throw new Error('rollback failed');
}
return {...result,rollback:'PASS',componentsAfterRollback:(await eda.sch_PrimitiveComponent.getAll()).length,wiresAfterRollback:(await eda.sch_PrimitiveWire.getAll()).length};
