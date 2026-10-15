async function styleUsbLabels(parts,wireIds){
 const jp=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(parts.J1.getState_PrimitiveId());
 const capPins={};for(const ref of ['C21','C22'])capPins[ref]=await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(parts[ref].getState_PrimitiveId());
 for(const ref of ['C21','C22']){const pins=capPins[ref],one=pins.find(p=>String(p.getState_PinNumber())==='1'),two=pins.find(p=>String(p.getState_PinNumber())==='2');if(!one||!two||one.getState_X()!==two.getState_X()||one.getState_Y()<=two.getState_Y())throw Error(ref+': refusing bypass routing that crosses capacitor terminals; measured pin1 must be above pin2');}
 const left=Math.min(...jp.map(p=>p.getState_X())),right=Math.max(...jp.map(p=>p.getState_X()));const edits=[];
 const jNets={A1B12:'GND',B1A12:'GND',A4B9:'VBUS_USB',B4A9:'VBUS_USB','1':'GND','2':'GND','3':'GND','4':'GND'};
 for(const id of new Set(wireIds)){
  const w=await eda.sch_PrimitiveWire.get(id);if(!w)continue;
  const line=w.getState_Line();let label=null;
  if(line.length===4){
   const p=jp.find(p=>jNets[String(p.getState_PinNumber())]&&p.getState_Y()===line[1]&&p.getState_Y()===line[3]&&(p.getState_X()===line[0]||p.getState_X()===line[2]));
   if(p){const isRight=p.getState_X()===right;const net=jNets[String(p.getState_PinNumber())];
    // Wire.modify({line}) resets the named net in this client: always pass
    // the canonical net explicitly and obtain fresh attributes afterward.
    await eda.sch_PrimitiveWire.modify(id,{line:[p.getState_X(),p.getState_Y(),isRight?right+110:left-70,p.getState_Y()],net});
    label={x:isRight?right+70:left-60,y:-p.getState_Y(),rotation:0,value:net,valueVisible:true};
   }
  }
  // Remove unnecessary dangling capacitor tails, keeping the complete
  // three-segment bypass connection and a single explicit rail label.
  if(line.length>4&&(w.getState_Net()==='VBUS_USB'||w.getState_Net()==='GND')){
   const net=w.getState_Net(),num=net==='VBUS_USB'?'1':'2';
   const a=capPins.C21.find(p=>String(p.getState_PinNumber())===num),b=capPins.C22.find(p=>String(p.getState_PinNumber())===num);
   if(line.includes(a.getState_X())&&line.includes(b.getState_X())){
    const ax=a.getState_X(),ay=a.getState_Y(),bx=b.getState_X(),by=b.getState_Y();
    const railY=net==='VBUS_USB'?Math.max(ay,by)+25:Math.min(ay,by)-25;
    await eda.sch_PrimitiveWire.modify(id,{line:[[ax,ay,ax,railY],[ax,railY,bx,railY],[bx,railY,bx,by]],net});
    label={x:(ax+bx)/2,y:-railY,rotation:0,value:net,valueVisible:true};
   }
  }
  // Verified client quirk: Attribute.modify accepts native downward-positive
  // Y, while Attribute.getState_Y and component/pin APIs expose upward-positive
  // Y. Keep this explicit adapter scoped to attribute writes only.
  if(label){const attrs=await eda.sch_PrimitiveAttribute.getAll(id);let first=true;
   for(const a of attrs){if(a.getState_Key()!=='Name')continue;// PDF export ignores valueVisible=false on duplicate Name attributes in
    // this client. Retire only the redundant display attribute; retain the
    // first explicit Name/net and verify the exported native pin map afterward.
    const params=first?label:{key:'',value:'',keyVisible:false,valueVisible:false};first=false;
    await eda.sch_PrimitiveAttribute.modify(a.getState_PrimitiveId(),params);edits.push({wire:id,attribute:a.getState_PrimitiveId(),...params});
   }
  }
 }
 return edits;
}

const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();if(page.uuid!=='d5e34c82cc3ba89c')throw Error('Wrong page');const parts={};for(const c of await eda.sch_PrimitiveComponent.getAll())if(['J1','D6','R6','R7','C21','C22'].includes(c.getState_Designator()))parts[c.getState_Designator()]=c;return await styleUsbLabels(parts,['60def3bea7a8680a','29cbcc3017a8200f']);
