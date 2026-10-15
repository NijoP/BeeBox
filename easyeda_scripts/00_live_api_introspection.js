const project = await eda.dmt_Project.getCurrentProjectInfo();
const page = await eda.dmt_Schematic.getCurrentSchematicPageInfo();
if (project?.uuid !== 'd84c4be0ef2e467fa17955faa23c6314') throw new Error('Wrong project');
if (page?.uuid !== 'd5e34c82cc3ba89c') throw new Error('Wrong page');
const probes = {
  componentCreate: typeof eda?.sch_PrimitiveComponent?.create,
  componentModify: typeof eda?.sch_PrimitiveComponent?.modify,
  componentGetAll: typeof eda?.sch_PrimitiveComponent?.getAll,
  componentGetPins: typeof eda?.sch_PrimitiveComponent?.getAllPinsByPrimitiveId,
  wireCreate: typeof eda?.sch_PrimitiveWire?.create,
  wireGetAll: typeof eda?.sch_PrimitiveWire?.getAll,
  netLabelCreate: typeof eda?.sch_PrimitiveAttribute?.createNetLabel,
  attributeGet: typeof eda?.sch_PrimitiveAttribute?.get,
  attributeGetAll: typeof eda?.sch_PrimitiveAttribute?.getAll,
  rectangleCreate: typeof eda?.sch_PrimitiveRectangle?.create,
  rectangleGetAll: typeof eda?.sch_PrimitiveRectangle?.getAll,
  textCreate: typeof eda?.sch_PrimitiveText?.create,
  textGetAll: typeof eda?.sch_PrimitiveText?.getAll,
  primitiveDelete: typeof eda?.sch_Primitive?.delete,
  componentDelete: typeof eda?.sch_PrimitiveComponent?.delete,
  wireDelete: typeof eda?.sch_PrimitiveWire?.delete,
  documentSourceGet: typeof eda?.sys_FileManager?.getDocumentSource,
  documentSourceSet: typeof eda?.sys_FileManager?.setDocumentSource,
  nativeExport: typeof eda?.sch_ManufactureData?.getExportDocumentFile,
  netlistExport: typeof eda?.sch_ManufactureData?.getNetlistFile,
  drcCheck: typeof eda?.sch_Drc?.check
};
return { project: {uuid:project.uuid,name:project.friendlyName}, page:{uuid:page.uuid,name:page.name,parentSchematicName:page.parentSchematicName}, probes };
