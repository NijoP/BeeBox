# Pbox — Honeybee Colony Research Sensor Platform

Pre-schematic engineering design package for a modular honeybee research platform: an ESP32-S3 external controller, detachable pogo-pin dock and reusable universal two-layer sensor FPC. The package is governed by the client RFQ and deliberately separates explicit requirements, recommendations, assumptions and open questions.

> **Status:** Conditional pre-schematic study. Documentation does not mean that hardware, schematic files, PCB/FPC layouts, firmware, fabrication, validation or field performance exist. The client RFQ PDF is confidential and is not included here.

## Architecture summary
The external unit provides ESP32-S3 compute, external environmental and acoustic sensing, optional motion sensing, battery/power-path management, USB-C and approximately 6 V external/solar input, logging, Wi-Fi/BLE, accessible prototyping I/O and RF expansion. A keyed magnetic/pogo dock connects to a reusable universal sensor FPC. Dock data remains an open I²C-versus-differential decision requiring a defined signal-integrity test.

## Requirements and scope
The source is `Honeybee_Colony_Research_Sensor_Platform_RFQ(1).pdf`, inspected locally on 2026-10-12 (four pages). RFQ prototype quantities remain **5–10 main PCBs** and **10–20 universal FPCs**, with separate quotation requests for components, assembly, pogo/connectors, engineering/NRE, tooling/setup and 100/500/1,000-unit estimates. A one-bee-box pilot is treated as an initial phase, not a replacement for those quantities.

## Documentation index
| # | Document |
|---|---|
| 01 | [Project Requirement Analysis](docs/01_Project_Requirement_Analysis.md) |
| 02 | [System Architecture](docs/02_System_Architecture.md) |
| 03 | [Component Research](docs/03_Component_Research.md) |
| 04 | [BOM Selection](docs/04_BOM_Selection.md) |
| 05 | [Power Architecture](docs/05_Power_Architecture.md) |
| 06 | [Interface and Sensor FPC Guide](docs/06_Interface_and_Sensor_FPC_Guide.md) |
| 07 | [Schematic Design Plan](docs/07_Schematic_Design_Plan.md) |
| 08 | [PCB Design Plan](docs/08_PCB_Design_Plan.md) |
| 09 | [Component Placement](docs/09_Component_Placement.md) |
| 10 | [Routing Guide](docs/10_Routing_Guide.md) |
| 11 | [Manufacturing Guide](docs/11_Manufacturing_Guide.md) |
| 12 | [Validation Test Plan](docs/12_Validation_Test_Plan.md) |
| 13 | [Project Risk Report](docs/13_Project_Risk_Report.md) |
| 14 | [Design Readiness Review](docs/14_Design_Readiness_Review.md) |
| 15 | [Client Clarification Register](docs/15_Client_Clarification_Register.md) |
| 16 | [Pilot and Delivery Plan](docs/16_Pilot_and_Delivery_Plan.md) |
| 17 | [Requirements Traceability Matrix](docs/17_Requirements_Traceability_Matrix.md) |

## Verification phase summary
An independent mathematical/component audit is now included. Screening calculations found the 100 kHz I²C dock case feasible under an assumed 200 pF/4.7 kΩ budget, but 400 kHz fails that same case; charger dissipation at 6 V/0.5 A is potentially material; continuous 16 kHz/24-bit mono audio would require approximately 4.83 GiB/day with framing overhead. These are assumption-bound calculations, not prototype results. A controlled preliminary schematic draft is now authorized using the documented V1 baseline, while final schematic/layout release remains gated. See [18](docs/18_Mathematical_Engineering_Analysis.md), [22](docs/22_Pre_Schematic_Correction_and_Readiness_Report.md) and [23](docs/23_Baseline_Resolution_and_Schematic_Capture_Package.md).

## Verification documents
| # | Document |
|---|---|
| 18 | [Mathematical Engineering Analysis](docs/18_Mathematical_Engineering_Analysis.md) |
| 19 | [Component Compliance and Selection Audit](docs/19_Component_Compliance_and_Selection_Audit.md) |
| 20 | [Interface and Power Budget Matrices](docs/20_Interface_and_Power_Budget_Matrices.md) |
| 21 | [Calculation Evidence and Reproduction](docs/21_Calculation_Evidence_and_Reproduction.md) |
| 22 | [Pre-Schematic Correction and Readiness Report](docs/22_Pre_Schematic_Correction_and_Readiness_Report.md) |
| 23 | [Baseline Resolution and Schematic-Capture Package](docs/23_Baseline_Resolution_and_Schematic_Capture_Package.md) |
| 24 | [Final Baseline BOM and Interface Release](docs/24_Final_Baseline_BOM_and_Interface_Release.md) |
| Capture | [Preliminary Schematic Capture Specification](schematic/Preliminary_Capture_Specification.md) and [netlist](schematic/netlist.csv) |

## Phase plan
1. Resolve client mechanical, power, sensor, dock, data and acceptance questions.
2. Freeze canonical I/O map, interface pinout and preliminary Indian-vendor AVL with cost-conscious alternatives.
3. Create schematic and placement-only mechanical feasibility study.
4. Capture, review, route and release main PCB/FPC fabrication packages.
5. Build the one-hive pilot, execute documented bring-up/validation, then quote the RFQ batch and follow-on volumes.

## Repository hygiene
Client source material is confidential by default. Prices, stock, test results, exact board geometry and final footprints are not claimed unless supported by dated evidence.
