/* Geometry-measured USB checkpoint, part of section 01. */
return await (async()=>{
 const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();
 const project=await eda.dmt_Project.getCurrentProjectInfo();
 if(page.uuid!=='d5e34c82cc3ba89c'||project.uuid!=='d84c4be0ef2e467fa17955faa23c6314')throw Error('Wrong project/page');
 const refs=['J1','D6','R6','R7','C21','C22'];
 const existing=await eda.sch_PrimitiveComponent.getAll();
 for(const c of existing)if(refs.includes(c.getState_Designator()))throw Error('USB checkpoint already present; inspect before rework');
 const records={J1:await pick('TYPE-C-31-M-12','id:TYPE-C-31-M-12','J1'),D6:await pick('USBLC6-2SC6','id:USBLC6-2SC6','D6')};
 for(const ref of refs.slice(2))records[ref]=await pickPassive(ref,PASSIVE_LIBRARY[ref].kind,PASSIVE_LIBRARY[ref].value);
 const created=[],wireIds=[],graphics=[];const parts={};let stage='initialization';
 async function pins(ref){return await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(parts[ref].getState_PrimitiveId());}
 async function pin(ref,num){const p=(await pins(ref)).find(p=>String(p.getState_PinNumber())===String(num));if(!p)throw Error(`Missing physical pin ${ref}.${num}`);return p;}
 async function move(ref,x,y,rotation){await eda.sch_PrimitiveComponent.modify(parts[ref].getState_PrimitiveId(),{x,y,...(rotation===undefined?{}:{rotation})});}
 function bounds(ps){return {left:Math.min(...ps.map(p=>p.getState_X())),right:Math.max(...ps.map(p=>p.getState_X())),top:Math.max(...ps.map(p=>p.getState_Y())),bottom:Math.min(...ps.map(p=>p.getState_Y()))};}
 function point(p){return [p.getState_X(),p.getState_Y()];}
 async function wire(line,net){
  // EasyEDA requires an array of four-coordinate segments for a routed wire,
  // not a flattened polyline. Remove zero-length segments before creation.
  const segments=[];for(let i=0;i<line.length-2;i+=2){const s=line.slice(i,i+4);if(!s.every(Number.isFinite))throw Error(`Nonfinite wire ${net}`);if(s[0]!==s[2]&&s[1]!==s[3])throw Error(`Diagonal wire ${net}`);if(s[0]!==s[2]||s[1]!==s[3])segments.push(s);}
  if(!segments.length)return;
  const w=await eda.sch_PrimitiveWire.create(segments.length===1?segments[0]:segments,net);if(!w)throw Error(`Wire creation failed ${net}`);wireIds.push(w.getState_PrimitiveId());
 }
 async function stub(p,net,length=35){const r=p.getState_Rotation()*Math.PI/180;const dx=Math.round(Math.cos(r)),dy=Math.round(Math.sin(r));const [x,y]=point(p);await wire([x,y,x+dx*length,y+dy*length],net);}
 async function route(p,q,net,lane){const a=point(p),b=point(q);await wire([a[0],a[1],lane,a[1],lane,b[1],b[0],b[1]],net);}
 try{
  // Measure actual pins first; no electrical wires are created until placement is verified.
  for(const ref of refs){stage=`place ${ref}`;parts[ref]=await placeIC(records[ref],0,0,refs.indexOf(ref)>1?90:0,ref);created.push(parts[ref].getState_PrimitiveId());
   if(PASSIVE_LIBRARY[ref])await eda.sch_PrimitiveComponent.modify(parts[ref].getState_PrimitiveId(),{name:PASSIVE_LIBRARY[ref].value});
  }
  stage='geometry placement';
  await eda.sch_PrimitiveComponent.modify(parts.J1.getState_PrimitiveId(),{mirror:true});
  const jb=bounds(await pins('J1')),db=bounds(await pins('D6'));
  const origin={x:100,y:3000};
  const jx=origin.x-jb.left+60,jy=origin.y;
  await move('J1',jx,jy);
  const placedJ=bounds(await pins('J1'));
  // Reserve CC routes/caps between connector and ESD, based on measured pin span.
  const dx=placedJ.right+340-db.left;
  await move('D6',dx,jy);
  const positions={R6:[placedJ.right+100,placedJ.top+105],R7:[placedJ.right+170,placedJ.bottom-85],C21:[jx,placedJ.bottom-200],C22:[jx+130,placedJ.bottom-200]};
  for(const ref of refs.slice(2)){
   let a=await pin(ref,'1'),b=await pin(ref,'2');
   if(a.getState_Y()<b.getState_Y())await move(ref,0,0,270);
   await move(ref,...positions[ref]);
  }
  for(const num of ['B8','A8']){
   const marked=await eda.sch_PrimitivePin.modify(await pin('J1',num),{noConnected:true});
   if(!marked||marked.getState_NoConnected()!==true)throw Error(`NC marker failed J1.${num}`);
  }
  // Local USB data connections: connector-side nets enter the flow-through ESD
  // pins; MCU-side nets leave pins6/4, enforcing the intended protection route.
  stage='local wires';
  const d1=await pin('D6','1'),d3=await pin('D6','3');
  for(const num of ['A6','B6'])await route(await pin('J1',num),d1,'USB_DP_CONN',placedJ.right+40);
  for(const num of ['A7','B7'])await route(await pin('J1',num),d3,'USB_DN_CONN',placedJ.right+65);
  await stub(await pin('D6','6'),'USB_D_P',70);await stub(await pin('D6','4'),'USB_D_N',70);
  for(const [ref,num,net] of [['R6','A5','USB_CC1'],['R7','B5','USB_CC2']]){
   const a=await pin('J1',num),b=await pin(ref,'1');
   await route(a,b,net,placedJ.right+15);await stub(await pin(ref,'2'),'GND',35);
  }
  // Bulk and HF bypass share visibly wired local supply and ground buses.
  for(const n of ['1','2']){const a=await pin('C21',n),b=await pin('C22',n);const [ax,ay]=point(a),[bx,by]=point(b);const railY=n==='1'?Math.max(ay,by)+25:Math.min(ay,by)-25;await wire([ax,ay,ax,railY,bx,railY,bx,by],n==='1'?'VBUS_USB':'GND');}
  await stub(await pin('C21','1'),'VBUS_USB',35);await stub(await pin('C21','2'),'GND',35);
  for(const num of ['A4B9','B4A9'])await stub(await pin('J1',num),'VBUS_USB',10);
  for(const num of ['A1B12','B1A12','1','2','3','4'])await stub(await pin('J1',num),'GND',10);
  await stub(await pin('D6','2'),'GND',40);await stub(await pin('D6','5'),'VBUS_USB',40);
  const all=[];for(const ref of refs)all.push(...await pins(ref));
  const bb=bounds(all);const frame={left:bb.left-90,right:bb.right+140,top:bb.top+95,bottom:bb.bottom-95};
  if(frame.left<0||frame.right>4680||frame.top>3310||frame.bottom<0)throw Error('USB measured bounds outside A0 area');
  stage='section rectangle';
  const rectangle=await eda.sch_PrimitiveRectangle.create(frame.left,frame.top,frame.right-frame.left,frame.top-frame.bottom,0,0,'#555555',null,1);
  if(!rectangle)throw Error('Frame creation failed');graphics.push({kind:'rectangle',id:rectangle.getState_PrimitiveId()});
  stage='section heading';
  const heading=await eda.sch_PrimitiveText.create(frame.left+20,frame.top-25,'01A  USB-C INPUT / CC / ST USB ESD',0,'#222222',null,12,true);
  if(!heading)throw Error('Heading creation failed');graphics.push({kind:'text',id:heading.getState_PrimitiveId()});
  stage='readability attributes';
  const labelEdits=await styleUsbLabels(parts,wireIds);
  const readback=[];
  for(const ref of refs){const c=await eda.sch_PrimitiveComponent.get(parts[ref].getState_PrimitiveId());if(c.getState_Designator()!==ref||c.getState_ManufacturerId()!==records[ref].manufacturerId)throw Error(`Identity mismatch ${ref}`);if(PASSIVE_LIBRARY[ref]&&c.getState_Name()!==PASSIVE_LIBRARY[ref].value)throw Error(`Displayed value mismatch ${ref}: ${c.getState_Name()}`);readback.push({ref,id:c.getState_PrimitiveId(),mpn:c.getState_ManufacturerId(),value:c.getState_Name(),x:c.getState_X(),y:c.getState_Y(),pins:(await pins(ref)).map(p=>({number:p.getState_PinNumber(),name:p.getState_PinName(),x:p.getState_X(),y:p.getState_Y()}))});}
  return {section:'01A_USB_CHECKPOINT_NOT_FULL_POWER',readback,wireIds,graphics,frame,labelEdits,assumptions:['No USB-PD negotiation;5V sink only','Higher USB current requires validated source advertisement/enumeration control','Complete power section still requires fuse/protected VBUS,external input,mux and charging circuits'],visualVerdict:'REQUIRES_ACTUAL_EXPORT_INSPECTION'};
 }catch(e){
  if(wireIds.length)await eda.sch_PrimitiveWire.delete(wireIds);
  if(created.length)await eda.sch_PrimitiveComponent.delete(created);
  for(const g of graphics)await(g.kind==='text'?eda.sch_PrimitiveText:eda.sch_PrimitiveRectangle).delete([g.id]);
  throw Error(`USB checkpoint failed at ${stage}: ${e.message}`);
 }
})();
