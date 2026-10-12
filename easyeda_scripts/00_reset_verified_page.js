// Execute only after native recovery evidence has been saved and inspected.
const project=await eda.dmt_Project.getCurrentProjectInfo();
const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
if(project.uuid!=='d84c4be0ef2e467fa17955faa23c6314'||page.uuid!=='d5e34c82cc3ba89c')throw Error('Wrong project/page; refusing reset');
const components=await eda.sch_PrimitiveComponent.getAll();
const wires=await eda.sch_PrimitiveWire.getAll();
// This observed page inventory contains circuit devices only; refuse an
// unexpected inventory rather than deleting an unknown drawing/title symbol.
if(components.length!==55 || components.some(c=>!c.getState_Designator()))throw Error('Inventory changed; take a new native backup first');
await eda.sch_PrimitiveWire.delete(wires.map(w=>w.getState_PrimitiveId()));
await eda.sch_PrimitiveComponent.delete(components.map(c=>c.getState_PrimitiveId()));
const afterComponents=await eda.sch_PrimitiveComponent.getAll();
const afterWires=await eda.sch_PrimitiveWire.getAll();
if(afterComponents.length||afterWires.length)throw Error('Reset not complete; do not rebuild');
return {project:project.uuid,page:page.uuid,removedComponents:components.length,removedWires:wires.length,componentCount:0,wireCount:0,preservedTitleBlock:await eda.dmt_Schematic.getCurrentSchematicPageInfo()};
