# Net Connection — BeeBox Honeybee Research Platform

**Board:** external controller PCB + separate two-layer universal FPC · **Rev:** PRELIMINARY · **Updated:** 2026-10-12

This is the connectivity membership oracle. The machine-readable CSVs in `netlist/` are the synchronized export. Physical pin numbers must be read back from the exact EasyEDA library symbols; GPIO names are not package-pin substitutes.

## §0 Net dictionary

| Net | Meaning | Domain |
|---|---|---|
| `VBUS_USB` | USB-C 5 V input before USB ESD | Board A |
| `VIN_USB_PROTECTED` | USB input after ESD/current protection | Board A |
| `VIN_EXT_RAW` | approximately 6 V external/solar input before eFuse | Board A |
| `VIN_EXT_PROTECTED` | protected external input | Board A |
| `VIN_CHARGER` | selected source output from TPS2121 to charger | Board A |
| `VBAT` | protected 1S LiPo positive | Board A |
| `VSYS` | charger/power-path system rail | Board A |
| `+3V3` | TPS62162 regulated logic rail | Board A |
| `VDOCK` | switched/current-limited FPC rail | A↔B |
| `VFPC` | FPC sensor supply | A↔B |
| `GND` | common return | A↔B |
| `I2C_MAIN_SDA/SCL` | local controller I²C | Board A |
| `DOCK_SDA/SCL` | 100 kHz dock I²C | A↔B |
| `I2S_BCLK/WS/SD_EXT` | external microphone I²S | Board A |
| `DOCK_BCLK/WS/SD` | internal microphone I²S across dock | A↔B |
| `SPI_SCLK/MOSI/MISO` | shared storage/RF SPI | Board A |
| `UART1_TX/RX` | RF expansion UART | Board A |
| `USB_D_P/USB_D_N` | USB 2.0 data | Board A |
| `DOCK_PRESENT_ID` | dock presence and resistor-coded FPC ID | A↔B |
| `LED_R/LED_G/LED_B` | low-current status controls | Board A |

## §1 GPIO assignment

| GPIO | Net/function | Constraint |
|---:|---|---|
| 0 | `ESP_BOOT` | strapping; boot-safe |
| 1 | external sensor interrupt | optional |
| 2 | battery ADC | verify ADC attenuation and divider |
| 4/5 | `I2C_MAIN_SDA/SCL` | 2.2 kΩ pull-ups; 100 kHz dock baseline |
| 6/7/8 | SPI SCLK/MOSI/MISO | shared bus |
| 9 | SD_CS | DNP option |
| 11/12/13 | I²S BCLK/WS/SD | external/internal source selection required |
| 17/18 | UART1 RX/TX | RF expansion |
| 19/20 | USB D−/D+ | native USB |
| 21 | dock presence | interrupt-capable |
| 38 | dock ID | ADC/GPIO option |
| 43/44 | debug UART0 | programming/debug |
| 47/48 | status controls | LED multiplexing |

## §membership oracle

| Net | Members |
|---|---|
| `VBUS_USB` | J1.VBUS, D1.VBUS |
| `VIN_USB_PROTECTED` | D1.VBUS_OUT, U11.IN1 |
| `VIN_EXT_PROTECTED` | U6.OUT, U11.IN2 |
| `VIN_CHARGER` | U11.OUT, U2.IN |
| `VBAT` | J4.1, U2.BAT, U5.BAT sense |
| `VSYS` | U2.OUT, U3.VIN, Q1.VIN, bulk capacitors, TP |
| `+3V3` | U3.VOUT, U1.VDD33, U4.VCC, U7.VDD, MIC1.VDD, status/test |
| `VDOCK` | Q1.VOUT, J3 pins 4/5 |
| `VFPC` | J3/J2 power path, FPC sensor supply |
| `GND` | all IC grounds, J1 shield/ground, J3 pins 1/2/3, FPC ground, decouplers, test pads |
| `I2C_MAIN_SDA` | U1.GPIO4, U4.SDA, U7.SDA, pull-up R4, TP |
| `I2C_MAIN_SCL` | U1.GPIO5, U4.SCL, U7.SCL, pull-up R5, TP |
| `DOCK_SDA` | U4 selected branch, J3.7, J2.7, FPC I²C devices |
| `DOCK_SCL` | U4 selected branch, J3.8, J2.8, FPC I²C devices |
| `I2S_BCLK` | U1.GPIO11, MIC1.SCK, J3.9 source-select path |
| `I2S_WS` | U1.GPIO12, MIC1.WS, J3.10 source-select path |
| `I2S_SD_EXT` | MIC1.SD to U12 microphone-data switch input A |
| `DOCK_SD` | J3.11, MIC2.SD, U1.GPIO13 when FPC source selected |
| `USB_D_P` | U1.GPIO20/USB_D+, J1.D+ through D1 |
| `USB_D_N` | U1.GPIO19/USB_D−, J1.D− through D1 |
| `DOCK_PRESENT_ID` | J3.12, U1.GPIO21/GPIO38, FPC ID resistor R10 |
| `LED_R` | U1.GPIO47, R1, D2.A |
| `LED_G` | U1.GPIO40, R2, D3.A |
| `LED_B` | U1.GPIO48, R3, D4.A |
| `SPI_SCLK` | U1.GPIO6, storage SCLK, RF SCLK |
| `SPI_MOSI` | U1.GPIO7, storage MOSI, RF MOSI |
| `SPI_MISO` | U1.GPIO8, storage MISO, RF MISO |
| `UART1_TX` | U1.GPIO18, RF.RX |
| `UART1_RX` | U1.GPIO17, RF.TX |

## Hard invariants

- Every essential IC pin must be resolved from the exact EasyEDA symbol before the phase-4 exit gate.
- No single-pin named net.
- No merged I²S source drivers.
- Board A and Board B remain separate manufacturing assignments.
- Pogo contacts are not the permanent FPC ZIF connector.
- No native schematic or ERC PASS is claimed until EasyEDA is connected, generated, read back and audited.
