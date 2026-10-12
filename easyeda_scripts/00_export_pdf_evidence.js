const f=await eda.sch_ManufactureData.getExportDocumentFile('beebox_before_rootcause','PDF',{theme:'Black on White'},'Current Schematic Page');
if(!f)throw Error('Export returned no file');
const bytes=new Uint8Array(await f.arrayBuffer());let s='';for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return {name:f.name,mime:f.type,size:f.size,base64:btoa(s)};
