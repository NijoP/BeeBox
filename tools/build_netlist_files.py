from pathlib import Path
import csv
root=Path('.')
for d in ('netlist','bom','easyeda_scripts'): (root/d).mkdir(exist_ok=True)
def write(name,fields,rows):
 with open(name,'w',newline='',encoding='utf8') as f:
  w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(rows)
components=[
('U1','Espressif','ESP32-S3-WROOM-1-N16R8','MCU/Wi-Fi/BLE','main','Yes','official datasheet Figure 11-1','symbol/footprint verify'),
('U2','Texas Instruments','BQ24074RGTR','1S charger/power path','main','Yes','SLUS810N','RGT package'),
('U3','Texas Instruments','TPS62162DSGR','fixed 3V3 buck; FB to AGND','main','Yes','datasheets/TI_TPS62162.pdf','DSG/WSON-8+EP'),
('U4','Texas Instruments','TCA9546APWR','I2C branch switch','main','Yes','datasheets/TI_TCA9546A.pdf','TSSOP-16'),
('U5','Analog Devices','MAX17048G+T10','fuel gauge','main','DNI/option','MAX17048 datasheet','TDFN'),
('U6','Texas Instruments','TPS26600RHFT','6V input eFuse','main','Yes','TPS2660 family datasheet','VQFN'),
('U11','Texas Instruments','TPS2121RUXR','USB/external source power mux','main','Yes','TPS2121 datasheet','WQFN'),
('U12','Texas Instruments','SN74LVC1G3157DBVR','I2S microphone data source switch','main','Yes','SN74LVC1G3157 datasheet','SOT-23-6'),
('Q1','Texas Instruments','TPS22919DCKR','VDOCK load switch; QOD to VOUT','main','Yes','TPS22919 datasheet','DCK'),
('D6','STMicroelectronics','USBLC6-2SC6','USB data flow-through ESD','main','Yes','datasheets/ST_USBLC6-2.pdf','SOT-23-6; ST C7519 verified'),
('D5','Texas Instruments','TPD4E05U06','dock ESD','main','Yes','TPD4E05U06 datasheet','verify package'),
('J1','HRO Electronics','TYPE-C-31-M-12','USB-C USB2.0 sink receptacle','main','Yes','datasheets/J1_HRO_TYPE_C_31_M_12.pdf','12 signal pads+4 shell anchors; C165948'),
('J2','Hirose','FH34SRJ-12S-0.5SH(50)','FPC ZIF','main','Yes','FH34 family drawing','0.5mm/12pos'),
('J3','Mill-Max','0906-0-15-20-75-14-11-0 x12','pogo contacts','dock','Yes','manufacturer drawing','12 contacts'),
('J4','JST','S2B-PH-SM4-TB','battery connector','main','Yes','manufacturer drawing','PH series'),
('BT1','TBD Indian AVL','Protected 1S 3.7V 2000mAh','battery','main','Yes','client/procurement specification','exact cell TBD'),
('MIC1','TDK InvenSense','ICS-43434','external I2S microphone','main','Yes','official datasheet','digital MEMS'),
('U7','Sensirion','SHT45','external temperature/RH','main','Yes','official datasheet','DFN'),
('MIC2','TDK InvenSense','ICS-43434','internal FPC microphone','fpc','Yes','official datasheet','DNI if audio disabled'),
('U8','Sensirion','SHT45','internal FPC temperature/RH','fpc','Yes','official datasheet','DFN'),
('U9','TDK','ICM-42688-P','internal FPC IMU','fpc','Yes','official datasheet','LGA'),
('U10','Sensirion','SGP40','VOC option','fpc','DNI','official datasheet','optional'),
('D2','Lite-On','LTST-C193KRKT-5A','red status LED','main','Yes','manufacturer datasheet','0603'),
('D3','Lite-On','LTST-C193KGKT-5A','green status LED','main','Yes','manufacturer datasheet','0603'),
('D4','Lite-On','LTST-C193KBKT-5A','blue status LED','main','Yes','manufacturer datasheet','0603'),
('J-SD','TBD','microSD socket','SPI storage','main','DNI','exact footprint required','DNP option'),
('J-RF','TBD','RF expansion header','SPI/UART expansion','main','DNI','exact footprint required','DNP option'),
('U-IMU','TDK','ICM-42688-P','optional external/controller IMU','main','DNI','official datasheet','optional'),
('R1-R3','Generic/Indian AVL','1.00k 1%','LED resistors','main','Yes','LED current calculation','0603'),
('R4-R5','Generic/Indian AVL','2.20k 1%','I2C pull-ups','main','Yes','I2C rise-time calculation','0603'),
('R6-R7','UNI-ROYAL','0603WAF5101T5E','5.1k 1% USB-C CC pull-downs','main','Yes','schematic/verified_passive_library.json','0603; 100mW;75V;C23186'),
('C21','Samsung Electro-Mechanics','CL21B475KOFNNNE','4.7uF X7R 16V USB VBUS bulk; revised for inrush budget','main','Yes','datasheets/C21_Samsung_CL21B475KOFNNNE.pdf; TI_BQ24074 USB inrush','0805;10%;C107365'),
('C22','Samsung Electro-Mechanics','CL10B103KB8NNNC','10nF X7R 50V USB VBUS high-frequency bypass','main','Yes','schematic/verified_passive_library.json','0603;10%;C1589'),
('R8','Generic/Indian AVL','1.0M 1%','battery divider high','main','Yes','ADC loading/battery calculation','0603'),
('R9','Generic/Indian AVL','330k 1%','battery divider low','main','Yes','ADC scaling calculation','0603'),
('R10','Generic/Indian AVL','100k 1%','dock ID resistor','fpc','Yes','FPC ID scheme','0603'),
('R11','Generic/Indian AVL','1.78k 1%','BQ24074 ISET','main','Yes','BQ24074 equation','0603'),
('R12','Generic/Indian AVL','1.54k 1%','BQ24074 ILIM','main','Yes','BQ24074 equation','0603'),
('R13','Generic/Indian AVL','46.4k 1%','BQ24074 timer','main','Yes','BQ24074 equation','0603'),
# R14/R15 removed, not arbitrarily DNI: TPS62162 is fixed3.3V; manufacturer specifies FB to AGND.
('C1-C12','Generic/Indian AVL','100nF X7R 16V','IC decoupling','main','Yes','manufacturer local-bypass rules','0603'),
('C13-C17','Generic/Indian AVL','1uF X7R 10V','local rail support','main','Yes','power transient calculation','0603'),
('C18-C20','Generic/Indian AVL','22uF X7R 10V','rail bulk/charger OUT','main','Yes','BQ24074/TPS62162 support','0805/1206 exception'),
('L1','Indian AVL','2.2uH shielded >=1.5A','buck inductor','main','Yes','TPS62162 reference design','power inductor'),
('F1','Bourns','MF-MSMF050-2','input resettable fuse','main','Yes','source fault protection','1206'),
('TP1-TP12','Indian PCB fab','labelled copper test pads','bring-up test points','main','Yes','validation/test plan','PCB pads'),
]

