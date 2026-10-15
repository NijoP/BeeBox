"""Compare reviewed physical pin assignments with real native and geometry reads.
USB subset only; never emits a whole-platform or ERC PASS.
"""
import csv
import hashlib
import json
import zipfile
from pathlib import Path

root=Path('projects/beebox/05_schematic_audit')
refs=['J1','D6','R6','R7','C21','C22']
canonical=json.loads(Path('schematic/canonical_physical_pin_maps.json').read_text(encoding='utf8'))['components']
device=json.loads(Path('schematic/verified_device_library.json').read_text(encoding='utf8'))
passive=json.loads(Path('schematic/verified_passive_library.json').read_text(encoding='utf8'))
netlist=json.loads((root/'usb_native.net').read_text(encoding='utf8'))
physical=json.loads((root/'usb_physical_readback.json').read_text(encoding='utf8'))['v']
native={c['props']['Designator']:c for c in netlist['components'].values()}
live={c['ref']:c for c in physical['components'] if c.get('ref') in refs}
errors=[]
if set(native)!=set(refs):errors.append({'inventory_native':sorted(native)})
if set(live)!=set(refs):errors.append({'inventory_live':sorted(live)})
extra=[c for c in physical['components'] if c.get('ref') not in refs and c.get('type')!='sheet']
if extra:errors.append({'unexpected_electrical_devices':extra})
segments=[]
for w in physical['wires']:
 line=w['line']
 if line and isinstance(line[0],list):lines=line
 else:
  if len(line)%4:raise ValueError('Native wire line must contain independent four-coordinate segments')
  lines=[line[i:i+4] for i in range(0,len(line),4)]
 for s in lines:
  if len(s)!=4 or (s[0]!=s[2] and s[1]!=s[3]):raise ValueError('Invalid/diagonal native segment')
  if s[:2]!=s[2:]:segments.append((w['net'],s))
def contact(x,y,s):
 a,b,c,d=s
 return abs((x-a)*(d-b)-(y-b)*(c-a))<1e-6 and min(a,c)-1e-6<=x<=max(a,c)+1e-6 and min(b,d)-1e-6<=y<=max(b,d)+1e-6
rows=[]
for ref in refs:
 spec=(device|passive)[ref]
 if canonical[ref]['mpn']!=spec['mpn']:errors.append({'canonical_identity':ref})
 n=native.get(ref);p=live.get(ref)
 if not n or not p:continue
 if n['props'].get('Manufacturer Part')!=spec['mpn'] or n['props'].get('Manufacturer')!=spec['manufacturer'] or n['props'].get('Supplier Part')!=spec['supplierId']:errors.append({'native_identity':ref})
 if p['mpn']!=spec['mpn'] or p['manufacturer']!=spec['manufacturer']:errors.append({'live_identity':ref})
 if ref in passive and (p['name']!=spec['value'] or n['props']['Name']!=spec['value']):errors.append({'value':ref})
 np={str(v['number']):v['net'] for v in n['pinInfoMap'].values()}
 pp={str(v['number']):v for v in p['pins']}
 expected=canonical[ref]['pins']
 if set(np)!=set(expected) or set(pp)!=set(expected):errors.append({'pin_inventory':ref})
 for number,net in expected.items():
  pin=pp.get(number)
  if not pin:continue
  contacts=sorted({name for name,s in segments if contact(pin['x'],pin['y'],s)})
  if np.get(number)!=(net or ''):errors.append({'native_pin':ref+'.'+number,'expected':net,'actual':np.get(number)})
  if contacts!=([net] if net is not None else []):errors.append({'geometric_pin':ref+'.'+number,'expected':net,'actual':contacts})
  if net is None and not pin.get('noConnected'):errors.append({'missing_explicit_NC':ref+'.'+number})
  rows.append({'ref':ref,'physical_pin':number,'net':net or 'NC','mpn':spec['mpn'],'classification':'intentional_no_connect' if net is None else 'electrical','evidence':canonical[ref]['evidence']})
with Path('schematic/usb_checkpoint_pin_to_net.csv').open('w',newline='',encoding='utf8') as f:
 w=csv.DictWriter(f,fieldnames=['ref','physical_pin','net','mpn','classification','evidence']);w.writeheader();w.writerows(rows)
erc=json.loads((root/'usb_native_erc_isolated_result.json').read_text(encoding='utf8'))
violations=erc.get('v',{}).get('violations')
counts={v['type']:v.get('count',1) for v in violations} if isinstance(violations,list) else {}
symbol_types={}
with zipfile.ZipFile(root/'A0_usb_checkpoint.epro') as archive:
 for ref,c in live.items():
  attributes={}
  for line in archive.read('SYMBOL/'+c['symbol']['uuid']+'.esym').decode('utf8').splitlines():
   a=json.loads(line)
   if a[0]=='ATTR' and a[3] in ['NUMBER','Pin Type']:attributes.setdefault(a[2],{})[a[3]]=a[4]
  symbol_types[ref]={a['NUMBER']:a.get('Pin Type') for a in attributes.values() if 'NUMBER' in a}
type_mismatches=[{'ref':ref,'pin':number,'actual':value,'expected':'Passive'} for ref,pins in symbol_types.items() for number,value in pins.items() if value!='Passive']
report={'scope':'USB_CHECKPOINT_ONLY_NOT_COMPLETE_POWER_SECTION','electrical_component_count':len(live),'native_pin_count':sum(len(v['pinInfoMap']) for v in native.values()),'intentional_NC_count':sum(r['classification']=='intentional_no_connect' for r in rows),'native_netlist_and_geometric_contact_parity':'PASS' if not errors else 'FAIL','errors':errors,'native_ERC':'WARNINGS_NOT_PASS' if counts else 'UNVERIFIED','native_ERC_severity_counts':counts,'library_electrical_pin_types':'FAIL_REPAIR_REQUIRED' if type_mismatches else 'PASS','pin_type_mismatches':type_mismatches,'whole_schematic_release':'BLOCKED','limitations':['No inferred electrical approval from component counts or script completion','Only six USB subcircuit components are covered','Full USB inrush budget and source-current/firmware policy require complete power section','USB-PD negotiation is not implemented by this checkpoint','Aggregate native warnings lack rule/pin detail in the installed 3.2.206 client','Geometric wire crossings alone are not treated as junctions; actual native pin nets are compared independently'],'native_netlist_sha256':hashlib.sha256((root/'usb_native.net').read_bytes()).hexdigest()}
(root/'usb_checkpoint_verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps(report,indent=2))
if errors:raise SystemExit(1)
