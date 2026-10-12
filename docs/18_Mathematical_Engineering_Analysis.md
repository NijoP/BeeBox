# 18 — Mathematical Engineering Analysis

**Revision:** 2026-10-12, independent pre-schematic audit. **Status:** calculated results are PASS only against the stated calculation criterion; unconfirmed inputs remain PROVISIONAL. No hardware measurement or field qualification is claimed.

## 1. Evidence and assumptions
The governing requirement source is the four-page client RFQ (local file inspected 2026-10-12), with requirements [01](01_Project_Requirement_Analysis.md). Candidate component evidence is linked in [03](03_Component_Research.md). Reproducible calculations are in [`tools/verify_engineering.py`](../tools/verify_engineering.py); generated outputs are in [`analysis_outputs/`](../analysis_outputs/).

The script uses an explicit screening assumption set: 3.7 V, 2.0 Ah cell; 80% usable fraction; 88% conversion efficiency; 0.24 A active ESP32-S3 estimate; 0.43 A RF-peak estimate; 0.5 A charge current; 6 V input; 100/200 pF I²C capacitance; 16 kHz, 24-bit mono audio. These are **not datasheet substitutions** and must be replaced with exact selected-device and client inputs.

## 2. Power results
| Calculation ID | Result | Status |
|---|---|---|
| CAL-PWR-01 | Assumed normal logging: 0.362 A at 3.7 V, 1.339 W; screening runtime 3.89 h | PROVISIONAL |
| CAL-PWR-02 | Assumed Wi-Fi/logging + RF expansion: 0.462 A, 1.709 W; screening runtime 3.05 h | PROVISIONAL |
| CAL-PWR-03 | Assumed peak: 0.670 A, 2.479 W; TPS62162 1 A class output would have 0.33 A arithmetic headroom, but transient stability and exact module peak are unverified | PROVISIONAL |
| CAL-PWR-04 | Linear charger screening dissipation at 6 V/0.5 A is 0.90–1.50 W over 4.2–3.0 V battery | HARDWARE VALIDATION REQUIRED |

Runtime uses `t = C_Ah × usable_fraction × efficiency / I_A`; it is not a battery discharge or thermal model. Battery internal resistance, cutoff, temperature, cell capacity at load and charge-load sharing are missing.

## 3. I²C docking calculation
Using `tr = 0.8473 × Rp × Cb`:

| Cb | Rp | Rise time | 100 kHz criterion 1 µs | 400 kHz criterion 300 ns |
|---:|---:|---:|---|---|
| 100 pF | 4.7 kΩ | 398 ns | PASS | FAIL |
| 100 pF | 2.2 kΩ | 186 ns | PASS | PASS |
| 200 pF | 4.7 kΩ | 797 ns | PASS | FAIL |
| 200 pF | 2.2 kΩ | 373 ns | PASS | FAIL |
| 200 pF | 1.0 kΩ | 169 ns | PASS | PASS |

These are first-order calculations, not proof of pogo reliability. The recommended initial dock mode is **100 kHz I²C only**, with a defined capacitance budget, hot-plug isolation/presence handling, ESD and measured packet-error test. Do not claim 400 kHz until the actual bus and sink-current limits pass. If distance/noise exceeds the budget, use a complete differential transceiver architecture rather than an undefined “differential bus.”

## 4. Audio and storage
For continuous mono 16 kHz, 24-bit audio: `16,000 × 24 = 384 kb/s` raw; with the script's 1.25 framing allowance, approximately 480 kb/s and 4.83 GB/day (binary GiB basis). Continuous raw audio therefore conflicts with a small inexpensive storage strategy unless event recording, feature extraction, compression, or larger storage is approved. The microphone should be digitized locally; raw microphone clocks should not traverse a slow dock I²C link.

## 5. Rail compatibility findings
- ESP32-S3, SHT45, ICS-43434, SGP40, MAX17048 and ICM-42688-P candidates are intended for a 3.3 V logic domain, but exact module/device variants and tolerances must be checked before release.
- BQ24074 is a plausible 1-cell charger/power-path candidate; input range, charge programming, thermal limits and battery protection must be checked against the exact package/datasheet revision.
- TPS62162 is a plausible buck candidate for a 3.3 V rail from a 1-cell power-path rail; inductor, compensation/layout, minimum input and transient response must be verified. A nominal “1 A” label is not a complete thermal or transient proof.
- TPD4E05U06 is a low-capacitance exposed-line protection candidate, not a substitute for an input OVP/reverse-polarity circuit. Do not connect an unprotected ~6 V source to a protection device whose line rating is lower than that source.

