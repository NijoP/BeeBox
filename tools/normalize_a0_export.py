"""Trim only the native export's external padding around its measured A0 frame.
No scaling, redrawing, or circuit alterations. Preserve the raw native export.
"""
import hashlib
import json
from pathlib import Path
import pymupdf as pdf

root=Path('projects/beebox/05_schematic_audit')
raw=root/'A0_usb_checkpoint_raw.pdf'
result=root/'A0_usb_checkpoint.pdf'
doc=pdf.open(raw)
if len(doc)!=1:raise ValueError('Expected one A0 schematic page')
p=doc[0]
expected=(1189*72/25.4,841*72/25.4)
frames=[]
for path in p.get_drawings():
 if path['type']!='s' or len(path['items'])!=1 or path['items'][0][0]!='re':continue
 r=path['items'][0][1]
 if abs(r.width-expected[0])<0.03 and abs(r.height-expected[1])<0.03:frames.append(r)
if len(frames)!=1:raise ValueError(f'Expected one measured ISO A0 native frame, found{len(frames)}')
frame=frames[0]
for w in p.get_text('words'):
 r=pdf.Rect(w[:4])
 if not (frame+(-0.05,-0.05,0.05,0.05)).contains(r):raise ValueError(f'Text outside native A0 frame: {w[4]}')
raw_box=list(p.rect)
# Both MediaBox and visible page derive from the actual native drawing frame.
p.set_mediabox(frame)
metadata=doc.metadata
metadata.update(title='BeeBox A0 USB checkpoint - incomplete schematic',subject='Native export padding trimmed; no scaling. Not for fabrication.')
doc.set_metadata(metadata)
doc.save(result,garbage=3,deflate=True)
doc.close()
check=pdf.open(result)
p=check[0]
if abs(p.rect.width-expected[0])>0.03 or abs(p.rect.height-expected[1])>0.03:raise ValueError('Normalized PDF is not ISO A0 landscape')
p.get_pixmap(matrix=pdf.Matrix(.4,.4)).save(str(result.with_suffix('.png')))
p.get_pixmap(matrix=pdf.Matrix(2,2),clip=pdf.Rect(35,15,640,520)).save(str(root/'usb_checkpoint_A0_detail.png'))
p.get_pixmap(matrix=pdf.Matrix(1.5,1.5),clip=pdf.Rect(p.rect.width-580,p.rect.height-180,p.rect.width,p.rect.height)).save(str(root/'A0_title_block_detail.png'))
report={'scope':'USB_CHECKPOINT_ONLY_NOT_FINISHED_SCHEMATIC','raw_media_box_pt':raw_box,'measured_native_A0_frame_pt':list(frame),'normalized_media_box_pt':list(p.rect),'normalized_mm':[p.rect.width*25.4/72,p.rect.height*25.4/72],'scale_factor':1,'operation':'Trim external export padding to measured native A0 frame; no circuit redraw/scaling','raw_sha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'normalized_sha256':hashlib.sha256(result.read_bytes()).hexdigest(),'A0_geometry_verdict':'PASS'}
(root/'A0_geometry_verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps(report,indent=2))
