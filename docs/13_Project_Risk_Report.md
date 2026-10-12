# 13 — Project Risk Report

Scores are qualitative 1–5 likelihood × impact and must be revisited after answers.

| ID | Risk | L | I | Score | Mitigation / trigger | Owner/status |
|---|---|---:|---:|---:|---|---|
| R-01 | Mechanical envelope, magnetic dock and FPC routing unknown | 4 | 5 | 20 | obtain CAD; placement mockup before capture | Client/EE open |
| R-02 | I²C unreliable across pogo/FPC | 4 | 5 | 20 | capacitance/timing test; differential prototype if needed | EE open |
| R-03 | Heat biases external T/RH | 4 | 4 | 16 | thermal zoning, vented remote sensor, measure under charge/RF | EE open |
| R-04 | Sensor combinations conflict by address/power/I²S | 3 | 5 | 15 | population matrix, isolation, DNI rules, canonical pinout | EE/firmware open |
| R-05 | Battery/runtime/solar assumptions invalid | 4 | 5 | 20 | cell and input specification, measured power modes | Client/EE open |
| R-06 | Connector/pogo wear, misalignment or polarity error | 3 | 5 | 15 | keyed mechanics, cycle test, ID/presence, ESD | ME/EE open |
| R-07 | ESP32-S3 GPIO/peripheral allocation conflict | 3 | 4 | 12 | complete I/O map before schematic | EE open |
| R-08 | RF expansion noise/antenna detuning | 3 | 4 | 12 | module keepouts, RF ground, measured bring-up | RF open |
| R-09 | FPC fatigue/adhesive/bee-environment exposure | 3 | 5 | 15 | material and bend tests, protective installation method | ME open |
| R-10 | Long-lead or single-source parts | 3 | 4 | 12 | AVL alternatives and dated quotes | Supply open |
| R-11 | Public repository discloses client IP | 2 | 5 | 10 | do not publish PDF, review artifacts before push | PM active |

## Verification-phase additions
| ID | Risk | L | I | Score | Mitigation / trigger | Status |
|---|---|---:|---:|---:|---|---|
| R-12 | 6 V linear charging at 0.5 A may dissipate approximately 0.9–1.5 W | 3 | 4 | 12 | calculate exact package thermal path; reduce charge current or select switching/thermally suitable topology | Open |
| R-13 | 400 kHz direct dock I²C fails 200 pF/4.7 kΩ rise-time screen | 4 | 4 | 16 | constrain 100 kHz with measured Cb or specify complete differential link | Open |
| R-14 | Continuous raw I²S audio requires approximately 4.83 GiB/day in screening case | 3 | 4 | 12 | choose event/features mode or storage architecture | Open |
| R-15 | Generic connector family is not sufficient for footprint, mating, cycle or current approval | 4 | 5 | 20 | select exact parts from mechanical drawings and vendor data | Open |

Trade-offs and retirement evidence are recorded in [14](14_Design_Readiness_Review.md), [18](18_Mathematical_Engineering_Analysis.md), [19](19_Component_Compliance_and_Selection_Audit.md) and [12](12_Validation_Test_Plan.md). 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
