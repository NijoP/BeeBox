const project=await eda.dmt_Project.getCurrentProjectInfo();
const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
if(!project || project.uuid!=='d84c4be0ef2e467fa17955faa23c6314') throw Error('Refusing backup: active project is not BEEBOX: '+JSON.stringify(project));
const source=await eda.sys_FileManager.getDocumentSource();
if(typeof source!=='string'||!source.length) throw Error('Native document source unavailable');
const components=await eda.sch_PrimitiveComponent.getAll();
const wires=await eda.sch_PrimitiveWire.getAll();
return {project,page,source,components:components.map(c=>c.toJSON?c.toJSON():c),wires:wires.map(w=>w.toJSON?w.toJSON():w)};
