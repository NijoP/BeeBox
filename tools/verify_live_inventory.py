import json
from collections import Counter
from pathlib import Path
p=Path('projects/beebox/05_schematic_audit/live_readback_after_sectionwise_rebuild.json')
v=json.loads(p.read_text())['v']; cs=v['components']; refs=[c['des'] for c in cs]
expected=['U1','U2','U3','U4','U6','U7','U8','U9','U11','U12','J1','J2','J3','J4','D2','D3','D4','D5','D6','L1','R1','R2','R3','R4','R5','R6','R7','R11','R12','R13','R14','R15','C1','C2','C3','C10','C11','C12','C21','C22']+[f'TP{i}' for i in range(1,13)]
missing=sorted(set(expected)-set(refs)); extra=sorted(set(refs)-set(expected)); dup=sorted(k for k,n in Counter(refs).items() if n>1)
print({'components':len(cs),'wires':v['wireCount'],'missing':missing,'extra':extra,'duplicates':dup,'bounds':[min(c['x'] for c in cs),max(c['x'] for c in cs),min(c['y'] for c in cs),max(c['y'] for c in cs)]})
raise SystemExit(1 if missing or dup else 0)
