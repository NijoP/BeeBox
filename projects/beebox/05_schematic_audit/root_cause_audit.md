# Controlled rebuild root-cause audit

**Date:** 2026-10-12  
**Project/page:** `BEEBOX / Schematic1 / P1`  
**Bridge:** connected; two EasyEDA windows reported, active window `faa71123-574f-4149-ab29-48dc6128aebe`  
**PDF:** `C:\Users\HP\Downloads\SCH_Schematic1_2026-10-12 (2).pdf`

## Evidence collected

- Current PDF exists and was extracted with `pdftotext -layout`. Its title block reports `A4`, page `P1`, `BEEBOX`, one page.
- Live EasyEDA readback: 12 component objects, 90 wire objects.
- Two pre-existing non-BeeBox artifacts remain: blank/title artifact and `U?` NE555 placeholder.
- Current backup before the reference-style rebuild: `projects/beebox/03_easyeda_init/live_schematic_backup_before_reference_rebuild.json`.
- Source files were preserved. No PCB layout or fabrication files were changed.

## Mismatch matrix

| Reference | Expected according to approved BOM/source | Observed in PDF | Observed live EasyEDA | Expected connections | Discrepancy | Evidence | Required correction |
|---|---|---|---|---|---|---|---|
| MCU U1 | ESP32-S3-WROOM-1 family plus support circuitry | Absent | Absent | `+3V3`, USB, boot/reset, debug, sensors, storage | Missing required MCU | PDF extraction; live readback | Freeze exact orderable variant and generate U1 plus complete support block |
| U2 | BQ24074 charger | `BQ24074RGTR` | U2 present | `VIN_CHARGER`, `VBAT`, `VSYS`, ISET/ILIM/TMR/TS/enable/status | Present but not fully supported | PDF/readback | Add/verify every datasheet-required support network |
| U6 | TPS26600 input protection | `TPS26600RHFT` | U6 present | raw external input to protected input, thresholds, current limit, fault | Present; support network incomplete | PDF/readback | Add configured UVLO/OVP/ILIM/dVdT/FLT components |
| U11 | TPS2121 source mux | `TPS2121RUXR` | U11 present | USB and protected external input to `VIN_CHARGER` | Present; support network incomplete | PDF/readback | Add CP/OV/priority/ILM/SS configuration components |
| J1 | Reference USB-C `TYPE-C-31-M-12` | `TYPE-C-31-M-12` | J1 present | duplicated VBUS/GND/DP/DN, CC1/CC2, shield | Present; label extraction shows malformed text joins | PDF/readback | Rebuild with explicit pin mapping and readable labels |
| D6 | `USBLC6-2SC6` | `USBLC6-2SC6` | D6 present | USB D+/D− and GND protection | Present | PDF/readback | Verify exact pin-number mapping and short local stubs |
| R6/R7 | 5.1 kΩ USB-C sink pull-downs | 2.2 kΩ each | R6/R7 present; value property requires readback correction | CC1/CC2 to GND | Value mismatch | PDF text vs BOM | Use 5.1 kΩ and update displayed values |
| C21/C22 | 10 µF and 10 nF VBUS capacitors | 100 nF and 100 nF | C21/C22 present; value property requires readback correction | VBUS_USB to GND | Value mismatch | PDF text vs BOM | Use 10 µF and 10 nF; verify voltage ratings |
| J4 | battery connector | `XY-S2B-PH-SM4-TB` | J4 present | VBAT and GND | Present | PDF/readback | Confirm connector pin mapping and battery protection boundary |
| U? | No unapproved placeholder | NE555 | U? present | none | Unapproved placeholder | PDF/readback | Delete after preserving backup |
| Sensors/audio | U7, MIC1, U8, MIC2, U9, U4, U12 | Absent | Absent | I²C/audio/FPC nets | Major missing subsystem | Source-vs-live inventory | Generate only after power block passes |
| Dock/FPC | J2/J3 and complete interface | Absent | Absent | all 12 connector signals | Major missing subsystem | source-vs-live inventory | Generate controller/FPC interface sections |
| Status/debug | D2-D4, R1-R3, TP1-TP12, debug | Absent | Absent | GPIO/status/test nets | Major missing subsystem | source-vs-live inventory | Generate status/debug section |

## Root causes

1. The original section driver was asynchronous and the bridge returned before completion; failures were hidden because the IIFE was not awaited or returned.
2. Library searches were broad substring searches, allowing suffix substitutions such as USB ESD variants.
3. The passive path was not deterministic; it could create a generic symbol, lose the designator during a second property modification, or stop before all passives were placed.
4. Fixed 1700-unit horizontal spacing placed components outside the actual page width. The active page metadata reports A4, not A0.
5. The generated source package and live drawing diverged: source contains U1/sensors/dock/FPC, while the PDF/live drawing contains only the power/USB subset and a stale NE555.
6. The project contains unresolved source inconsistency: current canonical USB values are 5.1 kΩ, 10 µF and 10 nF, while the PDF shows 2.2 kΩ and 100 nF values.

## Current verdict

**FAIL — controlled rebuild required.** The power/USB subset is not complete enough for MCU or later-section sign-off. Native ERC has not been run. The source package and backup are preserved; the generator and active page must be corrected before advancing.
