from pathlib import Path
import re
import json
manifest_path = Path('schematic/verified_passive_library.json')
passive_library = json.loads(manifest_path.read_text(encoding='utf8')) if manifest_path.exists() else {}
device_path = Path('schematic/verified_device_library.json')
device_library = json.loads(device_path.read_text(encoding='utf8')) if device_path.exists() else {}
canonical=json.loads(Path('schematic/canonical_physical_pin_maps.json').read_text(encoding='utf8'))['components']
for ref,spec in device_library.items():
 if ref in canonical:
  if spec['mpn']!=canonical[ref]['mpn']:raise ValueError(f'{ref}: canonical MPN mismatch')
  if spec.get('physicalPinNets') and spec['physicalPinNets']!=canonical[ref]['pins']:raise ValueError(f'{ref}: conflicting physical-pin maps')
  spec['physicalPinNets']=canonical[ref]['pins']
src=Path('easyeda_scripts/section_generator.template.js').read_text(encoding='utf8')
layouts={
'POWER_INPUTS':('POWER INPUT / USB-C / BATTERY / CHARGING',[1150,2920],[50,3200,2800,850]),
'REGULATORS':('REGULATORS / POWER DISTRIBUTION',[3050,2920],[2900,3200,1500,850]),
'ESP32_CORE':('ESP32-S3 MCU / BOOT / RESET / PROGRAMMING',[250,1980],[100,2350,1500,950]),
'EXTERNAL_SENSORS_AUDIO':('EXTERNAL SENSORS / AUDIO',[1800,1980],[1650,2350,1050,950]),
'STORAGE_RF':('STORAGE / RF EXPANSION',[2950,1980],[2800,2350,1200,950]),
'DOCKING':('DOCKING / 12-CONTACT POGO INTERFACE',[250,900],[100,1250,1550,950]),
'UNIVERSAL_SENSOR_FPC':('UNIVERSAL SENSOR / IMU / FPC INTERFACE',[1800,900],[1650,1250,1550,950]),
'STATUS_TEST':('STATUS LEDS / DEBUG / TEST POINTS',[3350,900],[3250,1250,1250,950]),
}
sections={
'01_power_inputs_charging.js':('POWER_INPUTS',[('U2','BQ24074RGTR','id:BQ24074RGTR','0',{'TS':'BATT_TS','BAT':'VBAT','CE#':'GND','EN2':'CHG_EN2','EN1':'CHG_EN1','PGOOD#':'CHARGER_PGOOD','VSS':'GND','CHG#':'CHARGER_CHG','OUT':'VSYS','ILIM':'CHARGER_ILIM','IN':'VIN_CHARGER','TMR':'CHARGER_TMR','ITERM':'CHARGER_ITERM','ISET':'CHARGER_ISET','EP':'GND'}),('U6','TPS26600RHFT','id:TPS26600RHFT','1',{'N.C':None,'IN':'VIN_EXT_RAW','UVLO':'EXT_UVLO','OVP':'EXT_OVP','MODE':'EXT_MODE','SHDN#':'EXT_SHDN','RTN':'GND','GND':'GND','IMON':'EXT_IMON','ILIM':'EXT_ILIM','dVdT':'EXT_DVDT','FLT#':'EXT_FLT','OUT':'VIN_EXT_PROTECTED','EP':'GND'}),('U11','TPS2121RUXR','id:TPS2121RUXR','2',{'OUT':'VIN_CHARGER','IN2':'VIN_EXT_PROTECTED','CP2':'PWRMUX_CP2','OV2':'PWRMUX_OV2','OV1':'PWRMUX_OV1','PR1':'PWRMUX_PR1','IN1':'VBUS_USB','ST':'PWRMUX_ST','ILM':'PWRMUX_ILM','SS':'PWRMUX_SS','GND':'GND'}),('J1','TYPE-C-31-M-12','id:TYPE-C-31-M-12','3',{'GND':'GND','VBUS':'VBUS_USB','SBU2':None,'CC1':'USB_CC1','DN2':'USB_DN_CONN','DP1':'USB_DP_CONN','DN1':'USB_DN_CONN','DP2':'USB_DP_CONN','SBU1':None,'CC2':'USB_CC2','EH':'GND'}),('D6','USBLC6-2SC6','id:USBLC6-2SC6','4',{'1':'USB_DP_CONN','2':'GND','3':'USB_DN_CONN','4':'USB_D_N','5':'VBUS_USB','6':'USB_D_P'}),('J4','S2B-PH-SM4-TB','id:S2B-PH-SM4-TB','5',{'1':'VBAT','2':'GND'})],[('R6','R','5.1k','USB_CC1','GND'),('R7','R','5.1k','USB_CC2','GND'),('C21','C','4.7uF','VBUS_USB','GND'),('C22','C','10nF','VBUS_USB','GND'),('R11','R','1.78k','CHARGER_ISET','GND'),('R12','R','1.54k','CHARGER_ILIM','GND'),('R13','R','46.4k','CHARGER_TMR','GND')]),
'02_regulators_power.js':('REGULATORS',[('U3','TPS62162DSGR','id:TPS62162DSGR','0',{'PGND':'GND','VIN':'VSYS','EN':'VSYS','AGND':'GND','FB':'GND','VOS':'+3V3','SW':'BUCK_SW','PG':'REG_PG','EP':'GND'}),('Q1','TPS22919DCKR','id:TPS22919DCKR','1',{'IN':'VSYS','GND':'GND','ON':'DOCK_EN','NC':None,'QOD':'VDOCK','VOUT':'VDOCK'})],[('L1','L','2.2u','BUCK_SW','+3V3')]),
'03_esp32_core.js':('ESP32_CORE',[('U1','ESP32-S3-WROOM-1-N16R8','id:ESP32-S3-WROOM-1-N16R8','0',{'GND':'GND','3V3':'+3V3','EN':'ESP_EN','IO4':'I2C_MAIN_SDA','IO5':'I2C_MAIN_SCL','IO6':'SPI_SCLK','IO7':'SPI_MOSI','IO15':'CHG_EN2','IO16':'CHG_EN1','IO17':'UART1_RX','IO18':'UART1_TX','IO8':'SPI_MISO','IO19':'USB_D_N','IO20':'USB_D_P','IO3':None,'IO46':None,'IO9':'SD_CS','IO10':'RF_CS','IO11':'I2S_BCLK','IO12':'I2S_WS','IO13':'I2S_SD','IO14':'DOCK_EN','IO21':'PWRMUX_ST','IO47':'LED_R','IO48':'LED_B','IO45':None,'IO0':'ESP_BOOT','IO35':None,'IO36':None,'IO37':None,'IO38':'DOCK_PRESENT_ID','IO39':'AUDIO_SEL','IO40':'LED_G','IO41':'CHARGER_PGOOD','IO42':'CHARGER_CHG','RXD0':'DEBUG_RX','TXD0':'DEBUG_TX','IO2':'VBAT_ADC','IO1':'EXT_SENSOR_INT'}),('U12','SN74LVC1G3157DBVR','id:SN74LVC1G3157DBVR','1',{'VCC':'+3V3','GND':'GND','NO':'I2S_SD_EXT','NC':'DOCK_SD','COM':'I2S_SD','IN':'AUDIO_SEL'})],[('C1','C','100n','+3V3','GND'),('C2','C','1u','+3V3','GND')]),
'04_external_sensors_audio.js':('EXTERNAL_SENSORS_AUDIO',[('U7','SHT45-AD1B-R2','id:SHT45-AD1B-R2','0',{'VDD':'+3V3','VSS':'GND','GND':'GND','SDA':'LOCAL_SDA','SCL':'LOCAL_SCL','5':None}),('MIC1','ICS-43434','id:ICS-43434','1',{'VDD':'+3V3','GND':'GND','SCK':'I2S_BCLK','WS':'I2S_WS','SD':'I2S_SD_EXT','LR':'GND'})],[('C3','C','100n','+3V3','GND')]),
'05_storage_rf_expansion.js':('STORAGE_RF',[('J-SD','microSD','microsd','0',{'VDD':'+3V3','GND':'GND','SCLK':'SPI_SCLK','MOSI':'SPI_MOSI','MISO':'SPI_MISO','CS':'SD_CS'}),('J-RF','header','header','1',{'VCC':'+3V3','GND':'GND','SCLK':'SPI_SCLK','MOSI':'SPI_MOSI','MISO':'SPI_MISO','TX':'UART1_TX','RX':'UART1_RX'})],[]),
'06_docking_interface.js':('DOCKING',[('U4','TCA9546APWR','id:TCA9546APWR','0',{'A0':'GND','A1':'GND','RESET#':'I2C_MUX_RESET','SD0':'DOCK_SDA','SC0':'DOCK_SCL','SD1':'LOCAL_SDA','SC1':'LOCAL_SCL','GND':'GND','SD2':None,'SC2':None,'SD3':None,'SC3':None,'A2':'GND','SCL':'I2C_MAIN_SCL','SDA':'I2C_MAIN_SDA','VCC':'+3V3'}),('D5','TPD4E05U06DQAR','id:TPD4E05U06DQAR','1',{'D1+':'DOCK_D1_P','D1-':'DOCK_D1_N','GND':'GND','D2+':'DOCK_D2_P','D2-':'DOCK_D2_N','NC':None}),('J3','0906-0-15-20-75-14-11-0','id:0906-0-15-20-75-14-11-0','2',{'1':'GND','2':'GND','3':'GND','4':'VDOCK','5':'VDOCK','6':'+3V3_FPC','7':'DOCK_SDA','8':'DOCK_SCL','9':'DOCK_BCLK','10':'DOCK_WS','11':'DOCK_SD','12':'DOCK_PRESENT_ID','13':None,'14':None})],[('R4','R','2.2k','I2C_MAIN_SDA','+3V3'),('R5','R','2.2k','I2C_MAIN_SCL','+3V3')]),
'07_universal_sensor_fpc.js':('UNIVERSAL_SENSOR_FPC',[('J2','FH34SRJ-12S','id:FH34SRJ-12S-0.5SH(50)','0',{'1':'GND','2':'GND','3':'GND','4':'VDOCK','5':'VDOCK','6':'+3V3_FPC','7':'DOCK_SDA','8':'DOCK_SCL','9':'DOCK_BCLK','10':'DOCK_WS','11':'DOCK_SD','12':'DOCK_PRESENT_ID','13':None,'14':None}),('U8','SHT45-AD1B-R2','id:SHT45-AD1B-R2','1',{'VDD':'+3V3_FPC','VSS':'GND','GND':'GND','SDA':'DOCK_SDA','SCL':'DOCK_SCL','5':None}),('MIC2','ICS-43434','id:ICS-43434','2',{'VDD':'+3V3_FPC','GND':'GND','SCK':'DOCK_BCLK','WS':'DOCK_WS','SD':'DOCK_SD','LR':'GND'}),('U9','ICM-42688-P','id:ICM-42688-P','3',{'AP_SDO/AP_AD0':'GND','RESV':None,'INT1/INT':None,'VDDIO':'+3V3_FPC','GND':'GND','VDD':'+3V3_FPC','INT2/FSYNC/CLKIN':'GND','AP_CS':'+3V3_FPC','AP_SCL/AP_SCLK':'DOCK_SCL','AP_SDA/AP_SDIO/AP_SDI':'DOCK_SDA'})],[('C10','C','100n','+3V3_FPC','GND'),('C11','C','100n','+3V3_FPC','GND'),('C12','C','100n','+3V3_FPC','GND')]),
'08_status_debug_test.js':('STATUS_TEST',[('D2','LTST-C193KRKT-5A','id:LTST-C193KRKT-5A','0',{'A':'LED_R_A','K':'GND','+':'LED_R_A','-':'GND'}),('D3','LTST-C193KGKT-5A','id:LTST-C193KGKT-5A','1',{'A':'LED_G_A','K':'GND','+':'LED_G_A','-':'GND'}),('D4','LTST-C193KBKT-5A','id:LTST-C193KBKT-5A','2',{'A':'LED_B_A','K':'GND','+':'LED_B_A','-':'GND'})],[('R1','R','1k','LED_R','LED_R_A'),('R2','R','1k','LED_G','LED_G_A'),('R3','R','1k','LED_B','LED_B_A')]),
}
for fn,(section,parts,passives) in sections.items():
 s=src.replace('const PASSIVE_LIBRARY = {};', 'const PASSIVE_LIBRARY = '+json.dumps(passive_library,ensure_ascii=False)+';')
 s=s.replace('const DEVICE_LIBRARY = {};','const DEVICE_LIBRARY = '+json.dumps(device_library,ensure_ascii=False)+';')
 heading,base,frame=layouts[section]
 s=s.replace('const SECTION = "<BLOCK NAME>";',f'const SECTION = "{section}";')
 s=s.replace('const SECTION_HEADING = "<BLOCK HEADING>";',f'const SECTION_HEADING = {json.dumps(heading)};')
 s=s.replace('const BASE = [200, 200];',f'const BASE = {json.dumps(base)};')
 s=s.replace('const FRAME = [100,100,1600,700];',f'const FRAME = {json.dumps(frame)};')
 ptxt=[]
 for ref,q,t,idx,pm in parts:
  ptxt.append('{ ref: '+repr(ref)+', query: '+repr(q)+', token: '+repr(t)+', col: '+idx+', row: 0, rot: 0, pinMap: '+repr(pm).replace("'",'"').replace('None','null')+' }')
 s=re.sub(r'const PARTS = \[.*?\];', 'const PARTS = [\n  '+',\n  '.join(ptxt)+'\n];',s,flags=re.S)
 pass_txt=',\n  '.join('['+repr(a)+', '+repr(b)+', '+repr(c)+', '+repr(d)+', '+repr(e)+']' for a,b,c,d,e in passives)
 s=re.sub(r'const PASSIVES = \[.*?\];','const PASSIVES = [\n  '+pass_txt+'\n];',s,flags=re.S)
 s='\n'.join(line.rstrip() for line in s.splitlines())+'\n'
 (Path('easyeda_scripts')/fn).write_text(s,encoding='utf8')
