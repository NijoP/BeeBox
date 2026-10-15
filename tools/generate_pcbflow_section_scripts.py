from pathlib import Path
import re, json
passive_library=json.loads(Path('schematic/verified_passive_library.json').read_text(encoding='utf8'))
device_library=json.loads(Path('schematic/verified_device_library.json').read_text(encoding='utf8'))
canonical=json.loads(Path('schematic/canonical_physical_pin_maps.json').read_text(encoding='utf8'))['components']
for ref,spec in device_library.items():
    if ref in canonical:
        if spec['mpn']!=canonical[ref]['mpn']: raise ValueError(f'{ref}: canonical MPN mismatch')
        if spec.get('physicalPinNets') and spec['physicalPinNets']!=canonical[ref]['pins']: raise ValueError(f'{ref}: conflicting physical-pin maps')
        spec['physicalPinNets']=canonical[ref]['pins']
src=Path('easyeda_scripts/section_generator.template.js').read_text(encoding='utf8')
layouts={
'USB_POWER_ENTRY':('USB-C INPUT / USB2 DATA / CC / ESD',[350,500]),
'EXTERNAL_POWER_CHARGING':('EXTERNAL INPUT / SOURCE MUX / CHARGER / BATTERY',[1550,500]),
'REGULATORS':('REGULATORS / POWER DISTRIBUTION',[3000,500]),
'ESP32_CORE':('ESP32-S3 / BOOT / RESET / PROGRAMMING',[350,1450]),
'EXTERNAL_SENSORS_AUDIO':('EXTERNAL SENSORS / AUDIO',[1850,1450]),
'STORAGE_RF':('STORAGE / RF EXPANSION - DNI FOOTPRINTS PENDING',[3000,1450]),
'DOCKING':('DOCKING / ESD / 12 INDIVIDUAL CONTACTS',[350,2350]),
'UNIVERSAL_SENSOR_FPC':('BOARD B - UNIVERSAL SENSOR FPC',[1650,2350]),
'STATUS_TEST':('STATUS / DEBUG / TEST POINTS',[3500,2350]),
}
# (section, parts, passives, explicit provisional note)
sections={
'01_usb_power_entry.js':('USB_POWER_ENTRY',[
 ('J1','TYPE-C-31-M-12','0'),('D6','USBLC6-2SC6','1')],[
 ('R6','R','5.1k','USB_CC1','GND'),('R7','R','5.1k','USB_CC2','GND'),('C21','C','4.7uF','VBUS_USB','GND'),('C22','C','10nF','VBUS_USB','GND')],''),
'02_external_power_charging.js':('EXTERNAL_POWER_CHARGING',[
 ('U6','TPS26600RHFT','0'),('U11','TPS2121RUXR','1'),('U2','BQ24074RGTR','2'),('J4','S2B-PH-SM4-TB','3')],[
 ('R11','R','1.78k','CHARGER_ISET','GND'),('R12','R','1.54k','CHARGER_ILIM','GND'),('R13','R','46.4k','CHARGER_TMR','GND'),('R16','R','10k','CHARGER_TS','GND'),('R17','R','10k','CHARGER_PGOOD','+3V3'),('R18','R','10k','CHARGER_CHG','+3V3'),('C23','C','1u','VIN_CHARGER','GND'),('C24','C','22u','VSYS','GND'),('C25','C','1u','VBAT','GND'),('R20','R','11.8k','EXT_ILIM','GND'),('R21','R','576k','VIN_EXT_RAW','EXT_OVP'),('R22','R','100k','EXT_OVP','GND'),('C26','C','100n','EXT_DVDT','GND'),('R23','R','10k','EXT_FLT','+3V3'),('R24','R','80.6k','PWRMUX_ILM','GND'),('C27','C','100n','PWRMUX_SS','GND')],
 'VIN_EXT_RAW is an explicit external-input boundary net; exact field connector remains provisional/DNI.'),
'03_regulators_power.js':('REGULATORS',[
 ('U3','TPS62161DSGR','0'),('Q1','TPS22919DCKR','1'),('Q2','TPS22919DCKR','2')],[
 ('L1','L','2.2u','BUCK_SW','+3V3'),('R25','R','10k','REG_PG','+3V3'),('C29','C','22u','VSYS','GND'),('C30','C','22u','+3V3','GND')],
 'TPS62161 is fixed 3.3V; FB is grounded and no divider is fitted. Battery-end dropout remains a documented system limitation.'),
'04_esp32_core.js':('ESP32_CORE',[
 ('U1','ESP32-S3-WROOM-1-N16R8','0'),('U12','SN74LVC1G3157DBVR','1')],[
 ('C1','C','100n','+3V3','GND'),('C2','C','1u','+3V3','GND'),('C4','C','100n','ESP_EN','GND'),('R26','R','10k','ESP_EN','+3V3'),('R27','R','10k','ESP_BOOT','+3V3')],''),
'05_external_sensors_audio.js':('EXTERNAL_SENSORS_AUDIO',[
 ('U7','SHT45-AD1B-R2','0'),('MIC1','ICS-43434','1')],[
 ('C3','C','100n','+3V3','GND'),('C5','C','100n','+3V3','GND')],''),
'06_storage_rf_expansion.js':('STORAGE_RF',[],[],
 'J-SD and J-RF are intentional DNI until exact connectors/footprints are selected; SPI/UART nets remain reserved on U1.'),
'07_docking_interface.js':('DOCKING',[
 ('U4','TCA9546APWR','0'),('D5','TPD4E05U06DQAR','1')],[
 ('R4','R','2.2k','I2C_MAIN_SDA','+3V3'),('R5','R','2.2k','I2C_MAIN_SCL','+3V3'),('R28','R','10k','I2C_MUX_RESET','+3V3')],
 'J3-01..J3-12 are explicit provisional boundary contacts; no false 12-pin replacement component is used.'),
'08_universal_sensor_fpc.js':('UNIVERSAL_SENSOR_FPC',[
 ('J2','FH34SRJ-12S','0'),('U8','SHT45-AD1B-R2','1'),('MIC2','ICS-43434','2'),('U9','ICM-42688-P','3')],[
 ('C10','C','100n','+3V3_FPC','GND'),('C11','C','100n','+3V3_FPC','GND'),('C12','C','100n','+3V3_FPC','GND')],
 'BOARD B logical assignment. U10 SGP40 is DNI.'),
'09_status_debug.js':('STATUS_TEST',[
 ('D2','LTST-C193KRKT-5A','0'),('D3','LTST-C193KGKT-5A','1')],[
 ('R1','R','1k','LED_R','LED_R_A'),('R2','R','1k','LED_G','LED_G_A')],
 'D4 blue LED is explicit DNI because exact LTST-C193KBKT-5A library identity is unavailable; no TBKT substitution.'),
}

