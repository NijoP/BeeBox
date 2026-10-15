"""Migrate only datasheet-reviewed rows; do NOT rerun the legacy full generator.
Unreviewed system rows remain preliminary. This script is not release validation.
"""
import ast
import csv
from pathlib import Path

src=ast.parse(Path('tools/build_netlist_files.py').read_text(encoding='utf8'))
components=ast.literal_eval(next(n.value for n in src.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='components' for t in n.targets)))
approved={r[0]:r for r in components if r[0] in {'J1','D6','C21','C22','R6-R7','U3','U4','Q1'}}
for ref in ('R6','R7'):approved[ref]=(ref,*approved['R6-R7'][1:])
def migrate(path,fn):
 p=Path(path)
 with p.open(encoding='utf8',newline='') as f:r=csv.DictReader(f);fields=r.fieldnames;rows=list(r)
 result=fn(rows)
 if result!=rows:
  with p.open('w',encoding='utf8',newline='') as f:w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(result)
def component_rows(rows):
 result=[]
 for old in rows:
  if old['ref'] in {'R14','R15'}:continue
  row=dict(old);ref=row['ref']
  if ref in approved:
   r,m,mpn,func,board,pop,source,pkg=approved[ref];row.update(manufacturer=m,mpn=mpn,function=func,source=source,package_or_note=pkg)
  result.append(row)
 return result
def bom_rows(rows):
 result=[]
 for old in rows:
  if old['ref'] in {'R14','R15'}:continue
  row=dict(old);ref=row['ref']
  if ref in approved:
   _,m,mpn,func,*_=approved[ref];row.update(mpn=m+' '+mpn,function=func,status='reviewed identity; system verification pending')
  result.append(row)
 return result
migrate('netlist/components.csv',component_rows)
for p in ['bom/main_controller_bom.csv','bom/consolidated_bom.csv','bom/universal_sensor_fpc_bom.csv']:migrate(p,bom_rows)
def connections(rows):
 result=[]
 for old in rows:
  row=dict(old)
  if row['net'] in {'USB_D_N','USB_D_P'} and row['source_ref']=='U1' and row['destination_ref']=='J1':row.update(destination_ref='D6',destination_pin='4' if row['net']=='USB_D_N' else '6')
  result.append(row)
 for net,pin,d in [('USB_DP_CONN','A6','1'),('USB_DP_CONN','B6','1'),('USB_DN_CONN','A7','3'),('USB_DN_CONN','B7','3')]:
  row=dict(net=net,source_ref='J1',source_pin=pin,source_type='bidirectional',destination_ref='D6',destination_pin=d)
  if row not in result:result.append(row)
 return result
migrate('netlist/pin_to_pin.csv',connections)
def dictionary(rows):
 result=[dict(r) for r in rows]
 for net in ['USB_DP_CONN','USB_DN_CONN','USB_CC1','USB_CC2']:
  if not any(r['net']==net for r in result):result.append(dict(net=net,board='main',purpose='reviewed USB subcircuit; see usb_checkpoint_pin_to_net.csv',status='USB subset only; system release pending'))
 return result
migrate('netlist/nets.csv',dictionary)
def schematic_rows(rows):
 result=[]
 for old in rows:
  row=dict(old);ref=row['ref']
  if ref in approved:
   row.update(mpn=approved[ref][2],function=approved[ref][3],status='datasheet-reviewed; full section pending')
  if ref=='J1':row['net_or_interface']='VBUS_USB/USB_DP_CONN/USB_DN_CONN/USB_CC1/USB_CC2/GND;SBU NC'
  if ref=='D6':row['net_or_interface']='USB_DP_CONN->USB_D_P/USB_DN_CONN->USB_D_N/GND/VBUS_USB'
  result.append(row)
 return result
migrate('schematic/netlist.csv',schematic_rows)
print('Reviewed rows synchronized; legacy unrelated rows were not regenerated.')
