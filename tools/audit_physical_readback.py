"""Observed wire contact graph, not native ERC or validated canonical netlist.
Finds all wire segments touching a physical pin; reports multiple named contacts.
"""
import csv,json
from pathlib import Path
base=Path('projects/beebox/05_schematic_audit')
v=json.loads((base/'physical_pins_before_rootcause.json').read_text(encoding='utf8'))['v']
def segments(line):
    paths=[line] if line and isinstance(line[0],(int,float)) else line
    for path in paths:
        for i in range(0,len(path)-2,2): yield path[i:i+4]
def touches(p,s):
    x,y=p['x'],p['y'];a,b,c,d=s
    return abs((x-a)*(d-b)-(y-b)*(c-a))<1e-6 and min(a,c)-1e-6<=x<=max(a,c)+1e-6 and min(b,d)-1e-6<=y<=max(b,d)+1e-6
rows=[]
for c in v['components']:
    for p in c['pins']:
        nets=sorted({w['net'] for w in v['wires'] if any(touches(p,s) for s in segments(w['line']))})
        rows.append(dict(ref=c['ref'],physical_pin=p['number'],pin_name=p['name'],mpn=c['mpn'],observed_nets='|'.join(nets),status='MULTIPLE_NAMED_NETS' if len(nets)>1 else ('CONTACT_OBSERVED' if nets else 'UNCONNECTED_OR_NC')))
with (base/'observed_pin_contacts.csv').open('w',newline='',encoding='utf8') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
known={r['net'] for r in csv.DictReader(Path('netlist/nets.csv').open(encoding='utf8'))}
used={w['net'] for w in v['wires']}
report={'components':len(v['components']),'wires':len(v['wires']),'physical_pins':len(rows),'multi_named_contacts':[r for r in rows if r['status']=='MULTIPLE_NAMED_NETS'],'unconnected_pin_count':sum(r['status']=='UNCONNECTED_OR_NC' for r in rows),'wire_nets_absent_from_canonical_dictionary':sorted(used-known),'verdict':'FAIL_INCOMPLETE_CANONICAL_REFERENCE','limitations':'Geometric contact observations only; no assumption that hidden net metadata proves connectivity, and no native ERC verdict.'}
(base/'physical_contact_audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report,indent=2))