write('netlist/components.csv',['ref','manufacturer','mpn','function','board','population','source','package_or_note'],[dict(zip(['ref','manufacturer','mpn','function','board','population','source','package_or_note'],r)) for r in components])
# net, ref, pin number is deliberately GPIO/pin-name based where package pin numbering needs final drawing review.
conn=[
('VBUS_USB','J1','VBUS','input','U11','IN1'),('VIN_EXT_PROTECTED','U6','OUT','power_out','U11','IN2'),('VIN_CHARGER','U11','OUT','power_out','U2','IN'),('VBAT','J4','1','power','U2','BAT'),('VSYS','U2','OUT','power_out','U3','VIN'),('VSYS','U2','OUT','power_out','Q1','VIN'),('+3V3','U3','VOUT','power_out','U1','VDD33'),('+3V3','U3','VOUT','power_out','U4','VCC'),('+3V3','U3','VOUT','power_out','MIC1','VDD'),('+3V3','U3','VOUT','power_out','U7','VDD'),('VDOCK','Q1','VOUT','power_out','J3','4/5'),('GND','J1','GND','power','U1','GND'),('GND','J3','1/2/3','power','U1','GND'),('I2C_MAIN_SDA','U1','GPIO4','bidirectional','U4','SDA'),('I2C_MAIN_SCL','U1','GPIO5','bidirectional','U4','SCL'),('LOCAL_SDA','U4','SD1','bidirectional','U7','SDA'),('I2S_BCLK','U1','GPIO11','output','MIC1','SCK'),('I2S_WS','U1','GPIO12','output','MIC1','WS'),('I2S_SD_EXT','U1','GPIO13','input','MIC1','SD'),('USB_D_N','U1','GPIO19/USB_D-','bidirectional','D6','4'),('USB_D_P','U1','GPIO20/USB_D+','bidirectional','D6','6'),('DOCK_SDA','U1','GPIO4','bidirectional','J3','7'),('DOCK_SCL','U1','GPIO5','bidirectional','J3','8'),('DOCK_BCLK','U1','GPIO11','output','J3','9'),('DOCK_WS','U1','GPIO12','output','J3','10'),('DOCK_SD','J3','11','input','U1','GPIO13'),('DOCK_PRESENT_ID','J3','12','input','U1','GPIO38'),('LED_R','U1','GPIO47','output','R1','1'),('LED_R_A','R1','2','output','D2','A'),('LED_G','U1','GPIO40','output','R2','1'),('LED_G_A','R2','2','output','D3','A'),('LED_B','U1','GPIO48','output','R3','1'),('LED_B_A','R3','2','output','D4','A'),('SPI_SCLK','U1','GPIO6','output','J-RF','SCLK'),('SPI_MOSI','U1','GPIO7','output','J-RF','MOSI'),('SPI_MISO','U1','GPIO8','input','J-RF','MISO'),('UART1_TX','U1','GPIO18','output','J-RF','RX'),('UART1_RX','U1','GPIO17','input','J-RF','TX'),
]
conn += [('USB_DP_CONN','J1','A6','bidirectional','D6','1'),('USB_DP_CONN','J1','B6','bidirectional','D6','1'),('USB_DN_CONN','J1','A7','bidirectional','D6','3'),('USB_DN_CONN','J1','B7','bidirectional','D6','3')]
conn = [r for r in conn if not ((r[0] in ('DOCK_SDA','DOCK_SCL','DOCK_BCLK','DOCK_WS','DOCK_SD','I2S_SD_EXT')) and (r[1]=='U1' or r[4]=='U1'))]
conn += [('LOCAL_SCL','U4','SC1','bidirectional','U7','SCL'),('DOCK_SDA','U4','SD0','bidirectional','J3','7'),('DOCK_SCL','U4','SC0','bidirectional','J3','8'),('I2S_BCLK','U1','GPIO11','output','J3','9'),('I2S_WS','U1','GPIO12','output','J3','10'),('I2S_SD_EXT','MIC1','SD','output','U12','A'),('DOCK_SD','MIC2','SD','output','U12','B'),('I2S_SD','U12','Y','output','U1','GPIO13'),('AUDIO_SEL','U1','GPIO39','output','U12','S'),('VDOCK','J3','4/5','power','J2','4/5'),('+3V3_FPC','J3','6','power','J2','6'),('+3V3_FPC','J2','6','power','U8','VDD'),('+3V3_FPC','J2','6','power','MIC2','VDD'),('+3V3_FPC','J2','6','power','U9','VDDIO/VDD'),('DOCK_SDA','J2','7','bidirectional','U8','SDA'),('DOCK_SCL','J2','8','bidirectional','U8','SCL'),('DOCK_SDA','J2','7','bidirectional','U9','SDA'),('DOCK_SCL','J2','8','bidirectional','U9','SCL'),('DOCK_BCLK','J2','9','output','MIC2','SCK'),('DOCK_WS','J2','10','output','MIC2','WS'),('DOCK_SD','MIC2','SD','input','J2','11'),('SPI_SCLK','U1','GPIO6','output','J-SD','SCLK'),('SPI_MOSI','U1','GPIO7','output','J-SD','MOSI'),('SPI_MISO','U1','GPIO8','input','J-SD','MISO'),('SD_CS','U1','GPIO9','output','J-SD','CS')]
write('netlist/pin_to_pin.csv',['net','source_ref','source_pin','source_type','destination_ref','destination_pin'],[dict(zip(['net','source_ref','source_pin','source_type','destination_ref','destination_pin'],r)) for r in conn])
nets=sorted({r[0] for r in conn})
write('netlist/nets.csv',['net','board','purpose','status'],[{'net':n,'board':'main↔fpc' if n.startswith('DOCK') or n in ('VDOCK','+3V3_FPC') else 'main','purpose':'canonical net; see pin_to_pin.csv','status':'preliminary'} for n in nets])
pinout=[(str(i),s,p) for i,(s,p) in enumerate([('GND','return'),('GND','return'),('GND','return'),('VDOCK','power'),('VDOCK','power'),('+3V3_FPC','power'),('DOCK_SDA','I2C SDA'),('DOCK_SCL','I2C SCL'),('DOCK_BCLK','I2S BCLK'),('DOCK_WS','I2S WS'),('DOCK_SD','I2S SD'),('DOCK_PRESENT_ID','presence/ID')],1)]
write('netlist/connector_pinout.csv',['pin','signal','purpose'],[{'pin':a,'signal':b,'purpose':c} for a,b,c in pinout])
gpio=[(0,'BOOT','strapping'),(1,'EXT_SENSOR_INT','GPIO/ADC'),(2,'VBAT_ADC','ADC'),(4,'I2C_SDA','I2C'),(5,'I2C_SCL','I2C'),(6,'SPI_SCLK','SPI'),(7,'SPI_MOSI','SPI'),(8,'SPI_MISO','SPI'),(9,'SD_CS','GPIO'),(11,'I2S_BCLK','I2S'),(12,'I2S_WS','I2S'),(13,'I2S_SD_EXT/FPC','I2S'),(17,'RF_UART_RX','UART1'),(18,'RF_UART_TX','UART1'),(19,'USB_D-','USB'),(20,'USB_D+','USB'),(21,'PWRMUX_ST','GPIO'),(38,'DOCK_PRESENT_ID','ADC/GPIO'),(40,'LED_G','GPIO'),(43,'DEBUG_TX','UART0'),(44,'DEBUG_RX','UART0'),(47,'LED_R','GPIO'),(48,'LED_B','GPIO')]
write('netlist/gpio_map.csv',['gpio','function','peripheral'],[{'gpio':a,'function':b,'peripheral':c} for a,b,c in gpio])
bom_fields=['ref','mpn','function','qty_pilot','qty_rfq_low','qty_rfq_high','board','population','status']
bom=[]
for r,m,mpn,f,b,p,src,pkg in components:
 qty=12 if r=='J3' else (2 if r in ('U7','MIC1') else 1)
 bom.append({'ref':r,'mpn':m+' '+mpn,'function':f,'qty_pilot':qty,'qty_rfq_low':qty*5,'qty_rfq_high':qty*10,'board':b,'population':p,'status':'baseline' if p=='Yes' else p})
write('bom/consolidated_bom.csv',bom_fields,bom)
write('bom/main_controller_bom.csv',bom_fields,[x for x in bom if x['board'] in ('main','dock')])
write('bom/universal_sensor_fpc_bom.csv',bom_fields,[x for x in bom if x['board']=='fpc'])
