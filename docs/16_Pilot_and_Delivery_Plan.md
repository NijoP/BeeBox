# 16 — Pilot and Delivery Plan

## Phase 0 — clarification and feasibility
Deliver requirements matrix, I/O map, mechanical interface questionnaire, component/AVL study and dock/power trade study. Gate: client approves assumptions and blockers.

## Phase 1 — single-hive pilot
Scope: one external controller, one dock and agreed FPC population(s), initial bring-up firmware, logging and safe removable installation. Deliver a pilot assembly, wiring/pinout, test report with actual evidence, installation instructions and open-risk log. This does **not** replace the RFQ batch quantities.

## Phase 2 — RFQ prototype batch
Quote and, after approval, build **5–10 ESP32-S3 main PCBs** and **10–20 universal sensor FPCs**, with separate component, assembly, pogo, connector, NRE and tooling/setup lines. Deliver fabrication/assembly files, BOM alternatives, firmware package, bring-up report and quotation assumptions.

## Phase 3 — design verification and scale quote
Execute power, dock, sensor, logging, wireless, mechanical and environmental tests. Request 100/500/1,000 unit estimates only after design and AVL are stable. Separate engineering/NRE, pilot manufacturing and follow-on batch costs.

## Dependencies and approvals
Mechanical CAD → interface/pinout → component freeze → schematic/ERC → placement/DFM → layout → fab quote → first article → bring-up → validation → pilot approval. Client approvals are required at requirements, mechanical/power, schematic, fabrication release and pilot acceptance gates. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
