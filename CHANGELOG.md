# Changelog

## 2026-10-12 — Initial pre-schematic package
- Audited the four-page client Honeybee RFQ and the `pcb-techcrus` reference structure.
- Created requirements, architecture, component research, India-first cost-conscious BOM planning, power/interface studies, design plans, manufacturing/validation plans, risks, readiness review, clarification register, pilot plan and traceability matrix.
- Recorded unresolved decisions without claiming fabrication, validation, supplier stock, pricing or client approval.

## 2026-10-12 — Mathematical verification and component audit
- Added reproducible Python calculations for power scenarios, charger thermal screening, I²C rise time and audio storage.
- Added documents 18–22 covering mathematical analysis, component compliance, interface/power matrices, reproduction evidence and pre-schematic correction/readiness.
- Corrected the readiness assessment: 100 kHz I²C is only assumption-bound feasible; the 400 kHz worst-case screen fails; charger dissipation and continuous audio storage require further decisions.
- Retained the ESP32-S3 architecture provisionally while gating exact module, battery, dock, sensor population and power-topology decisions.

## 2026-10-12 — Blocker resolution baseline
- Defined a one-bee-box V1 baseline: ESP32-S3-WROOM-1-N16R8 candidate, SHT45 + ICS-43434 + ICM-42688-P FPC population, 1S 2,000 mAh protected LiPo target, BQ24074/TPS62162 power baseline, TCA9546A bus isolation and an 11-contact dock.
- Added a draft complete GPIO map, dock pinout, status LED design, expanded schematic-level BOM, preliminary mechanical envelopes and baseline calculations.
- Authorized controlled preliminary schematic drafting while retaining final-release gates for exact parts, mechanics, battery/input, USB-PD, dock validation and client acceptance criteria.

## 2026-10-12 — Preliminary schematic capture package
- Added the functional-sheet capture specification and machine-readable preliminary netlist under `schematic/`.
- Promoted the 12-contact dock, Hirose FH34SRJ-12S-0.5SH(50) FPC ZIF, Mill-Max spring-contact candidate, exact protection/load-switch candidates, BQ24074 programming values, and 0603 passive policy into the capture baseline.
- Added the ESP32-S3 official land-pattern verification record and retained footprint/CAD review as a layout-release gate.
