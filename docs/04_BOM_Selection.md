# 04 — Preliminary BOM and Selection

This is a design-study BOM, not a purchase list. MPNs marked TBD are deliberately unresolved; no supplier stock or price is invented. Main-board and FPC quantities remain separate.

## India-first, cost-conscious sourcing policy
The AVL shall prioritize legitimate Indian distributors and assemblers (for example Mouser India, Digi-Key India, element14 India, RS India, LCSC India service where acceptable, and qualified local PCB/FPC houses) with exact manufacturer variants, invoices and traceable authenticity. Local availability and landed cost (unit price, GST, freight, minimum order and import risk) shall be compared before selection. Do not optimize for the lowest sticker price at the expense of counterfeit risk, lifecycle, safety or yield; conversely, do not select premium parts without a measurable requirement. Prefer commodity passives, standard connectors and a common 3.3 V ecosystem, while preserving a second qualified source for critical parts. Record INR estimates only from dated Indian quotations and keep engineering/NRE, pilot and production costs separate.

| Ref | Subsystem | Manufacturer / MPN | Qty main | Qty/FPC | Package / footprint status | Source / status |
|---|---|---|---:|---:|---|---|
| U1 | MCU | Espressif ESP32-S3-WROOM-1, variant TBD | 1 | — | module; verify land pattern | [official](https://www.espressif.com/en/products/modules/esp32-s3-wroom-1) / candidate |
| U2 | external T/RH | Sensirion SHT45 | 1–2 | optional 0–2 | DFN; opening required | [official](https://sensirion.com/products/catalog/SHT45) / candidate |
| MIC1 | external audio | TDK ICS-43434 | 1 | — | digital MEMS; acoustic port | [official PDF](https://invensense.tdk.com/wp-content/uploads/2016/02/DS-000069-ICS-43434-v1.2.pdf) / candidate |
| U3 | optional IMU | TDK ICM-42688-P | 0/1 | 0/1 | LGA; verify assembly | [official PDF](https://invensense.tdk.com/wp-content/uploads/2020/04/DS-000347-ICM-42688-P-v1.3.pdf) / optional |
| U4 | optional VOC | Sensirion SGP40 | 0/1 | 0/1 | DFN; gas opening | [official](https://sensirion.com/products/catalog/SGP40) / optional |
| U5 | charger/path | TI BQ24074 | 1 | — | WQFN/QFN; thermal review | [datasheet](https://www.ti.com/lit/ds/symlink/bq24074.pdf) / topology candidate |
| U6 | regulator | TI TPS62162 | 1 | — | QFN; inductor required | [datasheet](https://www.ti.com/lit/ds/symlink/tps62162.pdf) / candidate |
| U7 | fuel gauge | ADI MAX17048 | 0/1 | — | TDFN; optional | [datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/max17048-max17049.pdf) / optional |
| D1.. | protection | TI TPD4E05U06 or equivalent | as exposed lines | as docked lines | low-C ESD | [datasheet](https://www.ti.com/lit/ds/symlink/tpd4e05u06.pdf) / select after pinout |
| J1 | USB-C | exact MPN TBD | 1 | — | anchored SMT/THT TBD | sourcing action |
| J2 | expansion | exact header/mezzanine TBD | 1+ | — | mechanical envelope TBD | client/mechanical blocker |
| J3 | FPC | I-PEX/Molex/ZIF exact MPN TBD | — | 1 | mating pair required | connector trade study |
| J4 | dock | pogo array + magnet/alignment hardware TBD | 1 | 1 mating | mechanical drawing required | blocker |
| BT1 | battery | protected 1S Li-ion/LiPo, capacity TBD | 1 | — | off-board | client safety/mechanical input |
| R/C/L | passives | values per final datasheets | lot | lot | use fab-approved footprints | not frozen |

## Engineering baseline BOM additions
The following baseline expands the earlier candidate list into schematic-level line items. Exact supplier AVL and prices remain subject to dated Indian quotation.

### Main controller PCB — one assembled board
| Ref | MPN/value | Qty | Function / evidence | Status |
|---|---|---:|---|---|
| U1 | Espressif ESP32-S3-WROOM-1-N16R8 | 1 | MCU/Wi-Fi/BLE; [baseline map](23_Baseline_Resolution_and_Schematic_Capture_Package.md) | provisional exact suffix |
| U2 | TI BQ24074 | 1 | 1S charger/power path | thermal/input review |
| U3 | TI TPS62162 | 1 | 3.3 V buck | provisional |
| U4 | TI TCA9546A | 1 | I²C branch/address isolation | recommended |
| U5 | ADI MAX17048 | 1 | battery gauge | optional pilot; investigate cost |
| U6 | TI TPS2660 | 1 | external-input eFuse/OVP candidate | verify 6 V/thermal configuration |
| U7 | USB-C PD controller | 0/1 | only if PD is approved | client decision |
| U8 | USB ESD array, exact MPN TBD | 1 | D+/D−/CC protection | exact part required |
| U9 | Dock ESD array, exact MPN TBD | 1 | exposed dock signal protection | exact part required |
| J1 | USB-C receptacle, exact MPN TBD | 1 | charging/data | mechanical selection |
| J2 | SWD/UART/USB test header or pads | 1 | programming/debug | required |
| J3 | Exact pogo docking receiver TBD | 1 | removable FPC dock | mechanical blocker |
| BT1 | Protected 1S 3.7 V 2,000 mAh LiPo TBD | 1 | backup energy | client/mechanical approval |
| D1–D3 | 0603 red/green/blue LED, exact MPN TBD | 1 each | low-power state indication | exact Vf/source required |
| R1–R3 | 1.0 kΩ 0603 | 1 each | LED current limiting | calculated screening |
| R4–R5 | 2.2 kΩ 0603 | 1 each | I²C pull-ups | 373 ns at assumed 200 pF |
| R6–R7 | USB-C 5.1 kΩ CC resistors | 1 each | USB-C sink advertisement | USB-C baseline |
| R8–R9 | battery divider, values TBD | 1 each | ADC battery monitor | leakage/ADC calculation |
| C* | 100 nF per IC; 1 µF local; 10–22 µF rail bulk | design qty | decoupling/transient support | exact datasheets/fab AVL |
| L1 | TPS62162 inductor per datasheet | 1 | buck energy storage | select exact saturation/current |
| F1 | input fuse/PTC TBD | 1 | source fault limitation | input study |
| Q/IC | VDOCK load switch/current limiter TBD | 1 | hot-plug/dock protection | select after load |
| TP* | labelled test pads | ≥10 | VBUS, VIN_EXT, VBAT, VSYS, 3V3, GND, buses | required |

### Universal sensor FPC — one populated V1 FPC
| Ref | MPN/value | Qty | Function | Status |
|---|---|---:|---|---|
| U-F1 | Sensirion SHT45 | 1 | hive T/RH | V1 populate |
| MIC-F1 | TDK ICS-43434 | 1 | hive digital microphone | V1 populate; I²S dock |
| U-F2 | TDK ICM-42688-P | 1 | vibration/IMU context | V1 populate if client approves |
| U-F3/U-F4 | SHT45 footprints | 0–2 | second T/RH options | DNI alternatives; address isolation needed |
| MIC-F2 | ICS-43434 footprint | 0–1 | second microphone option | DNI |
| U-F5 | Sensirion SGP40 | 0/1 | VOC option | DNI pilot baseline |
| C-F* | 100 nF + 1 µF per populated device | population-dependent | local decoupling | required |
| R-F1/R-F2 | 2.2–4.7 kΩ, only one bus pull-up set | 0–2 | I²C pull-up | avoid parallel over-pull |
| J-F1 | exact FPC connector TBD | 1 | single output connector | mechanical blocker |
| TP-F* | test pads | ≥6 | FPC rails/buses | required for bring-up |

### Dock/interface hardware
| Item | Quantity pilot | Requirement |
|---|---:|---|
| Pogo receiver/contact set | 1 pair per dock | exact current/contact/cycle data required |
| Alignment magnets/key | 1 set | asymmetric orientation protection |
| FPC stiffener | 1 per FPC | connector retention |
| ESD/protection parts | per exposed signal group | exact line ratings required |
| Dock fixture/spacer | 1 | mechanical alignment and force control |

### Optional RF/sensor expansion
Populate only after V1 validation: nRF52/53/54, LoRa/Sub-GHz module, external RF connector/antenna, SGP40, additional IMU or microphone. Each option requires a separate current, pin, antenna and firmware review.

## Quantity roll-up
- **Pilot:** one assembled controller, one dock and one or more V1 FPCs; procure at least one spare controller/FPC after client approval.

- **RFQ batch:** 5–10 main PCBs and 10–20 universal FPCs; this remains unchanged.
- **Production estimates:** request supplier quotations at 100/500/1,000. Engineering/NRE, tooling/setup, assembly, components, pogo/connectors and FPC stiffeners must be separate lines.

## Cost and sourcing policy
No price, availability, lifecycle or lead-time claim is complete until tied to a dated Indian supplier quote and exact variant. Request comparison quotes for prototype and 100/500/1,000-unit quantities, including GST, freight, import/customs exposure, assembly and NRE. Maintain an AVL with at least one qualified alternative for each single-source risk. A cost-down substitution requires an electrical, mechanical, firmware and validation impact review; it must not silently change the design. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
