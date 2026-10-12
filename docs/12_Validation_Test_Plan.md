# 12 — Validation Test Plan

Unexecuted tests are **Not Run**, never passed by default. Each record must capture test ID, revision, setup, method, acceptance criterion, observed result, operator/date and evidence path.

## Pre-fabrication
- `PRE-01` ERC/DRC, pin and footprint review — zero unexplained errors; report required.
- `PRE-02` power budget and thermal spreadsheet — margins against selected datasheets.
- `PRE-03` placement/connector/FPC bend mockup — mechanical approval.
- `PRE-04` dock SI simulation/calculation — capacitance, rise time, protocol margin.

## Post-fabrication hardware
- `PWR-01` resistance/visual inspection before power; no shorts.
- `PWR-02` USB-C, external ~6 V and battery source transitions; no reset/data corruption.
- `PWR-03` charge current, termination, protection and thermal rise within selected IC/cell limits.
- `PWR-04` detached battery operation and measured current in defined modes.
- `SENS-01` T/RH comparison in controlled environment; accuracy criterion client-approved.
- `SENS-02` microphone noise/frequency and external placement; criterion TBD.
- `DATA-01` timestamp, sequence, buffering, SD/flash and export integrity.
- `RF-01` Wi-Fi/BLE range/throughput and RF expansion bring-up; environment recorded.
- `DOCK-01` alignment, polarity, hot-plug, contact resistance and repeated docking cycle count; count TBD.
- `DOCK-02` I²C or differential-link packet error/rise-time test at worst FPC length and noise.
- `MECH-01` magnetic attachment/removal, hive installation, flex strain and sensor openings.
- `FIELD-01` single-hive pilot observation; no claims of colony or weather performance without evidence.

Test limits, cycle count, environmental range and acceptance thresholds require client approval. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
