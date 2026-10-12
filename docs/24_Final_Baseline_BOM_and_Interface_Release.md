# 24 — Final Baseline BOM and Interface Release

**Purpose:** schematic-level baseline for the one-bee-box pilot. This is not a manufacturing AVL. Prices and Indian stock are recorded only when supported by a dated quotation; no live price is claimed in this revision.

## Selected interconnect decisions

### Permanent FPC connection
**Hirose FH34SRJ-12S-0.5SH(50)**, 12 positions, 0.5 mm pitch, 0.3 mm FPC class, locking ZIF candidate. It is used once during FPC installation/service and is not the repeatedly detached interface. The exact Hirose drawing, recommended land pattern, mating direction, FPC thickness and mating-cycle rating must be archived with the schematic release. Manufacturer product search: [Hirose FH34 family](https://www.hirose.com/product/en/fh34).

### Repeated dock connection
**Mill-Max 0906-0-15-20-75-14-11-0** surface-mount spring-contact candidate. Contacts are placed on the removable controller docking face; the fixed hive carrier/FPC side uses gold-finished ENIG contact pads with a hard-gold/contact-finish review. Confirm the exact Mill-Max drawing for compressed height, travel, force, resistance, current rating and cycles before PCB footprint release. Manufacturer family reference: [Mill-Max spring-loaded contacts](https://www.mill-max.com/products/spring-loaded-contacts).

The 12-contact allocation is in [23](23_Baseline_Resolution_and_Schematic_Capture_Package.md). Two VDOCK contacts and three grounds are used so no single contact carries the complete sensor/FPC return current.

## Main controller PCB BOM — one board

| Ref | Manufacturer / MPN or specification | Qty | Package / value | Populated | Evidence / rationale | Alternative / status |
|---|---|---:|---|---|---|---|
| U1 | Espressif ESP32-S3-WROOM-1-N16R8 | 1 | module, PCB antenna | Yes | ESP32-S3 RFQ requirement; official datasheet | N16, N8R8 variants; exact AVL confirm |
| U2 | Texas Instruments BQ24074RGT | 1 | 16-pin RGT package | Yes | 1S charger/power path; 4.2 V regulation, 10.5 V OVP variant | BQ24075/modern equivalent; thermal review |
| U3 | Texas Instruments TPS62162DSG | 1 | 8-pin WSON | Yes | 3–17 V input, 1 A class 3.3 V buck | equivalent India-sourced buck after efficiency comparison |
| U4 | Texas Instruments TCA9546APWR | 1 | TSSOP-24 | Yes | four I²C branches; avoids equal-address collision | TCA9517/TCA4307 where topology requires |
| U5 | Analog Devices MAX17048G+T10 | 1 | TDFN | Yes/option | 1S fuel-gauge telemetry | omit for cost-down only with client approval |
| U6 | Texas Instruments TPS26600RGET | 1 | 24-pin VQFN | Yes | external ~6 V input eFuse, reverse polarity/OVP family | discrete fuse + reverse MOSFET, lower integration |
| U11 | Texas Instruments TPS2121RUXR | 1 | WQFN power mux | Yes | selects protected USB/external source and prevents source backfeed | discrete ideal-diode OR, higher part count |
| D6 | STMicroelectronics USBLC6-2SC6 | 1 | SOT-23-6 USB 2.0 ESD array | Yes | reference USB D+/D− protection baseline | alternate USB ESD only after line-capacitance review |
| D5 | Texas Instruments TPD4E05U06 | 1 | dock low-C ESD array | Yes | exposed pogo signal protection | Nexperia equivalent |
| J1 | TYPE-C-31-M-12 | 1 | USB-C SMT receptacle | Yes | reference 5 V USB-C sink baseline; mechanical anchors required | exact alternate only after drawing review |
| J2 | Hirose FH34SRJ-12S-0.5SH(50) | 1 | 12-position ZIF | Yes | permanent FPC connection | Molex 12-way 0.5 mm equivalent |
| J3 | Mill-Max 0906-0-15-20-75-14-11-0 | 12 contacts | SMT spring contact | Yes | repeated dock contact candidate | Harwin spring contact comparison |
| BT1 | Protected 1S LiPo, 3.7 V nominal, 2,000 mAh target, ≥1 A continuous/≥2 A transient | 1 | off-board cell | Yes | runtime/current baseline | exact Indian cell MPN required |
| J4 | JST S2B-PH-SM4-TB | 1 | 2-position PH SMT battery connector | Yes | replaceable cell connection | locking equivalent after mechanical review |
| L1 | Shielded 2.2 µH inductor, ≥1.5 A saturation, low DCR; exact AVL MPN after quote | 1 | power inductor | Yes | TPS62162 reference design 2.2 µH class | India AVL/saturation verification |
| F1 | Bourns MF-MSMF050-2 or rated equivalent | 1 | resettable fuse | Yes | source fault limitation | exact hold/trip review |
| Q1 | Texas Instruments TPS22919DCK | 1 | 1.5 A load switch | Yes | VDOCK hot-plug/current control | TPS22918/19 alternative |
| D2 | Lite-On LTST-C193KRKT-5A | 1 | 0603 red LED | Yes | fault/charge indication | equivalent 0603 red; Indian AVL verify |
| D3 | Lite-On LTST-C193KGKT-5A | 1 | 0603 green LED | Yes | ready/charge indication | equivalent 0603 green; Indian AVL verify |
| D4 | Lite-On LTST-C193KBKT-5A | 1 | 0603 blue LED | Yes | logging/connectivity indication | equivalent 0603 blue; Indian AVL verify |
| R1–R3 | 1.00 kΩ, 1%, 0603 | 1 each | LED current | Yes | 0.5–1.4 mA assumed per channel | 1% 0603 Indian commodity part |
| R4/R5 | 2.20 kΩ, 1%, 0603 | 1 each | I²C pull-ups | Yes | 373 ns at assumed 200 pF/100 kHz | 4.7 kΩ if measured C permits |
| R6/R7 | 5.1 kΩ, 1%, 0603 | 1 each | USB-C CC pull-downs | Yes | USB-C sink baseline | standard commodity |
| C21 | 10 µF X7R, 10 V minimum | 1 | USB VBUS bulk | Yes | reference USB VBUS baseline | voltage/bias verification |
| C22 | 10 nF X7R, 25 V minimum | 1 | USB VBUS high-frequency bypass | Yes | reference USB VBUS baseline | voltage/bias verification |
| R8/R9 | battery divider, 1%, 0603, values from ADC range | 1 each | battery monitor | Yes | ADC2.0/ADC1 conflict review required | MAX17048 only |
| R10 | dock ID resistor network, 1%, 0603 | 1 network | FPC identification | Yes | service/configuration detection | fixed ID resistor on FPC |
| R11 | 1.78 kΩ, 1%, 0603 | 1 | BQ24074 ISET | Yes | 0.5 A charge setting, `890 Ω A / 0.5 A` | verify final BQ revision |
| R12 | 1.54 kΩ, 1%, 0603 | 1 | BQ24074 ILIM | Yes | approximately 1.0 A input limit | verify source budget |
| R13 | 46.4 kΩ, 1%, 0603 | 1 | BQ24074 TMR | Yes | approximately 6.25 h safety timer | shorten if thermal/cell study requires |
| R14 | 316 kΩ, 1%, 0603 | 1 | TPS62162 feedback upper | Yes | 3.3 V setting with 100 kΩ lower, verify VREF | recalculate with exact VREF |
| R15 | 100 kΩ, 1%, 0603 | 1 | TPS62162 feedback lower | Yes | 3.3 V setting | standard |
| C1–C* | 100 nF X7R 0603, one per IC | 10–15 | local decoupling | Yes | datasheet placement rule | exact manufacturer AVL |
| C* | 1 µF X7R 0603 | 5–8 | local rail transient support | Yes | regulator/sensor support | voltage rating verified |
| C* | 10–22 µF X7R or polymer, 0805/1206 if required | 2–4 | rail bulk | Yes | ESP/RF/dock transients | larger package exception justified by capacitance/bias |
| C* | BQ24074 charge/input capacitors per datasheet | 2–4 | 1 µF input, 22 µF OUT, X7R | Yes | datasheet-required bypass and OUT stability | voltage/ripple review |
| R/C | BQ24074 ITERM/TS/CE/EN network | as datasheet | 0603 unless rating exception | Yes | termination, temperature and enable behavior | exact battery NTC/logic decision |
| TP1–TP12 | labelled test pads | ≥12 | rail/bus/debug access | Yes | bring-up and validation | bed-of-nails option |

## Universal sensor FPC BOM — one V1 populated FPC

| Ref | Manufacturer / MPN | Qty | Package / status | Evidence / rationale |
|---|---|---:|---|---|
| U-F1 | Sensirion SHT45 | 1 | DFN, populated | hive T/RH |
| MIC-F1 | TDK InvenSense ICS-43434 | 1 | digital MEMS, populated | internal acoustic waveform |
| U-F2 | TDK ICM-42688-P | 1 | LGA, populated if client approves IMU | vibration context |
| U-F3/U-F4 | Sensirion SHT45 | 0–2 | DNI footprints | second position options |
| MIC-F2 | ICS-43434 | 0–1 | DNI footprint | second microphone option |
| U-F5 | Sensirion SGP40 | 0/1 | DNI footprint | VOC option, not V1 baseline |
| J-F1 | Hirose FH34SRJ-12S-0.5SH(50) mating connector | 1 | ZIF | single compact output |
| C-F* | 100 nF X7R 0603 | 1 per populated IC | local bypass | required |
| C-F* | 1 µF X7R 0603 | 1 per local branch | rail support | required |
| R-F1/R-F2 | 2.2–4.7 kΩ 1% 0603 | one pull-up set | DNI/fit after bus ownership | prevent parallel over-pull |
| TP-F1–TP-F8 | test pads | ≥8 | copper pads | rails, I²C, I²S, ID |
| FPC-1 | two-layer polyimide/coverlay with connector stiffener | 1 | fab-specific | exact thickness/bend/vendor TBD |

## Dock and mechanical BOM

| Item | Pilot quantity | RFQ 5–10/10–20 batch basis | Status |
|---|---:|---:|---|
| Mill-Max pogo contacts | 12 per dock | 12 × number of main/FPC docks | exact drawing confirmation required |
| Gold/ENIG mating pads | 12 per fixed carrier | one set per FPC | fab finish and wear review |
| Hirose FPC connectors | 2 mating pieces per FPC/controller pair | 2 × FPC quantity | one installed in controller, one on FPC |
| Alignment magnets/keyed spacer | 1 set | one set per dock | mechanical design |
| Strain-relief/stiffener | 1 per FPC tail | one per FPC | fabrication drawing |
| Silicone/gasket/vent barrier | as required | quote separately | Kerala enclosure review |

## Optional expansion BOM

DNP for the pilot unless approved: nRF52/nRF53/nRF54 module, LoRa/Sub-GHz module, U.FL/I-PEX antenna chain, SGP40, second microphones, SD card socket/card and additional environmental sensors. Expansion connector still includes 3.3 V, GND, SPI/UART, reset, enable, IRQ and spare GPIO where the GPIO map permits.

## Quantity roll-up

| Build | Controller PCBs | FPCs | Pogo contacts | Permanent FPC connectors |
|---|---:|---:|---:|---:|
| One-hive engineering pilot | 1 + 1 recommended spare | 1 V1 + 1 recommended spare | 24 for two docks | 4 mating connector pieces |
| RFQ lower batch | 5 | 10 | 120 contacts for 10 docks | 20 connector pieces |
| RFQ upper batch | 10 | 20 | 240 contacts for 20 docks | 40 connector pieces |

Add 5–10% passive and connector spares, and one extra exact MPN reel/strip quantity where the assembler requires setup material. Preferred Indian sourcing route is to obtain dated quotes from Mouser India, Digi-Key India, element14 India, RS India and a qualified Indian PCB/FPC assembler; Robu.in may be considered for commodity/prototype parts only after exact manufacturer variant and authenticity are checked. No live stock, price or lead-time claim is made in this revision. Indian supplier price, stock and lead time remain **NOT VERIFIED** until dated quotations are obtained from authorized/traceable sources.

## 0603 policy
General resistors and capacitors use 0603/1608 metric by default. Exceptions are allowed for the 10–22 µF rail bulk parts if DC-bias, ripple, voltage rating or available capacitance requires 0805/1206; for the TPS62162 inductor, USB-C, connectors, FPC parts, eFuse, charger and thermal/power components, use the manufacturer package rather than forcing 0603.
