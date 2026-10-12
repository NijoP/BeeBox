# 01 — Project Requirement Analysis

**Governing source:** confidential client file `Honeybee_Colony_Research_Sensor_Platform_RFQ(1).pdf`, four pages, inspected locally 2026-10-12. It is not copied into this public repository. RFQ page references below are source references, not claims of approval.

## Status and terminology
`REQ` is explicit RFQ language; `REC` is an engineering recommendation; `ASM` is an assumption; `Q` is a client question. No hardware, schematic, layout, or test result is claimed here.

## Traceable requirements
| ID | Requirement / acceptance intent | Source | Verification | Status |
|---|---|---|---|---|
| HB-EXT-01 | Modular, detachable displayless external unit for research/prototyping | RFQ p1 | inspection + pilot demo | Open |
| HB-EXT-02 | ESP32-S3 MCU; external temperature/RH and MEMS microphone; IMU if required | p1 | schematic/BOM + bench test | Open |
| HB-PWR-01 | 3.7 V rechargeable Li-ion/LiPo, charging and power-path management | p1–2 | electrical safety and transition test | Open |
| HB-PWR-02 | USB-C/USB-PD charging and approximately 6 V DC/potential solar input | p1–2 | interface and source tests | Open; PD scope TBD |
| HB-PWR-03 | Automatic external-power-to-battery backup; operate detached | p2 | controlled source-removal test | Open |
| HB-DOC-01 | Pogo-pin removable dock; minimum practical pins, alignment/orientation protection, repeated reliability and SI evaluation | p1 | cycle, contact, eye/BER or protocol test | Open |
| HB-DOC-02 | Decide whether I²C is suitable; otherwise define robust differential alternative | p1 | capacitance/timing and noise test | Open |
| HB-FPC-01 | Reusable ultra-thin two-layer polyimide universal FPC | p1 | fab stack and flex inspection | Open |
| HB-FPC-02 | Optional 2×T/RH, 2×MEMS mic, IMU, VOC/environmental and future footprints; normally populate 2–3 | p1 | population variants + DRC | Open |
| HB-FPC-03 | Common routing, single compact connector, I-PEX/Molex/ZIF trade study; decoupling, pull-ups, ESD and vents | p1–2 | schematic/layout review | Open |
| HB-SENS-01 | Isolate external T/RH from heat sources and place microphone for ambient measurement | p2 | thermal comparison + acoustic test | Open |
| HB-IO-01 | Accessible GPIO, I²C, SPI, UART, I²S, ADC, PWM, interrupts, USB, debug, power and SD where practical | p2 | canonical I/O map + continuity | Open |
| HB-RF-01 | Expansion provisions for nRF52/53/54, BLE, LoRa, Sub-GHz/future transceivers with control, power and antenna signals | p2 | connector pinout + module bring-up | Open |
| HB-DATA-01 | Timestamped external/internal/environmental/acoustic/motion data for correlation, anomaly and future ML | p2 | log schema and time-correlation test | Open |
| HB-DEL-01 | Deliver diagrams, main/FPC schematics and layouts, pinout, pogo design, power analysis, BOM, fabrication/assembly files, firmware, SI assessment, quotation and lead time | p3 | release checklist | Not started |
| HB-QTY-01 | RFQ prototype: main PCB 5–10; universal FPC 10–20; quote assembly, components, pogo/connectors, NRE/tooling and 100/500/1000 estimates | p3–4 | supplier quotations | Open |
| HB-PILOT-01 | First expected experiment may use one bee box; do not replace RFQ quantities | client context + RFQ | pilot plan and approval | Proposed |

## User workflow
Researcher defines a sensor population → installs FPC in hive → docks controller without disturbing hive → controller timestamps and buffers data → wireless/USB/SD export → correlate external, internal, acoustic and activity observations → inspect anomaly and iterate sensor population.

## Explicit vs recommendation vs assumption
- **Explicit:** listed in the matrix and source pages above.
- **Recommendation:** use a protected 3.3 V sensor domain, timestamped UTC plus monotonic sequence, and a serviceable magnetic dock.
- **Assumptions requiring confirmation:** battery capacity/current, enclosure dimensions/IP exposure, sensor exact MPNs, connector family, dock cable/FPC length, data rate, solar operating envelope, USB-PD need, and acceptance limits.

## Blocking questions
See [15 Client Clarification Register](15_Client_Clarification_Register.md). Capture must not freeze until power topology, mechanical envelope, connector/pinout, sensor variants and data-link decision are answered or formally accepted as assumptions. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
