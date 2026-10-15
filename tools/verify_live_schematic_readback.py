#!/usr/bin/env python3
import json,sys
from collections import defaultdict,Counter
from pathlib import Path
R=Path(__file__).resolve().parents[1]
read=json.loads((R/'outputs/schematic/readback/final_full_readback.json').read_text(encoding='utf8'))['result'];canon=json.loads((R/'schematic/canonical_physical_pin_maps.json').read_text(encoding='utf8'))['components'];devlib=json.loads((R/'schematic/verified_device_library.json').read_text(encoding='utf8'));secs=json.loads((R/'schematic/standalone_sections.json').read_text(encoding='utf8'))
cs={c.get('ref'):c for c in read['components'] if c.get('ref')};ws=read['wires'];errors=[];warnings=[];checked=0
cnt=Counter(c.get('ref') for c in read['components'] if c.get('ref'))
for ref,n in cnt.items():
 if n!=1:errors.append(f'duplicate reference {ref} x{n}')
def hit(p,net):
 return any(w.get('net')==net and any(abs(w['line'][i]-p['x'])<.01 and abs(w['line'][i+1]-p['y'])<.01 for i in range(0,len(w.get('line')or[])-1,2)) for w in ws)
for ref,s in canon.items():
 if ref not in cs:continue
 if ref in devlib and cs[ref].get('mpn')!=devlib[ref]['mpn']:errors.append(f'{ref}: identity {cs[ref].get("mpn")} != {devlib[ref]["mpn"]}')
 pp={str(p['number']):p for p in cs[ref]['pins']}
 for n,net in s['pins'].items():
  checked+=1;p=pp.get(n)
  if not p:errors.append(f'{ref}.{n}: missing physical pin')
  elif net is None and not p.get('noConnected'):errors.append(f'{ref}.{n}: intentional NC not marked')
  elif net is not None and not hit(p,net):errors.append(f'{ref}.{n}: expected {net}')
for sec in secs.values():
 for x in sec['passives']:
  if x['ref'] not in cs:errors.append(f'{x["ref"]}: missing passive');continue
  ps=sorted(cs[x['ref']]['pins'],key=lambda p:int(p['number']))
  for p,n in zip(ps,[x['netA'],x['netB']]):checked+=1;errors+=[] if hit(p,n) else [f'{x["ref"]}.{p["number"]}: expected {n}']
# Endpoint collisions, malformed/backtracking segments and page containment.
points=defaultdict(set)
for w in ws:
 q=w.get('line')or[]
 for i in range(0,len(q)-1,2):points[(round(q[i],4),round(q[i+1],4))].add(w.get('net'))
for xy,nets in points.items():
 if len(nets)>1:errors.append(f'different-net endpoint collision {xy}: {sorted(nets)}')
for w in ws:
 q=w.get('line')or[];pts=[(q[i],q[i+1]) for i in range(0,len(q)-1,2)]
 for a,b,c in zip(pts,pts[1:],pts[2:]):
  if a==c and a!=b:errors.append(f'backtracking wire {w.get("id")} {w.get("net")}: {a}->{b}->{c}')
 for x,y in pts:
  if x<100 or x>4550 or y<100 or y>3050:errors.append(f'wire {w.get("id")} {w.get("net")} outside usable boundary at {(x,y)}')
for ref,c in cs.items():
 for p in c['pins']:
  if p['x']<100 or p['x']>4550 or p['y']<100 or p['y']>3050:errors.append(f'{ref}.{p["number"]} outside usable boundary')
out={'status':'PASS' if not errors else 'FAIL','checkedPhysicalPins':checked,'uniqueReferences':len(cs),'componentObjects':len(read['components']),'wires':len(ws),'errors':errors,'warnings':warnings}
(R/'outputs/schematic/readback/final_physical_pin_parity.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps(out,indent=2));sys.exit(bool(errors))
