#!/usr/bin/env python3
"""Validate and emit the canonical physical graph used by standalone BeeBox scripts."""
import csv,json,re,subprocess,sys
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def load(p):return json.loads((ROOT/p).read_text(encoding='utf8'))
sections=load('schematic/standalone_sections.json')
dev=load('schematic/verified_device_library.json')
pas=load('schematic/verified_passive_library.json')
canon=load('schematic/canonical_physical_pin_maps.json')['components']
errors=[]; refs={}; rows=[]
for fn,s in sections.items():
    base=s['base']
    if not (100<=base[0]<=4500 and 200<=base[1]<=2700):errors.append(f'{fn}: base outside usable A0 area')
    for ref in s['parts']:
        if ref in refs:errors.append(f'duplicate ref {ref}: {refs[ref]} and {fn}')
        refs[ref]=fn
        spec=dev.get(ref); cmap=canon.get(ref)
        if not spec or not cmap:errors.append(f'{fn}: missing reviewed device/map {ref}');continue
        for key in ['mpn','manufacturer','uuid','libraryUuid','symbolUuid','footprintUuid','physicalPinNets']:
            if not spec.get(key):errors.append(f'{ref}: missing {key}')
        if spec['mpn']!=cmap['mpn'] or spec['physicalPinNets']!=cmap['pins']:errors.append(f'{ref}: manifest/canonical mismatch')
        for pin,net in cmap['pins'].items():
            rows.append({'canonical_net':net or '', 'component_reference':ref,'physical_pin_number':pin,'pin_name':pin,
                         'classification':'INTENTIONAL_NC' if net is None else 'SCRIPT_CONNECTION','verification_status':'VERIFIED_LIBRARY_AND_PIN_MAP','source_script':fn})
    for p in s['passives']:
        ref=p['ref']
        if ref in refs:errors.append(f'duplicate ref {ref}: {refs[ref]} and {fn}')
        refs[ref]=fn;spec=pas.get(ref)
        if not spec:errors.append(f'{fn}: missing passive {ref}');continue
        if spec.get('kind')!=p['kind'] or spec.get('value')!=p['value']:errors.append(f'{ref}: passive value mismatch')
        for key in ['mpn','manufacturer','uuid','libraryUuid','symbolUuid','footprintUuid','package','tolerance','rating']:
            if not spec.get(key):errors.append(f'{ref}: missing {key}')
        if p['kind']=='C' and not spec.get('dielectric'):errors.append(f'{ref}: capacitor dielectric missing')
        rows += [
          {'canonical_net':p['netA'],'component_reference':ref,'physical_pin_number':'1','pin_name':'1','classification':'SCRIPT_CONNECTION','verification_status':'VERIFIED_LIBRARY_VALUE','source_script':fn},
          {'canonical_net':p['netB'],'component_reference':ref,'physical_pin_number':'2','pin_name':'2','classification':'SCRIPT_CONNECTION','verification_status':'VERIFIED_LIBRARY_VALUE','source_script':fn}]
# Explicit provisional dock contacts: electrically real boundary ports, footprint remains gated.
dock=['GND','GND','GND','VDOCK','VDOCK','+3V3_FPC','DOCK_SDA','DOCK_SCL','DOCK_BCLK','DOCK_WS','DOCK_SD','DOCK_PRESENT_ID']
for i,net in enumerate(dock,1):rows.append({'canonical_net':net,'component_reference':f'J3-{i:02d}','physical_pin_number':'1','pin_name':f'CONTACT_{i}','classification':'PROVISIONAL_BOUNDARY_CONTACT','verification_status':'PROVISIONAL_MILL_MAX_LAND_PATTERN','source_script':'07_docking_interface.js'})
# TP1..TP12 script has an exact one-pin library record but is intentionally not a manufacturer AVL item.
tpnets=['GND','+3V3','VSYS','VDOCK','I2C_MAIN_SDA','I2C_MAIN_SCL','I2S_BCLK','I2S_WS','I2S_SD','USB_D_P','USB_D_N','ESP_EN']
for i,net in enumerate(tpnets,1):rows.append({'canonical_net':net,'component_reference':f'TP{i}','physical_pin_number':'1','pin_name':'TEST','classification':'SCRIPT_CONNECTION','verification_status':'PROVISIONAL_TEST_PAD_LIBRARY','source_script':'10_status_testpoints.js'})
# High-risk electrical invariants.
def net(ref,pin):
    found=[r['canonical_net'] for r in rows if r['component_reference']==ref and r['physical_pin_number']==pin]
    return found[0] if len(found)==1 else None
