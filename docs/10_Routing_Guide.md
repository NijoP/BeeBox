# 10 — Routing Guide

| Class | Rule basis |
|---|---|
| Battery/VSYS | copper width/plane and vias calculated from peak current, copper weight, temperature rise and connector rating; no guessed width |
| 3.3 V | short regulator loop, bulk/ceramic decoupling at loads, isolate noisy expansion if needed |
| I²C | shared return, calculated pull-ups and capacitance; avoid hot-plug unless protected |
| SPI/USB | short, referenced, controlled by final stackup; avoid stubs and connector discontinuities |
| I²S/audio | clock/data adjacency and return continuity; keep away from switch nodes |
| RF | vendor-recommended 50-ohm geometry from fab calculator, shortest route, no unapproved vias/stubs |
| Dock | ESD at entry, defined return/guarding, optional series damping, differential pair only with full transceiver design |
| FPC | smooth corners, no neck-down at bend, copper balance, no vias/components in dynamic bend, fab minimums |

Use a continuous ground reference, stitching near connector shields and controlled return-current paths. Place decouplers at pins, ESD at the connector, and switching-node copper only where the regulator layout requires. Final trace rules are released only after fab capability, stackup, current, voltage and environmental assumptions are approved. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