# Use canonical physical maps; readable pin-name maps in this file are deliberately unnecessary.
for fn,(section,parts,passives,note) in sections.items():
    if fn=='01_usb_power_entry.js':
        continue  # dedicated USB layout-test script is release-gated and must not be overwritten by the generic engine
    s=src.replace('const PASSIVE_LIBRARY = {};','const PASSIVE_LIBRARY = '+json.dumps(passive_library,ensure_ascii=False)+';')
    s=s.replace('const DEVICE_LIBRARY = {};','const DEVICE_LIBRARY = '+json.dumps(device_library,ensure_ascii=False)+';')
    heading,base=layouts[section]
    s=s.replace('const SECTION = "<BLOCK NAME>";',f'const SECTION = {json.dumps(section)};')
    s=s.replace('const SECTION_HEADING = "<BLOCK HEADING>";',f'const SECTION_HEADING = {json.dumps(heading)};')
    s=s.replace('const SECTION_NOTE = "";',f'const SECTION_NOTE = {json.dumps(note)};')
    s=s.replace('const BASE = [200, 200];',f'const BASE = {json.dumps(base)};')
    ptxt=[]
    for ref,q,col in parts:
        ptxt.append('{ ref: '+repr(ref)+', query: '+repr(q)+', token: '+repr('id:'+device_library[ref]['mpn'])+', col: '+col+', row: 0, rot: 0, pinMap: {} }')
    s=re.sub(r'const PARTS = \[.*?\];','const PARTS = [\n  '+',\n  '.join(ptxt)+'\n];',s,flags=re.S)
    pass_txt=',\n  '.join('['+repr(a)+', '+repr(b)+', '+repr(c)+', '+repr(d)+', '+repr(e)+']' for a,b,c,d,e in passives)
    s=re.sub(r'const PASSIVES = \[.*?\];','const PASSIVES = [\n  '+pass_txt+'\n];',s,flags=re.S)
    contacts=[]
    if section=='DOCKING':
        nets=['GND','GND','GND','VDOCK','VDOCK','+3V3_FPC','DOCK_SDA','DOCK_SCL','DOCK_BCLK','DOCK_WS','DOCK_SD','DOCK_PRESENT_ID']
        contacts=[{'ref':f'J3-{i:02d}','net':net} for i,net in enumerate(nets,1)]
    s=s.replace('const BOUNDARY_CONTACTS = [];','const BOUNDARY_CONTACTS = '+json.dumps(contacts)+';')
    s='\n'.join(line.rstrip() for line in s.splitlines())+'\n'
    (Path('easyeda_scripts')/fn).write_text(s,encoding='utf8')
Path('schematic/standalone_sections.json').write_text(json.dumps({k:{'section':v[0],'parts':[x[0] for x in v[1]],'passives':[{'ref':x[0],'kind':x[1],'value':x[2],'netA':x[3],'netB':x[4]} for x in v[2]],'note':v[3],'base':layouts[v[0]][1]} for k,v in sections.items()},indent=2)+'\n',encoding='utf8')
