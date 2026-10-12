# 17 — Requirements Traceability Matrix

| RFQ ID | Design location | Circuit/subsystem | Verification/evidence | Status |
|---|---|---|---|---|
| HB-EXT-01/02 | [01](01_Project_Requirement_Analysis.md), [02](02_System_Architecture.md) | ESP32-S3, local sensors, enclosure | inspection, schematic, pilot | Open |
| HB-PWR-01/02/03 | [05](05_Power_Architecture.md), [07](07_Schematic_Design_Plan.md) | charger, path, battery, inputs | PWR-02..04 | Open |
| HB-DOC-01/02 | [06](06_Interface_and_Sensor_FPC_Guide.md) | pogo, ESD, data transceiver | DOCK-01/02 | Open |
| HB-FPC-01/02/03 | [06](06_Interface_and_Sensor_FPC_Guide.md), [08](08_PCB_Design_Plan.md) | universal 2-layer FPC | fab drawing, variants, DRC | Open |
| HB-SENS-01 | [09](09_Component_Placement.md) | remote T/RH, acoustic port | SENS-01/02, thermal evidence | Open |
| HB-IO-01 | [02](02_System_Architecture.md), [07](07_Schematic_Design_Plan.md) | I/O map, headers, SD option | PRE-01, continuity and bring-up | Open |
| HB-RF-01 | [02](02_System_Architecture.md), [03](03_Component_Research.md) | RF expansion interface | RF-01 and module test | Open |
| HB-DATA-01 | [02](02_System_Architecture.md), [12](12_Validation_Test_Plan.md) | timestamp/logging/storage | DATA-01 with evidence file | Open |
| HB-DEL-01 | [11](11_Manufacturing_Guide.md), all design plans | release package | release checklist | Not started |
| HB-QTY-01 | [04](04_BOM_Selection.md), [16](16_Pilot_and_Delivery_Plan.md) | procurement/quote | dated supplier quotations | Open |
| HB-PILOT-01 | [16](16_Pilot_and_Delivery_Plan.md) | one-hive pilot | pilot report | Proposed |

## Verification links
| Requirement ID | Calculation/evidence | Current verification status |
|---|---|---|
| HB-PWR-01/02/03 | [18](18_Mathematical_Engineering_Analysis.md) CAL-PWR-01..04; [21](21_Calculation_Evidence_and_Reproduction.md) | PROVISIONAL; battery/input data and hardware transitions required |
| HB-DOC-01/02 | [18](18_Mathematical_Engineering_Analysis.md) I²C rise-time table; [20](20_Interface_and_Power_Budget_Matrices.md) dock trade study | PROVISIONAL; exact Cb, connector data and cycle/SI tests required |
| HB-IO-01 | [20](20_Interface_and_Power_Budget_Matrices.md) GPIO budget | BLOCKED — exact ESP32-S3 module and allocation required |
| HB-DATA-01 | [18](18_Mathematical_Engineering_Analysis.md) audio/storage calculation | PROVISIONAL; research audio mode and storage capacity required |
| HB-FPC-01/02/03 | [19](19_Component_Compliance_and_Selection_Audit.md), [22](22_Pre_Schematic_Correction_and_Readiness_Report.md) | BLOCKED — exact connector, geometry and fab data required |

This matrix is the canonical cross-reference to [01](01_Project_Requirement_Analysis.md); it intentionally does not create new requirements. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
