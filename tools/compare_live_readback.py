import json,csv
from pathlib import Path
p=Path('projects/beebox/05_schematic_audit/live_readback_after_audit.json')
d=json.loads(p.read_text(encoding='utf8'))['v']
actual={x.get('des') for x in d['components'] if x.get('des')}
expected={r['ref'] for r in csv.DictReader(open('netlist/components.csv',encoding='utf8')) if '-' not in r['ref'] and ',' not in r['ref']}
required={'U1','U2','U3','U4','U6','U7','U8','U9','U11','U12','J1','J2','J3','J4','D2','D3','D4','D6'}
report=['# Live schematic vs canonical inventory','',f"Live component objects: {d['componentCount']}",f"Live wire objects: {d['wireCount']}",f"Actual designators: {', '.join(sorted(actual))}",f"Missing required designators: {', '.join(sorted(required-actual)) or 'none'}",f"Unexpected non-placeholder designators: {', '.join(sorted((actual-expected)-{'U?'}) ) or 'none'}",'', '## Verdict', '', 'FAIL — live schematic is only a partial power/USB section; full canonical parity is not demonstrated.']
Path('projects/beebox/05_schematic_audit/live_netlist_comparison.md').write_text('\n'.join(report)+'\n',encoding='utf8')
print('\n'.join(report))
