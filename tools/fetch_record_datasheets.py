"""Download PDFs referenced by preserved library metadata; no browser automation.
Only followed direct PDF links are stored; failed requests are recorded, not hidden.
"""
import json,re,hashlib,subprocess

def fetch(url):
 return subprocess.check_output(['C:/Program Files/Git/mingw64/bin/curl.exe','-sS','-L','--fail','--max-time','30',url])
from pathlib import Path
records=json.loads(Path('projects/beebox/05_schematic_audit/native_backup_rootcause.json').read_text(encoding='utf8'))['v']['components']
selected={'U7','U9','D2','D3','D4','J2','J4'}
report=[]
for c in records:
 if c.get('designator') not in selected: continue
 url=c.get('otherProperty',{}).get('Datasheet')
 if not url: continue
 row={'ref':c['designator'],'mpn':c['manufacturerId'],'recordUrl':url}
 try:
  data=fetch(url)
  if not data.startswith(b'%PDF'):
   links=re.findall(r'https[^"<>\s]+\.pdf[^"<>\s]*',data.decode('utf8',errors='replace'))
   if not links: raise ValueError('No direct PDF link in library datasheet page')
   url=links[0].split('#')[0].replace('&amp;','&');data=fetch(url)
  if not data.startswith(b'%PDF'):raise ValueError('Response is not PDF')
  path=Path('datasheets')/(c['designator']+'_manufacturer_record.pdf');path.write_bytes(data)
  import fitz
  doc=fitz.open(path);path.with_suffix('.txt').write_text('\n'.join(p.get_text() for p in doc),encoding='utf8')
  row.update(pdfUrl=url,path=str(path),sha256=hashlib.sha256(data).hexdigest(),pages=len(doc),status='DOWNLOADED_REQUIRES_REVIEW')
 except Exception as e:row.update(status='FAILED',error=str(e))
 report.append(row)
Path('datasheets/record_download_manifest.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report,indent=2))
