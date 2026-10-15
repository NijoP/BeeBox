const assert=require('node:assert/strict');
const fs=require('node:fs');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const engine=fs.readFileSync('easyeda_scripts/section_generator.template.js','utf8').split('/* ============================ CONFIG')[0];
async function api(eda){return new AsyncFunction('eda',engine+'\nreturn {attachNetLabel,records:CONNECTION_RECORDS};')(eda);}
const pin=(number,x,y,rotation=0)=>({getState_PinNumber:()=>number,getState_PinName:()=>number,getState_X:()=>x,getState_Y:()=>y,getState_Rotation:()=>rotation});
(async()=>{
 let wireArgs;const eda={sch_PrimitiveWire:{create:async(line,net)=>{wireArgs={line,net};return{getState_PrimitiveId:()=> 'w1',getState_Net:()=>net};}}};
 const f=await api(eda),r=await f.attachNetLabel(pin('1',10,20,0),'USB_D_P',0,20,'D6');
 assert.deepEqual(wireArgs,{line:[10,20,130,20],net:'USB_D_P'});assert.equal(r.labelX,130);assert.equal(r.stubId,'w1');assert.equal(r.labelObjectType,'named-wire');
 await assert.rejects(f.attachNetLabel(pin('2',10,20,0),'USB_D_N',0,20,'D6'),/conflicting nets/);
 console.log('PASS: reference-style named wire is placed on the outward pin side without arrow-port clutter');
})().catch(e=>{console.error(e);process.exitCode=1;});
