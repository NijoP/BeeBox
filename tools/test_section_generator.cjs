const assert=require('node:assert/strict');
const fs=require('node:fs');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const template=fs.readFileSync('easyeda_scripts/section_generator.template.js','utf8');
function configured(parts,passives){return template.replace(/const PARTS = \[[\s\S]*?\];/,`const PARTS = ${JSON.stringify(parts)};`).replace(/const PASSIVES = \[[\s\S]*?\];/,`const PASSIVES = ${JSON.stringify(passives)};`);}
async function rejectsWithoutMutation(parts,passives,pattern){let mutations=0;const eda={sch_PrimitiveComponent:{getAllPrimitiveId:async()=>[],create:async()=>{mutations++;throw Error('mutation attempted');}},lib_Device:{search:async()=>[{uuid:'u',libraryUuid:'l',manufacturerId:'EXACT'}]}};await assert.rejects(new AsyncFunction('eda',configured(parts,passives))(eda),pattern);assert.equal(mutations,0);}
(async()=>{
 const ic={ref:'U2',query:'EXACT',token:'id:EXACT'};
 await rejectsWithoutMutation([ic],[['R12','R','1.54k','CHARGER_ILIM','GND']],/Unverified passive R12/);
 await rejectsWithoutMutation([ic,ic],[],/duplicate designator U2/);
 await rejectsWithoutMutation([],[['R1','R','1k','LED_R','LED_R_A'],['R1','R','1k','LED_R','LED_R_A']],/duplicate designator R1/);
 console.log('PASS: missing reviewed passive and intra-run duplicate references stop before mutation');
})().catch(e=>{console.error(e);process.exitCode=1;});
