// Nondestructive recovery probe: reapply the exact current native source to
// the same verified page, then read it back. Never import into another project.
const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
if(page.uuid!=='d5e34c82cc3ba89c')throw Error('Wrong active page');
const source=await eda.sys_FileManager.getDocumentSource();
if(!source)throw Error('Empty source');
const before=(await eda.sch_PrimitiveComponent.getAll()).map(c=>c.getState_Designator()).sort();
const restored=await eda.sys_FileManager.setDocumentSource(source);
if(restored!==true)throw Error('Native source recovery rejected');
const after=(await eda.sch_PrimitiveComponent.getAll()).map(c=>c.getState_Designator()).sort();
if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Recovery inventory mismatch');
return {restored,page,components:after.length,references:after};
