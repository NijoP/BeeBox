"""Fail-closed source gate before any live EasyEDA section mutation.
This does not infer missing identities, package pins, values, or ERC results.
"""
import csv,json,re
from collections import Counter
from pathlib import Path

def rows(path):
 with Path(path).open(encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))
components=rows('netlist/components.csv');comprefs={r['ref'] for r in components}
bom=rows('bom/consolidated_bom.csv');bomrefs={r['ref'] for r in bom}
pins=rows('netlist/pin_to_pin.csv');nets=rows('netlist/nets.csv');netnames={r['net'] for r in nets}
canonical=json.loads(Path('schematic/canonical_physical_pin_maps.json').read_text(encoding='utf8'))['components']
devices=json.loads(Path('schematic/verified_device_library.json').read_text(encoding='utf8'))
passives=json.loads(Path('schematic/verified_passive_library.json').read_text(encoding='utf8'))
script=Path('tools/generate_pcbflow_section_scripts.py').read_text(encoding='utf8')
required_refs=set(re.findall(r"\('([A-Z][A-Z0-9-]*\d[^']*)','",script))
# Expand only simple grouped catalogue rows; never pretend that this creates physical maps.
def covered(ref,groups):
 if ref in groups:return True
 m=re.fullmatch(r'([A-Z]+)(\d+)',ref)
 if not m:return False
 prefix,n=m.group(1),int(m.group(2))
 for g in groups:
  q=re.fullmatch(rf'{prefix}(\d+)-{prefix}?(\d+)',g)
  if q and int(q.group(1))<=n<=int(q.group(2)):return True
 return False
errors=[];warnings=[]
for name,rs in [('components',components),('consolidated BOM',bom),('nets',nets)]:
 key='net' if name=='nets' else 'ref';dups=sorted(k for k,v in Counter(r[key] for r in rs).items() if v>1)
 if dups:errors.append({'duplicate_rows':name,'keys':dups})
if comprefs!=bomrefs:errors.append({'component_BOM_ref_mismatch':{'only_components':sorted(comprefs-bomrefs),'only_BOM':sorted(bomrefs-comprefs)}})
unknown_nets=sorted({r['net'] for r in pins}-netnames)
if unknown_nets:errors.append({'pin_rows_missing_net_dictionary':unknown_nets})
for r in pins:
 for field in ['source_ref','destination_ref']:
  if not covered(r[field],comprefs):errors.append({'pin_row_unknown_ref':{'field':field,'row':r}})
# Exact live generation may use only fully reviewed per-reference records.
missing_device=sorted(ref for ref in required_refs if ref[0] in 'UJQDM' and ref not in devices and ref not in {'J-SD','J-RF'})
missing_passive=sorted(ref for ref in required_refs if ref[0] in 'RCL' and ref not in passives)
if missing_device:errors.append({'missing_verified_device_records':missing_device})
if missing_passive:errors.append({'missing_verified_passive_records':missing_passive})
for ref,spec in devices.items():
 c=canonical.get(ref)
 if not c or c['mpn']!=spec['mpn'] or c['pins']!=spec.get('physicalPinNets'):errors.append({'reviewed_device_canonical_mismatch':ref})
# Known contradictions are explicit gates, not silently normalized.
text=(Path('projects/beebox/04_schematic/build_sheet.md').read_text(encoding='utf8')+'\n'+Path('projects/beebox/04_schematic/net_connection.md').read_text(encoding='utf8'))
for token,reason in [
 ('R14/R15 feedback baseline','fixed TPS62162 must use FB→AGND; divider must not be populated'),
 ('VIN_USB_PROTECTED','no approved VBUS current/protection device creates this rail'),
 ('`VFPC`','connector pinout instead defines separate VDOCK and +3V3_FPC rails'),
 ('J1.VBUS, D1.VBUS','USB protection identity conflicts with reviewed D6, which is data-line ESD only'),
 ('`U7 SHT45`: `I2C_MAIN_SDA/SCL`','reviewed architecture isolates duplicate-address SHT45 devices through TCA9546A'),
]:
 if token in text:errors.append({'source_contradiction':reason})
# Architecture/support-circuit gates visible in source.
errors += [
 {'missing_architecture_definition':'J4 is a 2-contact S2B-PH connector but TS/NTC is required and no approved thermal-sense connection is defined'},
 {'missing_architecture_definition':'External ~6V input has no approved connector/TVS/threshold-divider component set'},
 {'missing_architecture_definition':'TPS2121 PR1/CP2/OV1/OV2/ILM/SS networks and values are not fully specified'},
 {'missing_architecture_definition':'TPS26600 UVLO/OVP/ILIM/dVdT/MODE/SHDN support values are not fully specified'},
 {'missing_architecture_definition':'TPS62162 fixed-3V3 output cannot regulate at 3.3V over the full depleted 1S battery range'},
 {'missing_architecture_definition':'Powered-off FPC signal isolation/back-power prevention is not resolved'},
]
report={'status':'BLOCKED' if errors else 'READY','scope':'PRE-MUTATION_CAPTURE_GATE','counts':{'component_rows':len(components),'pin_to_pin_rows':len(pins),'canonical_components':len(canonical),'verified_devices':len(devices),'verified_passives':len(passives)},'errors':errors,'warnings':warnings,'prohibition':'Do not execute sections 01-08 while status is BLOCKED; doing so would create arbitrary or incomplete circuitry.'}
Path('projects/beebox/05_schematic_audit/capture_readiness.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps(report,indent=2))
raise SystemExit(1 if errors else 0)
