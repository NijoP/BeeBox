#!/usr/bin/env python3
"""Complete the existing reviewed EasyEDA manifests for executable section generation."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
LIB='0819f05c4eef4c71ace90d822a990e87'
def load(p): return json.loads((ROOT/p).read_text(encoding='utf8'))
def save(p,v): (ROOT/p).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
search={}
for p in ['outputs/schematic/readback/library_search_power.json','outputs/schematic/readback/library_search_sensors.json','outputs/schematic/readback/library_search_misc.json','outputs/schematic/readback/library_search_remaining.json']:
 for q,rows in load(p).get('result',{}).items(): search[q]=rows

def exact(query,mpn,manufacturer_contains=None,supplier=None):
 rows=[r for r in search[query] if r.get('manufacturerId')==mpn]
 if manufacturer_contains: rows=[r for r in rows if manufacturer_contains.lower() in (r.get('manufacturer') or '').lower()]
 if supplier: rows=[r for r in rows if r.get('supplierId')==supplier]
 if len(rows)!=1: raise ValueError((query,mpn,len(rows)))
 return rows[0]

maps=load('schematic/canonical_physical_pin_maps.json')
C=maps['components']
C.update({
'U2':{'mpn':'BQ24074RGTR','evidence':'datasheets/TI_BQ24074.txt pin table and application requirements','pins':{'1':'CHARGER_TS','2':'VBAT','3':'VBAT','4':'GND','5':'GND','6':'VIN_CHARGER','7':'CHARGER_PGOOD','8':'GND','9':'CHARGER_CHG','10':'VSYS','11':'VSYS','12':'CHARGER_ILIM','13':'VIN_CHARGER','14':'CHARGER_TMR','15':None,'16':'CHARGER_ISET','17':'GND'},'noConnects':{'15':'ITERM left open selects datasheet default 10% termination'},'notes':'CE enabled; EN2=0/EN1=1 selects USB500 once input is present; TS uses fixed 10k to GND because 2-contact battery connector has no NTC.'},
'U6':{'mpn':'TPS26600RHFT','evidence':'datasheets/TI_TPS2660.txt pin table','pins':{**{str(i):None for i in range(1,8)},'8':'VIN_EXT_RAW','9':'VIN_EXT_RAW','10':'VIN_EXT_RAW','11':None,'12':'EXT_OVP','13':'GND','14':'VIN_EXT_RAW','15':'GND','16':None,'17':'GND','18':None,'19':'EXT_ILIM','20':'EXT_DVDT','21':None,'22':'EXT_FLT','23':'VIN_EXT_PROTECTED','24':'VIN_EXT_PROTECTED','25':'GND'},'notes':'UVLO tied IN (external UVLO disabled); OVP 576k/100k gives about 8.0V; ILIM 11.8k gives 1A; MODE=RTN auto-retry; IMON unused; dVdT 100nF.'},
'U11':{'mpn':'TPS2121RUXR','evidence':'datasheets/TI_TPS2121.txt pin table','pins':{'1':'VIN_CHARGER','2':'VIN_EXT_PROTECTED','3':'GND','4':'GND','5':'GND','6':'GND','7':'VBUS_USB','8':'VIN_CHARGER','9':'PWRMUX_ST','10':'PWRMUX_ILM','11':'PWRMUX_SS','12':'GND'},'notes':'PR1/CP2 low selects internal highest-voltage comparator; OV pins low disable redundant OVP; 80.6k ILM about 1.5A; 100nF SS.'},
'U1':{'mpn':'ESP32-S3-WROOM-1-N16R8','evidence':'datasheets/Espressif_ESP32S3WROOM1.txt module pin table','pins':{'1':'GND','2':'+3V3','3':'ESP_EN','4':'I2C_MAIN_SDA','5':'I2C_MAIN_SCL','6':'SPI_SCLK','7':'SPI_MOSI','8':'RF_RST','9':'RF_EN','10':'UART1_RX','11':'UART1_TX','12':'SPI_MISO','13':'USB_D_N','14':'USB_D_P','15':None,'16':None,'17':'SD_CS','18':'RF_CS','19':'I2S_BCLK','20':'I2S_WS','21':'I2S_SD','22':'DOCK_EN','23':'PWRMUX_ST','24':'LED_R','25':'LED_B','26':None,'27':'ESP_BOOT','28':None,'29':None,'30':None,'31':'DOCK_PRESENT_ID','32':'AUDIO_SEL','33':'LED_G','34':'CHARGER_PGOOD','35':'CHARGER_CHG','36':'DEBUG_RX','37':'DEBUG_TX','38':'VBAT_ADC','39':'EXT_SENSOR_INT','40':'GND','41':'GND'},'notes':'Reserved/strapping pins explicitly NC; module pad40/41 GND.'},
'MIC1':{'mpn':'ICS-43434','evidence':'datasheets/TDK_ICS43434.txt','pins':{'1':'I2S_WS','2':'GND','3':'GND','4':'I2S_BCLK','5':'+3V3','6':'I2S_SD_EXT'}},
'MIC2':{'mpn':'ICS-43434','evidence':'datasheets/TDK_ICS43434.txt','pins':{'1':'DOCK_WS','2':'GND','3':'GND','4':'DOCK_BCLK','5':'+3V3_FPC','6':'DOCK_SD'}},
'D5':{'mpn':'TPD4E05U06DQAR','evidence':'TI TPD4E05U06 datasheet; C138714 exact TI record','pins':{'1':'DOCK_SDA','2':'DOCK_SCL','3':'GND','4':'DOCK_BCLK','5':'DOCK_WS','6':None,'7':None,'8':'GND','9':'DOCK_SD','10':'DOCK_PRESENT_ID'},'notes':'Four protected channels plus grounds; library pin naming is pair-style but device channels are shunt ESD.'},
'J2':{'mpn':'FH34SRJ-12S-0.5SH(50)','evidence':'datasheets/J2_manufacturer_record.txt and C424659','pins':{'1':'GND','2':'GND','3':'GND','4':'VDOCK','5':'VDOCK','6':'+3V3_FPC','7':'DOCK_SDA','8':'DOCK_SCL','9':'DOCK_BCLK','10':'DOCK_WS','11':'DOCK_SD','12':'DOCK_PRESENT_ID','13':None,'14':None},'noConnects':{'13':'mechanical metal fitting','14':'mechanical metal fitting'}},
'D2':{'mpn':'LTST-C193KRKT-5A','evidence':'live exact Lite-On C157741','pins':{'1':'GND','2':'LED_R_A'}},
'D3':{'mpn':'LTST-C193KGKT-5A','evidence':'live exact Lite-On C125102','pins':{'1':'GND','2':'LED_G_A'}},
})
save('schematic/canonical_physical_pin_maps.json',maps)

dev=load('schematic/verified_device_library.json')
def add(ref,row):
 spec={'mpn':row['manufacturerId'],'manufacturer':row.get('manufacturer',''),'uuid':row['uuid'],'libraryUuid':row['libraryUuid'],'supplierId':row.get('supplierId'),'symbolUuid':row.get('symbolUuid'),'footprintUuid':row.get('footprintUuid'),'package':'reviewed catalog footprint '+str(row.get('footprintUuid')),'evidence':C[ref]['evidence'],'physicalPinNets':C[ref]['pins']}
 dev[ref]=spec
for ref,q,mpn,mfg,sup in [
 ('U2','BQ24074RGTR','BQ24074RGTR','TI(',None),('U6','TPS26600RHFT','TPS26600RHFT','TI(',None),('U11','TPS2121RUXR','TPS2121RUXR','TI(',None),('U3','TPS62161DSGR','TPS62161DSGR','TI(',None),('Q1','TPS22919DCKR','TPS22919DCKR','TI(',None),('Q2','TPS22919DCKR','TPS22919DCKR','TI(',None),('U1','ESP32-S3-WROOM-1-N16R8','ESP32-S3-WROOM-1-N16R8','ESPRESSIF',None),('U4','TCA9546APWR','TCA9546APWR','TI(',None),('U12','SN74LVC1G3157DBVR','SN74LVC1G3157DBVR','TI(',None),('U7','SHT45-AD1B-R2','SHT45-AD1B-R2','Sensirion',None),('U8','SHT45-AD1B-R2','SHT45-AD1B-R2','Sensirion',None),('U9','ICM-42688-P','ICM-42688-P','TDK',None),('MIC1','ICS-43434','ICS-43434','TDK','C5656610'),('MIC2','ICS-43434','ICS-43434','TDK','C5656610'),('D5','TPD4E05U06','TPD4E05U06DQAR','TI(','C138714'),('J2','FH34SRJ-12S','FH34SRJ-12S-0.5SH(50)','HRS',None),('D2','LTST-C193KRKT-5A','LTST-C193KRKT-5A','LITEON',None),('D3','LTST-C193KGKT-5A','LTST-C193KGKT-5A','LITEON',None)]: add(ref,exact(q,mpn,mfg,sup))
save('schematic/verified_device_library.json',dev)

p=load('schematic/verified_passive_library.json')
raw=load('outputs/schematic/readback/library_search_passives_complete.json')['result']
def prow(mpn,mfg='UNI-ROYAL'):
 rows=[r for r in raw[mpn] if mfg.lower() in (r.get('manufacturer') or '').lower()]
 if len(rows)!=1: raise ValueError((mpn,len(rows)))
 return rows[0]
def pspec(row,kind,value,package,tolerance,rating,evidence,dielectric=None):
 x={'manufacturer':row['manufacturer'],'uuid':row['uuid'],'libraryUuid':row['libraryUuid'],'supplierId':row['supplierId'],'symbolUuid':row['symbolUuid'],'footprintUuid':row['footprintUuid'],'mpn':row['manufacturerId'],'kind':kind,'value':value,'package':package,'tolerance':tolerance,'rating':rating,'evidence':evidence}
 if dielectric:x['dielectric']=dielectric
 return x
res={
 '1k':pspec(prow('0603WAF1001T5E'),'R','1k','0603','1%','100mW,75V','live C21190'),
 '2.2k':pspec(prow('0603WAF2201T5E'),'R','2.2k','0603','1%','100mW,75V','live C4190'),
 '10k':pspec(prow('0603WAF1002T5E'),'R','10k','0603','1%','100mW,75V','live C25804'),
 '100k':pspec(prow('0603WAF1003T5E'),'R','100k','0603','1%','100mW,75V','live C25803'),
 '1M':pspec(prow('0603WAF1004T5E'),'R','1M','0603','1%','100mW,75V','live C22935'),
 '330k':pspec(prow('0603WAF3303T5E'),'R','330k','0603','1%','100mW,75V','live C23137'),
 '1.78k':pspec(prow('0603WAF1781T5E'),'R','1.78k','0603','1%','100mW,75V','live C22849'),
 '1.54k':pspec(prow('0603WAF1541T5E'),'R','1.54k','0603','1%','100mW,75V','live C22842'),
 '46.4k':pspec(prow('0603WAF4642T5E'),'R','46.4k','0603','1%','100mW,75V','live C23059'),
 '44.2k':pspec(prow('0603WAF4422T5E'),'R','44.2k','0603','1%','100mW,75V','live C23056'),
 '11.8k':pspec(prow('0603WAF1182T5E'),'R','11.8k','0603','1%','100mW,75V','live C22861'),
 '576k':pspec(prow('0603WAF5763T5E'),'R','576k','0603','1%','100mW,75V','live C23207'),
 '100n':pspec(prow('CL10B104KO8NNNC','SAMSUNG'),'C','100n','0603','10%','16V','live C66501','X7R'),
 '1u':pspec(prow('CL10B105KP8NNNC','SAMSUNG'),'C','1u','0603','10%','10V','live C95843','X7R'),
 '22u':pspec(prow('CL31A226KAHNNNE','SAMSUNG'),'C','22u','1206','10%','25V','live C12891','X5R'),
}
# 80.6k came from remaining search
r80=next(r for r in load('outputs/schematic/readback/library_search_remaining.json')['result']['0603WAF8062T5E'] if 'UNI-ROYAL' in r['manufacturer'])
res['80.6k']=pspec(r80,'R','80.6k','0603','1%','100mW,75V','live C23249')
# exact inductor
lrow={'manufacturer':'muRata(村田)','uuid':'e39f1054b6d6456295a19594c649e000','libraryUuid':LIB,'supplierId':'C237482','symbolUuid':'a4022fcbc6354031bc55a67e4d3e393a','footprintUuid':'7ffa6d48304542a09d02f031acdec789','manufacturerId':'DFE252012PD-2R2M=P2'}
res['2.2u']=pspec(lrow,'L','2.2u','DFE252012','20%','2.2A rated,2.8A saturation,84mohm','live C237482 and TPS62161 requirement')
assign={'R1':'1k','R2':'1k','R3':'1k','R4':'2.2k','R5':'2.2k','R8':'1M','R9':'330k','R10':'100k','R11':'1.78k','R12':'1.54k','R13':'46.4k','L1':'2.2u'}
for i in range(1,21): assign[f'C{i}']='100n' if i<=12 else ('1u' if i<=17 else '22u')
assign['C2']='1u'
for ref,key in assign.items(): p[ref]=dict(res[key])
# Additional support refs used by completed sections
extra={'R16':'10k','R17':'10k','R18':'10k','R19':'10k','R20':'11.8k','R21':'576k','R22':'100k','R23':'10k','R24':'80.6k','R25':'10k','R26':'10k','R27':'10k','R28':'10k','C4':'100n','C5':'100n','C23':'1u','C24':'22u','C25':'1u','C26':'100n','C27':'100n','C28':'100n','C29':'22u','C30':'22u'}
for ref,key in extra.items(): p[ref]=dict(res[key])
save('schematic/verified_passive_library.json',p)
print('devices',len(dev),'passives',len(p),'pinmaps',len(C))
