#!/usr/bin/env python3
"""Extract a visual-only layout knowledge graph from the supplied reference PDF."""
import json,re,statistics
from pathlib import Path
import pymupdf as fitz
ROOT=Path(__file__).resolve().parents[1]
PDF=Path(r'C:/Users/HP/Downloads/SCH_Schematic1_2026-10-12 (1).pdf')
page=fitz.open(PDF)[0]; words=page.get_text('words'); drawings=page.get_drawings()
items=[{'text':w[4],'x0':w[0],'y0':w[1],'x1':w[2],'y1':w[3],'cx':(w[0]+w[2])/2,'cy':(w[1]+w[3])/2} for w in words]
ref_re=re.compile(r'^(?:(?:U|R|C|D|Q|J|L|F|SW|TP|MIC)(?:_[A-Za-z0-9]+|[0-9][A-Za-z0-9]*))$',re.I)
refs=[x for x in items if ref_re.match(x['text'])]
# Net-like labels: uppercase signal names, rails and grounds; reject pin/function-only vocabulary.
reject={'GND','VDD','VCC','VSS','VIN','VOUT','NC','EN','CE','BAT','TEMP','PROG','MOTION','MOSI','MISO','SCLK','SDA','SCL','NCS','LED_N','NRESET','CHRG','STDBY','EP','OUT','IN'}
def netlike(t):
 return t in {'GND','GNDA','VBUS','BAT+','VSYS','+3V3','+1V8'} or (len(t)>=4 and re.fullmatch(r'[A-Z][A-Z0-9_+#-]*',t) and t not in reject and not re.fullmatch(r'IO\d+',t))
nets=[x for x in items if netlike(x['text'])]
# Deduplicate text instances only by page position, not by name: repeated labels are a key style observation.
nodes=[]
for i,x in enumerate(refs):nodes.append({'id':f'component:{i}','kind':'component_reference','label':x['text'],'bbox':[x['x0'],x['y0'],x['x1'],x['y1']]})
for i,x in enumerate(nets):nodes.append({'id':f'netlabel:{i}','kind':'net_label','label':x['text'],'bbox':[x['x0'],x['y0'],x['x1'],x['y1']]})
edges=[]
for i,r in enumerate(refs):
 near=[]
 for j,n in enumerate(nets):
  dx=n['cx']-r['cx'];dy=n['cy']-r['cy'];dist=(dx*dx+dy*dy)**.5
  if dist<=180:near.append((dist,j,n,dx,dy))
 for dist,j,n,dx,dy in sorted(near)[:12]:edges.append({'source':f'component:{i}','target':f'netlabel:{j}','relation':'spatially_near','distance':round(dist,2),'side':'left' if abs(dx)>=abs(dy) and dx<0 else 'right' if abs(dx)>=abs(dy) else 'top' if dy<0 else 'bottom'})
# Extract vector line orientation statistics.
seg={'horizontal':0,'vertical':0,'diagonal':0};lengths=[]
for d in drawings:
 for it in d.get('items',[]):
  if it[0]=='l':
   a,b=it[1],it[2];dx=abs(b.x-a.x);dy=abs(b.y-a.y);lengths.append((dx*dx+dy*dy)**.5)
   if dy<.15:seg['horizontal']+=1
   elif dx<.15:seg['vertical']+=1
   else:seg['diagonal']+=1
line_total=sum(seg.values())
# Coarse density grid exposes grouping and whitespace without treating electrical content as authority.
grid=[]
W,H=page.rect.width,page.rect.height
for gy in range(4):
 for gx in range(6):
  x0,x1=gx*W/6,(gx+1)*W/6;y0,y1=gy*H/4,(gy+1)*H/4
  count=sum(x0<=x['cx']<x1 and y0<=x['cy']<y1 for x in items)
  grid.append({'column':gx,'row':gy,'wordCount':count,'normalizedDensity':round(count/max(1,len(items)),4)})
from collections import Counter
repeat=Counter(n['text'] for n in nets)
knowledge={
 'source':str(PDF),'authority':'VISUAL_LAYOUT_REFERENCE_ONLY_NOT_BEEBOX_ELECTRICAL_AUTHORITY','page':{'widthPt':W,'heightPt':H,'words':len(items),'vectorDrawings':len(drawings)},
 'graph':{'nodes':nodes,'edges':edges},
 'metrics':{'componentReferenceLabels':len(refs),'netLabelInstances':len(nets),'lineSegments':seg,'orthogonalFraction':round((seg['horizontal']+seg['vertical'])/max(1,line_total),4),'medianLineLengthPt':round(statistics.median(lengths),2),'densityGrid':grid,'mostRepeatedNets':repeat.most_common(20)},
 'observedPatterns':[
  'Functional groups are separated by generous whitespace; parts within a local circuit use consistent rows and columns.',
  'Symbols are normally upright; multi-pin ICs expose signal pins laterally, while local power/ground support is placed above or below.',
  'Nearly all drawn wire segments are orthogonal. Long cross-page signal wires are avoided by repeated named nets.',
  'Net names are printed cleanly along straight wire stubs ending in small dots; the reference does not clutter pin exits with large arrow-shaped port glyphs.',
  'Labels remain horizontal on horizontal stubs and rotate with true vertical stubs; they are centered away from symbol outlines and pin-name text.',
  'Passives are arranged as small self-contained horizontal two-net circuits with reference above and value below; rail and ground are never joined merely for alignment.',
  'The USB connector is upright while the six-pin ESD symbol is rotated 90 degrees because its actual pins are arranged as two vertical triplets.',
  'USB connector and ESD are linked by consistently named nets rather than a wide bundle of direct crossovers; this preserves whitespace and readability.',
  'Repeated physical connector contacts are electrically named consistently and receive enough stub length/vertical pitch that repeated names do not overlap.'
 ],
 'doRules':[
  'derive each symbol orientation from live physical pin coordinates before wiring',
  'reserve a text-clearance corridor outside each symbol edge',
  'use horizontal left/right stubs for lateral pins and top/bottom stubs only for true vertical pins',
  'prefer the native named-wire visual used by the reference; only add a port glyph when global connectivity requires it and the glyph can be kept clear',
  'derive label rotation and anchoring from the actual outward pin vector; never use one fixed port rotation',
  'place support passives beside the exact pins they support and align them on a grid',
  'use one shared branch and one visible label where duplicated contacts can be grouped without ambiguous junctions',
  'use named nets for distant blocks and short local wires inside a functional group',
  'visually inspect at full page and close zoom before accepting a section'
 ],
 'doNotRules':[
  'do not force every port to rotation zero or every label to the right',
  'do not use a 12-unit stub that leaves the label on top of pin names',
  'do not place large arrow ports directly against connector pin names',
  'do not join interleaved duplicated contacts with crossing wire buses merely to reduce label count; use spaced canonical named stubs when that is cleaner',
  'do not scatter support passives in a generic row detached from their functional block',
  'do not route long buses through unrelated symbols or use decorative section rectangles',
  'do not infer BeeBox electrical connectivity from this reference PDF'
 ]
}
out=ROOT/'schematic/reference_layout_knowledge_graph.json';out.write_text(json.dumps(knowledge,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
print(json.dumps({'output':str(out),'page':knowledge['page'],'metrics':{k:v for k,v in knowledge['metrics'].items() if k!='densityGrid'}},indent=2,ensure_ascii=False))
