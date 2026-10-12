"""Reproducible pre-schematic checks for BeeBox.
Inputs are deliberately explicit engineering assumptions, not measured results.
Run: python tools/verify_engineering.py
Outputs: analysis_outputs/*.csv and analysis_outputs/results.json
"""
from pathlib import Path
import csv, json, math
OUT=Path('analysis_outputs'); OUT.mkdir(exist_ok=True)
# Assumptions to be replaced by exact datasheet values, supplier data, and client inputs.
A={
 'battery_v_nom':3.7,'battery_capacity_ah':2.0,'usable_fraction':0.80,
 'converter_efficiency':0.88,'battery_v_min':3.0,
 'esp32_active_a':0.24,'esp32_rf_peak_a':0.43,
 'local_sensors_typ_a':0.012,'fpc_sensors_typ_a':0.010,
 'storage_typ_a':0.080,'rf_expansion_typ_a':0.100,
 'dock_typ_a':0.020,'charge_a':0.50,'input_v':6.0,
 'i2c_pullup_ohm':4700,'i2c_cap_pf':100,'i2c_cap_worst_pf':200,
 'audio_sample_hz':16000,'audio_bits':24,'audio_channels':1,
 'overhead_factor':1.25,
}
def row(**kw): return kw
# Power scenarios: design estimates, not component guarantees.
scenarios=[
 ('battery_idle',0.080,0.003,0.000,0.000),
 ('battery_normal_logging',A['esp32_active_a'],A['local_sensors_typ_a'],A['fpc_sensors_typ_a'],A['storage_typ_a']),
 ('battery_wifi_logging',A['esp32_active_a'],A['local_sensors_typ_a'],A['fpc_sensors_typ_a'],A['storage_typ_a']+A['rf_expansion_typ_a']),
 ('battery_peak_assumed',A['esp32_rf_peak_a'],0.020,0.020,A['storage_typ_a']+A['rf_expansion_typ_a']),
 ('external_normal',A['esp32_active_a'],A['local_sensors_typ_a'],A['fpc_sensors_typ_a'],A['storage_typ_a']),
]
power=[]
for name,mc,sens,fpc,other in scenarios:
    i=mc+sens+fpc+other+A['dock_typ_a']
    p=A['battery_v_nom']*i
    runtime=(A['battery_capacity_ah']*A['usable_fraction']*A['converter_efficiency'])/i if i else None
    power.append(row(scenario=name,total_current_a=i,battery_power_w=p,runtime_h=runtime,
                     source='explicit assumption set in verify_engineering.py',status='PROVISIONAL'))
# Charger thermal screening: linear worst-case approximation at input and battery voltages.
charger=[]
for vb in (3.0,3.7,4.2):
    charger.append(row(input_v=A['input_v'],battery_v=vb,charge_a=A['charge_a'],
      approx_dissipation_w=(A['input_v']-vb)*A['charge_a'],
      note='screening estimate; exact IC thermal model and board theta-JA required'))
# I2C first-order rise time.
i2c=[]
for cp in (A['i2c_cap_pf'],A['i2c_cap_worst_pf']):
 for rp in (4700,2200,1000):
  tr=0.8473*rp*cp*1e-12
  i2c.append(row(capacitance_pf=cp,pullup_ohm=rp,rise_time_ns=tr*1e9,
    sink_current_ma=3.3/rp*1000,standard_100k_limit_ns=1000,fast_400k_limit_ns=300,
    status_100k='PASS' if tr<=1e-6 else 'FAIL',status_400k='PASS' if tr<=300e-9 else 'FAIL'))
# Raw mono audio storage.
audio_bps=A['audio_sample_hz']*A['audio_bits']*A['audio_channels']
audio_day=audio_bps*A['overhead_factor']*86400/8
results={
 'assumptions':A,'power':power,'charger_screening':charger,'i2c':i2c,
 'audio':row(raw_bps=audio_bps,with_overhead_bps=audio_bps*A['overhead_factor'],bytes_per_day=audio_day,
             gib_per_day=audio_day/(1024**3),note='continuous raw audio; event/features mode may reduce this'),
 'limitations':['Inputs are assumptions pending exact datasheets, client requirements and measurements.',
                'No result is prototype validation or supplier availability evidence.']}
for name,rows in [('power_budget.csv',power),('charger_screening.csv',charger),('i2c_rise_time.csv',i2c)]:
 with (OUT/name).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=rows[0].keys()); w.writeheader(); w.writerows(rows)
(OUT/'results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps(results,indent=2))
