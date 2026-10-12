"""Baseline BeeBox sizing calculations. Assumptions are labelled and must be replaced by final datasheet/client inputs."""
import csv, json
from pathlib import Path
out=Path('analysis_outputs'); out.mkdir(exist_ok=True)
# Proposed baseline: 1S 2000 mAh protected LiPo, 3.3 V buck, 100 kHz dock.
loads={
 'ESP32_S3_active_est':240, 'ESP32_S3_RF_peak_est':430,
 'local_SHT45_est':1, 'external_ICS43434_est':0.7,
 'FPC_SHT45_est':1, 'FPC_ICS43434_est':0.7, 'IMU_est':1,
 'storage_write_est':80, 'dock_logic_est':10, 'status_LED_max':5,
}
# scenarios in mA; peak is a design screen, not a datasheet assertion.
scenarios={
 'sleep_screen':loads['dock_logic_est']+1,
 'normal_logging':loads['ESP32_S3_active_est']+loads['local_SHT45_est']+loads['external_ICS43434_est']+loads['FPC_SHT45_est']+loads['FPC_ICS43434_est']+loads['IMU_est']+loads['storage_write_est']+loads['dock_logic_est'],
 'wifi_logging':loads['ESP32_S3_RF_peak_est']+loads['local_SHT45_est']+loads['external_ICS43434_est']+loads['FPC_SHT45_est']+loads['FPC_ICS43434_est']+loads['IMU_est']+loads['storage_write_est']+loads['dock_logic_est'],
}
cap=2.0; usable=.80; eta=.88; vnom=3.7
power=[]
for name,i in scenarios.items():
 power.append({'scenario':name,'current_mA':i,'power_W':vnom*i/1000,'runtime_h':cap*usable*eta/(i/1000),'status':'PROVISIONAL'})
# 6 V external input through linear 1-cell charger screening.
charge=[]
for vb in [3.0,3.7,4.2]: charge.append({'vin_V':6,'vbat_V':vb,'ichg_A':.5,'loss_W':(6-vb)*.5,'status':'THERMAL_REVIEW_REQUIRED'})
# status LED design: 3.3V, 1k resistor, approximate Vf values; confirm exact LED datasheets.
led=[]
for colour,vf in [('red',1.9),('green',2.1),('blue',2.8)]: led.append({'colour':colour,'vf_assumed_V':vf,'resistor_ohm':1000,'current_mA':(3.3-vf)/1000*1000})
# Dock scenarios: simple planning model, not a transmission-line simulation.
# Assumes 40 pF connector/pogo/input contribution plus 0.8 pF/mm flex/interconnect.
lengths=[]
for mm in (50,100,200):
 cp=40+0.8*mm
 tr=0.8473*2200*cp*1e-12
 lengths.append({'length_mm':mm,'capacitance_pF':cp,'rise_time_ns':tr*1e9,'status_100k':'PASS' if tr<1e-6 else 'FAIL'})
# 100kHz I2C reference at 200pF, 2.2k.
tr=0.8473*2200*200e-12
clip_bytes=16000*24*5/8
clip_day=clip_bytes*12*24
result={'loads_mA':loads,'power':power,'charger':charge,'status_led':led,
'i2c':{'pullup_ohm':2200,'capacitance_pF':200,'rise_time_ns':tr*1e9,'criterion_ns':1000,'status':'PASS_CALCULATED_100KHZ_ASSUMPTION_BOUND'},
'fpc_length_scenarios':lengths,
'audio_event_mode':{'sample_rate_hz':16000,'bits':24,'clip_seconds':5,'clips_per_hour_per_mic':12,'clip_bytes':clip_bytes,'clip_storage_per_day_bytes':clip_day,'clip_storage_per_day_MiB':clip_day/(1024**2)},
'notes':['No measured values are included. Replace all estimated currents with exact selected-part maximum/typical data and firmware duty cycles.']}
for fn,rows in [('baseline_power.csv',power),('baseline_charger.csv',charge),('baseline_status_led.csv',led)]:
 with (out/fn).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=rows[0]); w.writeheader(); w.writerows(rows)
(out/'baseline_results.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps(result,indent=2))
