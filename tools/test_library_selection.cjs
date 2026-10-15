const assert=require('node:assert/strict');
const fs=require('node:fs');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const engine=fs.readFileSync('easyeda_scripts/section_generator.template.js','utf8').split('/* ============================ CONFIG')[0];
const spec={uuid:'d',libraryUuid:'l',mpn:'EXACT',manufacturer:'TI',supplierId:'C1',symbolUuid:'s',footprintUuid:'f',physicalPinNets:{'1':'GND','2':'VDD'}};
const raw={uuid:'d',libraryUuid:'l',name:'EXACT',property:{name:'EXACT',manufacturer:'TI',manufacturerId:'EXACT',supplierId:'C1',otherProperty:{}},association:{symbolUuid:'s',footprintUuid:'f'}};
async function api(eda,devices={U2:spec}){return await new AsyncFunction('eda','devices',engine+'\nconst DEVICE_LIBRARY=devices;const PASSIVE_LIBRARY={};return {pick,getReviewedRecord,wirePinsWithNetLabels,placeIC};')(eda,devices);}
(async()=>{
 let searches=0;const eda={lib_Device:{get:async()=>structuredClone(raw),search:async()=>{searches++;return [];}}};
 const f=await api(eda);const d=await f.pick('EXACT','id:EXACT','U2');assert.equal(d.uuid,'d');assert.equal(searches,0,'pinned record must not depend on first search page');
 await assert.rejects(f.pick('EXACT','id:EXACT','U3'),/Unverified device/);
 await assert.rejects((await api(eda,{U2:{...spec,physicalPinNets:null}})).pick('EXACT','id:EXACT','U2'),/physical-pin map/);
 for(const change of ['manufacturer','supplierId']){
  const changed=structuredClone(raw);changed.property[change]='WRONG';
  await assert.rejects((await api({lib_Device:{get:async()=>changed}})).pick('EXACT','id:EXACT','U2'),/identity mismatch/);
 }
 let wires=0;let observed=[];
 const pin=n=>({getState_PinNumber:()=>n,getState_X:()=>0,getState_Y:()=>0});
 const p=await api({sch_PrimitiveComponent:{getAllPinsByPrimitiveId:async()=>observed},sch_PrimitiveWire:{create:async()=>{wires++;}}});
 const c={getState_PrimitiveId:()=> 'c'};
 observed=[pin('1')];await assert.rejects(p.wirePinsWithNetLabels(c,{},'U2'),/inventory mismatch/);
 observed=[pin('1'),pin('1')];await assert.rejects(p.wirePinsWithNetLabels(c,{},'U2'),/inventory mismatch/);
 assert.equal(wires,0,'pin mismatches must stop before wire mutation');
 const current={};const placement=await api({sch_PrimitiveComponent:{create:async()=>c,modify:async(id,props)=>{assert.equal(typeof id,'string');Object.assign(current,props);},get:async()=>({getState_Designator:()=>current.designator,getState_ManufacturerId:()=>current.manufacturerId})}});
 await placement.placeIC({uuid:'d',libraryUuid:'l',name:'EXACT',manufacturer:'TI',manufacturerId:'EXACT'},0,0,0,'U2');
 console.log('PASS: pinned UUID retrieval, identity checks, mandatory physical maps, pin inventory guards, ID-based updates');
})().catch(e=>{console.error(e);process.exitCode=1;});
