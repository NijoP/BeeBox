const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();const project=await eda.dmt_Project.getCurrentProjectInfo();if(page.uuid!=='d5e34c82cc3ba89c'||project.uuid!=='d84c4be0ef2e467fa17955faa23c6314')throw Error('Wrong project/page');
const drawings=await eda.sch_PrimitiveComponent.getAll('sheet');if(drawings.length)throw Error('Native drawing already exists; inspect, do not duplicate');
const d=await eda.lib_Device.get('8533bc44e6b341fdbc0684c2828a4c85','0819f05c4eef4c71ace90d822a990e87');if(d?.association?.symbolType!==20||d.name!=='Drawing-Symbol_A0')throw Error('Unexpected drawing identity');
const width=1189/0.254,height=841/0.254;
const c=await eda.sch_PrimitiveComponent.create({uuid:d.uuid,libraryUuid:d.libraryUuid},0,height,undefined,0,false,false,false);if(!c)throw Error('A0 drawing create failed');
try{
 const props={...d.property.otherProperty,'Page Size':'A0',Width:String(width),Height:String(height),Company:'BeeBox',Name:'Honeybee Research Sensor Platform',Version:'DRAFT',Description:'Schematic in progress - NOT FOR FABRICATION'};
 await eda.sch_PrimitiveComponent.modify(c.getState_PrimitiveId(),{otherProperty:props});
 const actual=await eda.sch_PrimitiveComponent.get(c.getState_PrimitiveId());if(actual.getState_ComponentType()!=='sheet'||actual.getState_OtherProperty()['Page Size']!=='A0')throw Error('Native drawing readback mismatch');
 await eda.dmt_Schematic.modifySchematicPageTitleBlock(true,{Company:{value:'BeeBox'},Name:{value:'Honeybee Research Sensor Platform'},Version:{value:'DRAFT'},'Page Size':{value:'A0'}});
 const saved=await eda.sch_Document.save();if(!saved)throw Error('A0 document save failed');
 return {id:actual.getState_PrimitiveId(),type:actual.getState_ComponentType(),x:actual.getState_X(),y:actual.getState_Y(),properties:actual.getState_OtherProperty(),expectedMm:{width:1189,height:841},internalUnits:'10mil=0.254mm',page:await eda.dmt_Schematic.getCurrentSchematicPageInfo(),saved};
}catch(e){await eda.sch_PrimitiveComponent.delete(c.getState_PrimitiveId());throw e;}
