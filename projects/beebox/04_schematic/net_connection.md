# Net Connection — BeeBox Honeybee Research Platform

**Board:** external controller PCB + separate two-layer universal FPC · **Rev:** PRELIMINARY · **Updated:** 2026-10-12

This is the connectivity membership oracle. The machine-readable CSVs in `netlist/` are the synchronized export. Physical pin numbers must be read back from the exact EasyEDA library symbols; GPIO names are not package-pin substitutes.

## §0 Net dictionary

| Net | Meaning | Domain |
|---|---|---|
| `VBUS_USB` | USB-C 5V input; D6 uses this only as its ESD reference rail | Board A |
| `VIN_EXT_RAW` | approximately 6 V external/solar input before eFuse | Board A |
| `VIN_EXT_PROTECTED` | protected external input | Board A |
| `VIN_CHARGER` | selected source output from TPS2121 to charger | Board A |
| `VBAT` | protected 1S LiPo positive | Board A |
| `VSYS` | charger/power-path system rail | Board A |
| `+3V3` | TPS62162 regulated logic rail | Board A |
| `VDOCK` | Q1-switched VSYS dock rail (not regulated/current-programmed by Q1) | A↔B |
| `+3V3_FPC` | separately switched regulated sensor rail; implementation/isolation gate remains | A↔B |
| `GND` | common return | A↔B |
| `I2C_MAIN_SDA/SCL` | local controller I²C | Board A |
| `DOCK_SDA/SCL` | 100 kHz dock I²C | A↔B |
| `I2S_BCLK/WS/SD_EXT` | external microphone I²S | Board A |
| `DOCK_BCLK/WS/SD` | internal microphone I²S across dock | A↔B |
| `SPI_SCLK/MOSI/MISO` | shared storage/RF SPI | Board A |
| `UART1_TX/RX` | RF expansion UART | Board A |
| `USB_DP_CONN/USB_DN_CONN` | connector-side USB2.0 data before D6 | Board A |
| `USB_D_P/USB_D_N` | protected MCU-side USB2.0 data after D6 | Board A |
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
| 21 | `PWRMUX_ST` | digital status input |
| 38 | `DOCK_PRESENT_ID` | single-contact ADC/GPIO presence and resistor-ID input |
| 43/44 | debug UART0 | programming/debug |
| 47/48 | status controls | LED multiplexing |

## §membership oracle

| Net | Members |
|---|---|
| `VBUS_USB` | J1 VBUS contacts, D6.5 ESD reference, U11.IN1, C21.1, C22.1 |
| `USB_DP_CONN` | J1.A6/B6, D6.1 |
| `USB_DN_CONN` | J1.A7/B7, D6.3 |
| `USB_D_P` | D6.6, U1.GPIO20/USB_D+ |
| `USB_D_N` | D6.4, U1.GPIO19/USB_D− |
| `VIN_EXT_PROTECTED` | U6.OUT, U11.IN2 |
| `VIN_CHARGER` | U11.OUT, U2.IN |
| `VBAT` | J4.1, U2.BAT, U5.BAT sense |
| `VSYS` | U2.OUT, U3.VIN, Q1.VIN, bulk capacitors, TP |
| `+3V3` | U3.VOUT, U1.VDD33, U4.VCC, U7.VDD, MIC1.VDD, status/test |
| `VDOCK` | Q1.VOUT/QOD, J3.4/5, J2.4/5 |
| `+3V3_FPC` | dedicated switched-3V3 output, J3.6, J2.6, U8/U9/MIC2 supplies |
| `GND` | all IC grounds, J1 shield/ground, J3 pins 1/2/3, FPC ground, decouplers, test pads |
| `I2C_MAIN_SDA` | U1.GPIO4, U4.SDA, pull-up R4, TP |
| `I2C_MAIN_SCL` | U1.GPIO5, U4.SCL, pull-up R5, TP |
| `LOCAL_SDA` | U4 channel1 SD1, U7.SDA |
| `LOCAL_SCL` | U4 channel1 SC1, U7.SCL |
| `DOCK_SDA` | U4 channel0 SD0, J3.7, J2.7, U8.SDA, U9.SDA |
| `DOCK_SCL` | U4 channel0 SC0, J3.8, J2.8, U8.SCL, U9.SCL |
| `I2S_BCLK` | U1.GPIO11, MIC1.SCK, J3.9 source-select path |
| `I2S_WS` | U1.GPIO12, MIC1.WS, J3.10 source-select path |
| `I2S_SD_EXT` | MIC1.SD to U12 microphone-data switch input A |
| `DOCK_SD` | J3.11, MIC2.SD, U1.GPIO13 when FPC source selected |
| `DOCK_PRESENT_ID` | J3.12, J2.12, U1.GPIO38, FPC ID resistor R10 |
| `LED_R` | U1.GPIO47, R1.1 |
| `LED_R_A` | R1.2, D2.A; D2.K→GND |
| `LED_G` | U1.GPIO40, R2.1 |
| `LED_G_A` | R2.2, D3.A; D3.K→GND |
| `LED_B` | U1.GPIO48, R3.1 |
| `LED_B_A` | R3.2, D4.A; D4.K→GND |
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
