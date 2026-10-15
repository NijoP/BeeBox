const PROJECT='d84c4be0ef2e467fa17955faa23c6314';
const PAGE='d5e34c82cc3ba89c';
const project=await eda.dmt_Project.getCurrentProjectInfo();
const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
if(project?.uuid!==PROJECT||page?.uuid!==PAGE)throw new Error('Wrong live target');
const source=await eda.sys_FileManager.getDocumentSource();
if(typeof source!=='string'||!source.length)throw new Error('No recovery source');
let dbg={};
try{
  dbg.apiLabel=typeof eda.sch_PrimitiveAttribute?.createNetLabel;
  dbg.apiAttributeGet=typeof eda.sch_PrimitiveAttribute?.get;
  const comps=await eda.sch_PrimitiveComponent.getAll();
  dbg.componentCount=comps.length;
  const wires=await eda.sch_PrimitiveWire.getAll();
  dbg.wireCount=wires.length;
  // Check if any existing object near (100,100)-(112,100)
  const near=comps.filter(c=>Math.abs(c.getState_X()-100)<50 && Math.abs(c.getState_Y()-100)<50);
  dbg.nearComponents=near.length;
  const nearW=wires.filter(w=>{const line=w.getState_Line?.()||[]; for(let i=0;i<line.length;i+=2){if(Math.abs(line[i]-100)<50 && Math.abs(line[i+1]-100)<50)return true;}return false;});
  dbg.nearWires=nearW.length;
  // Try to create a wire first
  const stub=await eda.sch_PrimitiveWire.create([100,100,112,100],'__TEST_NET__');
  dbg.stubCreated=!!stub;
  if(stub){dbg.stubId=stub.getState_PrimitiveId();}
  // Try to create label
  const label=await eda.sch_PrimitiveAttribute.createNetLabel(112,100,'__TEST_NET__');
  dbg.labelCreated=!!label;
  if(label){dbg.labelId=label.getState_PrimitiveId();}
  if(label){
    const refreshed=await eda.sch_PrimitiveAttribute.get(label.getState_PrimitiveId());
    dbg.labelRefreshed=!!refreshed;
    if(refreshed){dbg.labelValue=refreshed.getState_Value();dbg.labelX=refreshed.getState_X();dbg.labelY=refreshed.getState_Y();}
  }
} finally{
  const restored=await eda.sys_FileManager.setDocumentSource(source);
  dbg.restored=restored===true;
}
return dbg;
