const assert=require('node:assert/strict');
const fs=require('node:fs');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const engine=fs.readFileSync('easyeda_scripts/section_generator.template.js','utf8').split('/* ============================ CONFIG')[0];
async function api(eda){return new AsyncFunction('eda',engine+'\nreturn {attachNetLabel,wirePinsWithNetLabels,records:CONNECTION_RECORDS};')(eda);}
const pin=(number,x,y,rotation=0,nc=false)=>({getState_PinNumber:()=>number,getState_PinName:()=>number,getState_X:()=>x,getState_Y:()=>y,getState_Rotation:()=>rotation,getState_NoConnected:()=>nc});
(async()=>{
 let wireArgs,labelArgs,deletes=0;const ports=new Map();
 const eda={sch_PrimitiveWire:{create:async(line,net)=>{wireArgs={line,net};return{getState_PrimitiveId:()=> 'w1'};},delete:async()=>{deletes++;}},sch_PrimitiveComponent:{createNetPort:async(direction,net,x,y,rotation,mirror)=>{labelArgs={direction,net,x,y,rotation,mirror};ports.set('l1',net);return{getState_PrimitiveId:()=> 'l1'};},get:async id=>({getState_ComponentType:()=> 'netport',getState_Net:()=>ports.get(id)}),delete:async()=>{deletes++;}},sch_PrimitivePin:{modify:async(p,o)=>({getState_NoConnected:()=>o.noConnected})}};
 const f=await api(eda);const r=await f.attachNetLabel(pin('1',10,20,0),'USB_D_P',0,20,'D6');
 assert.deepEqual(wireArgs,{line:[10,20,22,20],net:'USB_D_P'});assert.deepEqual(labelArgs,{direction:'BI',net:'USB_D_P',x:22,y:20,rotation:0,mirror:false});assert.equal(r.labelX,22);assert.equal(r.stubId,'w1');assert.equal(r.labelObjectType,'netport');
 await assert.rejects(f.attachNetLabel(pin('2',10,20,0),'USB_D_N',0,20,'D6'),/conflicting nets/);assert.equal(deletes,0);
 await assert.rejects((await api({...eda,sch_PrimitiveComponent:{}})).attachNetLabel(pin('1',0,0),'GND',0,0,'U1'),/does not expose/);
 console.log('PASS: genuine electrical net-port is placed on the short-stub endpoint; conflicts and unsupported APIs fail closed');
})().catch(e=>{console.error(e);process.exitCode=1;});