## 6. Physical feasibility
No definitive fit calculation is possible because the RFQ does not provide board outline, enclosure, mounting, battery envelope, dock geometry, FPC length or bend profile. The correct pre-capture evidence is a 1:1 placement mockup with the ESP32 module keepout, USB-C, battery connector, dock, sensor apertures, FPC connector, test points and expansion headers. Status: **BLOCKED — CLIENT INPUT** for final fit, **READY** to perform a placement study using explicit provisional envelopes.

## 7. Engineering margins
| Limit | Predicted point | Margin equation/result | Status |
|---|---:|---|---|
| I²C 100 kHz rise time, 200 pF/4.7 kΩ | 797 ns | 1000−797 = 203 ns | PASS calculated, assumptions only |
| I²C 400 kHz rise time, 200 pF/4.7 kΩ | 797 ns | 300−797 = −497 ns | FAIL calculated |
| 1 A regulator arithmetic current | 0.670 A assumed peak | 1.000−0.670 = 0.330 A | PROVISIONAL |
| Continuous charger thermal | 0.90–1.50 W screening | requires θJA and board thermal limit | HARDWARE VALIDATION REQUIRED |
| Audio storage | 4.83 GiB/day estimated | capacity not specified | BLOCKED — CLIENT INPUT |

## 8. Requirement-to-calculation traceability (Table A)
| Requirement ID | Exact requirement | Source page | Parameter | Calculation ID | Subsystem | Criterion | Result | Evidence | Status |
|---|---|---:|---|---|---|---|---|---|---|
| HB-PWR-01 | 3.7 V rechargeable battery, charge and power path | 1–2 | runtime/current | CAL-PWR-01..04 | battery/rails | source/load operation | assumption-bound | script outputs | PROVISIONAL |
| HB-PWR-02 | USB-C/USB-PD and ~6 V input | 1–2 | input/thermal | CAL-CHG-01 | charger | input and heat within selected limits | heat requires exact IC/board | charger CSV | INVESTIGATE |
| HB-DOC-02 | evaluate I²C versus robust alternative | 1 | Cb/Rp/tr | CAL-I2C-01..02 | dock | rise-time limit | 100 kHz passes assumed case; 400 kHz fails worst case | I²C CSV | PROVISIONAL |
| HB-IO-01 | extensive accessible I/O | 2 | GPIO/peripherals | CAL-IO-01 | ESP32-S3 | no conflicts | exact module/map missing | [20](20_Interface_and_Power_Budget_Matrices.md) | BLOCKED — CLIENT INPUT |
| HB-DATA-01 | timestamped research data | 2 | audio/storage rate | CAL-DATA-01 | I²S/storage | capacity matches mode | continuous raw audio needs ~4.83 GiB/day | script JSON | PROVISIONAL |
| HB-FPC-01 | two-layer polyimide FPC | 1 | stack/bend/outline | CAL-MECH-01 | FPC | fab capability and geometry | inputs missing | [08](08_PCB_Design_Plan.md) | BLOCKED — CLIENT INPUT |

## 9. Sensitivity and worst-case bounds
With the stated model, runtime is inversely proportional to current: reducing usable capacity from 80% to 60% reduces each runtime by 25%; reducing converter efficiency from 88% to 75% reduces the result by 14.8%; increasing the assumed normal current from 0.362 A to 0.500 A reduces 3.89 h to approximately 2.82 h. These are algebraic sensitivities, not cell-discharge predictions. The 200 pF/4.7 kΩ dock case is the relevant timing sensitivity: doubling capacitance from 100 pF to 200 pF doubles rise time from 398 ns to 797 ns.

## 10. Findings
The architecture is electrically plausible but not capture-ready. The highest-impact corrections are: freeze the exact ESP32-S3 module and GPIO map; select and verify the power-path/protection topology; define battery/input requirements; limit initial dock I²C to a calculated operating mode or adopt a complete differential link; and decide whether audio is continuous or event/features based. See [22](22_Pre_Schematic_Correction_and_Readiness_Report.md).