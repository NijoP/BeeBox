# 22 — Pre-Schematic Correction and Readiness Report

**Audit verdict:** **GO for a controlled preliminary schematic draft using the baseline in [23](23_Baseline_Resolution_and_Schematic_Capture_Package.md); NO-GO for final schematic release, PCB/FPC layout release or manufacturing.** The mathematical work establishes design direction and exposes margins; it does not establish measured runtime, dock reliability, thermal performance, field suitability or manufacturing yield.

## Retain / replace / investigate
| Decision | Item | Reason |
|---|---|---|
| RETAIN provisionally | ESP32-S3 architecture | directly required by RFQ; exact module suffix and GPIO map still required |
| RETAIN provisionally | ICS-43434-class digital microphone | compatible 3.3 V/I²S concept; audio storage mode must be defined |
| RETAIN provisionally | SHT45-class external T/RH | plausible electrical candidate; enclosure/self-heating evidence required |
| RETAIN provisionally | TPS62162-class buck | arithmetic current headroom exists under assumptions; exact transient/thermal check required |
| INVESTIGATE | BQ24074 charger/power path | plausible, but ~0.9–1.5 W screening heat at 6 V/0.5 A is material |
| INVESTIGATE | MAX17048 fuel gauge | useful but optional; compare Indian landed cost and pilot value |
| INVESTIGATE | ICM-42688-P | RFQ says IMU “if required”; client must define experiment |
| INVESTIGATE | SGP40 | heater/warm-up, airflow and hive contamination need explicit treatment |
| REPLACE/DEFINE | generic I-PEX/Molex/ZIF family | family name is not a footprint or purchasable mating pair |
| REPLACE/DEFINE | generic pogo array | exact contact, force, rating, cycle life and alignment geometry required |
| CLIENT DECISION REQUIRED | battery and protection | no runtime, peak-sag or safety conclusion is possible without cell data |
| CLIENT DECISION REQUIRED | USB-PD | determine whether negotiated PD is needed or 5 V sink is sufficient |

## Calculations that passed their stated criterion
- **CAL-I2C-01:** at assumed 100 pF and 4.7 kΩ, 398 ns is below a 1 µs 100 kHz rise-time criterion.
- **CAL-I2C-02:** at assumed 100 pF and 2.2 kΩ, 186 ns is below a 300 ns 400 kHz screening criterion.
- **CAL-REG-01:** 0.670 A assumed peak is below a nominal 1 A regulator class, leaving 0.330 A arithmetic margin.

These are assumption-bound calculations. They are not authorization to claim the physical dock or regulator has passed.

## Corrections required before capture
1. Choose exact ESP32-S3 module MPN and create a pin-by-pin GPIO/peripheral budget including boot, USB, flash/PSRAM, debug and expansion.
2. Define V1 sensor population(s), exact MPNs, I²C addresses, supply rails, sample rates and audio mode.
3. Select the power topology after receiving battery, external-input/solar, charge-current and USB-PD requirements.
4. Add input OVP/reverse protection, battery-protection responsibility, hot-plug/load-switch control, connector ESD and current/voltage test points.
5. Fix an exact FPC connector and pogo/mechanical interface from drawings, not product-family names.
6. Define dock pinout and initially constrain I²C to the calculated low-speed regime, or approve a complete differential architecture.
7. Decide whether continuous raw audio is required; otherwise specify event capture/features to avoid approximately 4.83 GiB/day in the screening scenario.
8. Produce a 1:1 placement study using client enclosure, battery, dock and FPC geometry.
9. Replace all assumed cost/stock claims with dated Indian supplier quotations and qualified alternatives.

## Schematic authorization conditions
The baseline now provides enough information for a **controlled preliminary schematic draft**: a proposed MCU variant, V1 sensor population, draft GPIO map, dimensioned power topology, 11-contact dock pinout, protection line items and explicit DNI options are recorded in [23](23_Baseline_Resolution_and_Schematic_Capture_Package.md). Every provisional item must be marked in the schematic and reviewed.

It may not be released for layout/fabrication until the exact ESP32-S3 suffix/footprint, battery/input, connector/mechanical envelope, USB-PD decision, final dock protocol and client sensor acceptance criteria are closed or explicitly accepted.

## Open issues and corrections (Table E)
| Issue ID | Existing decision | Evidence | Root cause | Proposed correction | Calculation/BOM impact | Client approval | Blocks schematic? | Owner/status |
|---|---|---|---|---|---|---|---|---|
| COR-01 | Generic ESP32-S3 module | no suffix/map | module variant not frozen | select exact WROOM/MINI variant and map every pin | GPIO/antenna/BOM | Yes | Yes | EE/client open |
| COR-02 | BQ24074 topology candidate | 0.90–1.50 W screening heat | input/charge/cell unknown | confirm charge current, thermal copper and alternate | charger/layout/BOM | Yes | Yes | Power open |
| COR-03 | Direct dock I²C | 797 ns at 200 pF/4.7 kΩ | actual Cb/contact behavior unknown | constrain to 100 kHz and measure, or specify differential endpoints | pins/BOM/firmware | Yes | Yes | EE open |
| COR-04 | Continuous microphone possibility | ~4.83 GiB/day | research mode unspecified | choose event/features or storage capacity | storage/firmware | Yes | Yes for storage | Research open |
| COR-05 | Generic FPC/pogo families | no exact mechanical evidence | geometry and cycle rating missing | choose exact mating parts and fab stack | footprint/BOM | Yes | Yes | ME/EE open |

## Post-fabrication-only matters
Battery runtime, source-transition reset immunity, charger/regulator temperature, pogo cycle reliability, contact bounce, physical SI/packet error rate, sensor self-heating in the enclosure, FPC fatigue, acoustic response and hive environmental robustness require hardware or field evidence. They remain **HARDWARE VALIDATION REQUIRED**, not PASS.

See [18](18_Mathematical_Engineering_Analysis.md), [19](19_Component_Compliance_and_Selection_Audit.md), [20](20_Interface_and_Power_Budget_Matrices.md), and [21](21_Calculation_Evidence_and_Reproduction.md).