checks={
'D6.2 GND':net('D6','2')=='GND','D6.5 VBUS':net('D6','5')=='VBUS_USB','D6 DP sides':net('D6','1')=='USB_D_P_CONN' and net('D6','6')=='USB_D_P',
'D6 DN sides':net('D6','3')=='USB_D_N_CONN' and net('D6','4')=='USB_D_N','J1 CC separate':net('J1','A5')=='USB_CC1' and net('J1','B5')=='USB_CC2',
'J1 SBU NC':net('J1','A8')=='' and net('J1','B8')=='','U3 fixed FB ground':net('U3','5')=='GND' and 'R14' not in refs and 'R15' not in refs,
'U4 reset pullup net':net('U4','3')=='I2C_MUX_RESET' and 'R28' in refs,'BQ TS network':net('U2','1')=='CHARGER_TS' and 'R16' in refs,
'BQ support':all(x in refs for x in ['R11','R12','R13','R17','R18','C23','C24','C25']),
'TPS2121 support':all(x in refs for x in ['R24','C27']),'TPS26600 support':all(x in refs for x in ['R20','R21','R22','C26','R23']),
'J4 two contacts':net('J4','1')=='VBAT' and net('J4','2')=='GND' and net('J4','3')=='' and net('J4','4')=='',
'D4 not substituted':'D4' not in refs,'dock 12 contacts':len([r for r in rows if r['component_reference'].startswith('J3-')])==12,
}
for name,ok in checks.items():
    if not ok:errors.append('high-risk check failed: '+name)
for forbidden in ['USB_DP_CONN','USB_DN_CONN','VFPC','SW']:
    if any(r['canonical_net']==forbidden for r in rows):errors.append('forbidden net alias '+forbidden)
# Every generated file must be standalone and contain its own helpers/config.
script_files=[ROOT/'easyeda_scripts'/f for f in sections]+[ROOT/'easyeda_scripts/10_status_testpoints.js',ROOT/'easyeda_scripts/11_final_verification.js']
for p in script_files:
    text=p.read_text(encoding='utf8')
    if not text.strip():errors.append(f'{p.name}: empty')
    if p.name not in ('01_usb_power_entry.js','10_status_testpoints.js','11_final_verification.js') and ('const DEVICE_LIBRARY' not in text or 'async function placeIC' not in text):errors.append(f'{p.name}: not standalone')
    if p.name=='01_usb_power_entry.js' and ('async function reviewed' not in text or 'async function stub' not in text):errors.append(f'{p.name}: dedicated standalone helpers missing')
# Emit authoritative executable membership and deterministic star graph.
fields=list(rows[0]);out=ROOT/'netlist/canonical_net_membership.csv'
with out.open('w',encoding='utf8',newline='') as f:w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(sorted(rows,key=lambda r:(r['canonical_net'],r['component_reference'],r['physical_pin_number'])))
groups=defaultdict(list)
for r in rows:
    if r['canonical_net']:groups[r['canonical_net']].append(r)
links=[]
for n,ms in sorted(groups.items()):
    ms=sorted(ms,key=lambda r:(r['component_reference'],r['physical_pin_number']));a=ms[0]
    if len(ms)==1:links.append({'canonical_net':n,'source_ref':a['component_reference'],'source_physical_pin':a['physical_pin_number'],'destination_ref':'','destination_physical_pin':'','verification_status':'SINGLE_PIN_NET_REVIEW'})
    else:
      for b in ms[1:]:links.append({'canonical_net':n,'source_ref':a['component_reference'],'source_physical_pin':a['physical_pin_number'],'destination_ref':b['component_reference'],'destination_physical_pin':b['physical_pin_number'],'verification_status':'PROVISIONAL' if 'PROVISIONAL' in a['verification_status']+b['verification_status'] else 'VERIFIED_SCRIPT_MODEL'})
with (ROOT/'netlist/canonical_pin_to_pin.csv').open('w',encoding='utf8',newline='') as f:w=csv.DictWriter(f,fieldnames=list(links[0]));w.writeheader();w.writerows(links)
result={'status':'FAIL' if errors else 'PASS','scripts':[p.name for p in script_files],'references':len(refs),'physicalPinRows':len(rows),'nets':len(groups),'links':len(links),'highRiskChecks':checks,'errors':errors}
(ROOT/'outputs/schematic/logs/standalone_script_validation.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print(json.dumps(result,indent=2))
sys.exit(1 if errors else 0)
