# BeeBox schematic design decisions and release gates

**Build branch:** `feature/beebox-complete-schematic-rebuild`  
**Canonical-model status:** **BLOCKED — not manufacturing-ready**  
**Rule:** null library IDs, provisional nets, DNI parts and missing support-network values are deliberate fail-closed states, not permission to substitute or guess.

## Live environment gate (2026-10-15)

- Bridge `easyeda-bridge` is healthy on port `49620` with one active EasyEDA window.
- Active project is `BEEBOX`, UUID `d84c4be0ef2e467fa17955faa23c6314`.
- Active schematic/page is `Schematic1/P1`, UUID `d5e34c82cc3ba89c`.
- Live title metadata says `Drawing-Symbol_A0`, `Page Size=A0`, width `4681.102362204724`, height `3311.023622047244`; this supersedes stale A4 observations in older logs.
- A native source/components/wires backup was saved before any new mutation at `outputs/schematic/checkpoints/pre_master_rebuild_native_backup.json`.
- Current live readback contains no electrical circuit (one drawing object, zero wires). The old USB checkpoint PDFs/readbacks are evidence, not the current editable circuit.

## Reference PDF decision

The Cloud Code style reference is `C:/Users/HP/Downloads/SCH_Schematic1_2026-10-12 (1).pdf`, with the repository rendering at `projects/beebox/03_easyeda_init/reference_pdf_1.png`. It is used only for organization. `SCH_Schematic1_2026-10-12 (4).pdf` and the PDFs in `projects/beebox/05_schematic_audit/` are failed/intermediate generated results. No electrical decision is imported from the reference without datasheet and BeeBox baseline reconciliation.

## Known discrepancy reconciliation

| # | Previous state | Controlled state | Reason and evidence | Validation result |
|---:|---|---|---|---|
| 1 | D6 pin 5 recorded as GND in an observed source | D6.5 = `VBUS_USB`; D6.2 = `GND` | ST `USBLC6-2` datasheet Figure 1; `schematic/canonical_physical_pin_maps.json` | **VERIFIED PASS** in reviewed map and previous USB physical readback |
| 2 | D6 treated or described as a series device | D6 is a shunt/flow-through ESD array: physical pairs 1/6 and 3/4 are internally continuous; connector and MCU net names remain distinct for routing-side audit | ST datasheet; `datasheets/ST_USBLC6-2.txt` | **VERIFIED PASS** at pin-map level; final live design not present |
| 3 | USB-C contacts represented through ambiguous aliases | Exact selected `TYPE-C-31-M-12` combined contacts are recorded, including A6/B6 DP, A7/B7 DN, combined VBUS/GND and four shell anchors | HRO drawing, `J1_pin_drawing.png`, C165948 library record | **VERIFIED PASS** in reviewed map; library electrical pin types still produce ERC warnings |
| 4 | CC1/CC2 risked aliasing | `USB_CC1` and `USB_CC2` remain separate and each terminates through its own 5.1 kΩ resistor | USB-C sink requirement; R6/R7 records | **VERIFIED PASS** in canonical USB subset |
| 5 | SBU state implicit | J1 B8/A8 are explicit intentional NC | USB 2.0-only baseline | **VERIFIED PASS** in canonical map |
| 6 | R6/R7/C21/C22 had wrong hidden identities/values | R6/R7 = `0603WAF5101T5E`; C21 = `CL21B475KOFNNNE`, 4.7 µF/16 V/X7R/0805; C22 = `CL10B103KB8NNNC`, 10 nF/50 V/X7R/0603 | Reviewed EasyEDA records and Samsung evidence | **VERIFIED PASS** for identities; whole input capacitance remains dependent on complete power design |
| 7 | Multiple USB aliases mixed | Connector-side names are `USB_DP_CONN`/`USB_DN_CONN`; protected MCU-side names are `USB_D_P`/`USB_D_N` | Prevents ambiguous side-of-protector routing while preserving D6 pair semantics | **VERIFIED PASS** in canonical subset |
| 8 | TPS26600 suffix/package mismatch (`RGET` vs `RHFT`) | Candidate frozen to `TPS26600RHFT`, VQFN-24 plus exposed pad, EasyEDA candidate C181406 | TI family/orderable suffix and live library search | **PROVISIONAL**: support thresholds and exact external connector/TVS remain unresolved |
| 9 | Fixed TPS62162 had an adjustable divider | `TPS62162DSGR` fixed 3.3 V; FB goes to AGND; R14/R15 are retired, not DNI decoration | TI TPS62162 datasheet | **VERIFIED PASS** for topology; **VERIFIED FAIL** for full depleted-1S regulation because buck cannot boost |
| 10 | Regulator pins/support were not fully audited | Physical map records PGND/AGND/EP to GND, VIN+EN to VSYS, SW=`BUCK_SW`, VOS=`+3V3`, FB=GND; PG requires pull-up | TI datasheet; canonical map | **PROVISIONAL** until exact PG pull-up, CIN/COUT and system rail architecture are frozen |
| 11 | TCA9546A RESET# tied to GND | RESET# uses `I2C_MUX_RESET` and requires pull-up to +3V3; never permanently asserted | TI TCA9546A datasheet | **VERIFIED PASS** in reviewed map; pull-up identity not selected |
| 12 | BQ24074 support pins had placeholder nets | Every physical pin is inventoried, but TS/ITERM/EN policy and battery thermistor implementation are release gates | TI BQ24074 datasheet; two-contact J4 cannot carry NTC | **BLOCKED BY MISSING EVIDENCE**; no charger placement allowed |
| 13 | TPS2121 configuration pins were named but not dimensioned | CP2, OV1/OV2, PR1, ILM and SS remain explicit support nets with no guessed values | TI TPS2121 datasheet and readiness audit | **BLOCKED BY MISSING EVIDENCE** |
| 14 | `SW`, `EXT_ILIM`, direct LED nets and other aliases conflicted | `BUCK_SW`; `CHARGER_ILIM` is distinct from `EXT_ILIM`; LED resistor outputs are `LED_R_A/G_A/B_A` | Root-cause audit and updated canonical names | **VERIFIED PASS** in source model; live whole-sheet comparison not possible because circuit is absent |
| 15 | D4 silently substituted with `LTST-C193TBKT-5A` | Required MPN remains `LTST-C193KBKT-5A`; search returned no exact EasyEDA record | Lite-On evidence and live library search | **BLOCKED BY MISSING LIBRARY IDENTITY**; no substitute approved |
| 16 | J4 clone exposed four apparent pins | Exact JST `S2B-PH-SM4-TB(LF)(SN)` has two electrical contacts: 1=VBAT, 2=GND; solder tabs are mechanical | JST record C295747 and manufacturer record | **VERIFIED PASS** for connector pin map; charger TS remains blocked |
| 17 | One 14-pin header represented the Mill-Max interface | Canonical model has twelve records `J3-01`…`J3-12`, each one `0906-0-15-20-75-14-11-0` physical contact | Mill-Max is a single spring contact, not a 12-pin connector | **VERIFIED FAIL** for release: exact library/land pattern/drawing evidence missing |
| 18 | Hirose symbol exposed pins 13/14 without classification | J2 contacts 1–12 are electrical; 13/14 are metal fittings and must not be treated as signal contacts | Hirose FH34SRJ manufacturer catalog materials/dimensions | **DATASHEET-REVIEWED; LIBRARY IDENTITY PENDING** |
| 19 | Old logs called the active page A4 while A0 placement coordinates were assumed | Current native title block is A0 landscape, 4681.10 × 3311.02 schematic units; layout uses these observed dimensions | Current `getCurrentProjectInfo()` / `getCurrentSchematicPageInfo()` response | **VERIFIED PASS** for current metadata; final exported PDF still required |
| 20 | Missing pins were counted without separating NC from unresolved | `physical_pin_manifest.csv` classifies reviewed NC, reviewed connections and historical/provisional rows separately | Canonical model builder and datasheet maps | **PARTIAL**: 290 pins inventoried; many historical rows still require datasheet reconciliation |

## Frozen versus provisional component decisions

### Frozen identities with reviewed EasyEDA UUIDs

J1, D6, J4, R6, R7, C21 and C22. UUIDs, symbols, footprints and sourcing evidence are in `schematic/part_manifest.json` and the verified-library JSON files.

### Exact live-library candidates requiring physical-pin review

BQ24074RGTR, TPS26600RHFT, TPS2121RUXR, TPS62162DSGR, TCA9546APWR, TPS22919DCKR, ESP32-S3-WROOM-1-N16R8, SN74LVC1G3157DBVR, SHT45-AD1B-R2, ICM-42688-P, D2, D3, F1 and MAX17048G+T10. A matching search result is not by itself approval; symbol pins and manufacturer footprint must still be reconciled.

### Provisional / DNI

U5/MAX17048, U10/SGP40, J-SD, J-RF and U-IMU remain DNI or optional. SGP40's exact selected ordering suffix must be `SGP40-D-R4` if the option is later approved; a generic `SGP40` search returns unrelated power devices.

## Hard electrical gates preventing blind generation

1. Battery exact MPN, protection responsibility and NTC/TS topology are absent. J4 has only two electrical contacts.
2. The external 6 V connector, TVS and TPS26600 UVLO/OVP/ILIM/dVdT/MODE/SHDN values are not frozen.
3. TPS2121 CP2/OV1/OV2/PR1/ILM/SS values and selection policy are not frozen.
4. BQ24074 ITERM, TS, CE, EN1/EN2 policy, status pull-ups and thermal acceptance are not frozen.
5. TPS62162 fixed 3.3 V cannot maintain 3.3 V from the full depleted 1S battery range; a buck-boost or explicit brownout operating limit must be approved.
6. `+3V3_FPC` source/isolation and powered-off signal back-power prevention are unresolved.
7. D4, the 12 individual Mill-Max contacts, J2 and multiple required passives lack fully reviewed library identities.
8. The dedicated FPC schematic page/board assignment does not yet exist in the live project.

These gates make sections 01–08 **BLOCKED**. The master generator must return `BLOCKED_NO_MUTATION` until they are closed. The USB subset was previously validated, but the current live page does not contain that subset, so it is evidence rather than a completed phase.

## Release vocabulary

- **VERIFIED PASS:** supported by cited readback/datasheet evidence.
- **VERIFIED FAIL:** evidence demonstrates the requirement is not met.
- **NOT TESTED:** no reliable invocation/evidence exists.
- **PROVISIONAL / DNI:** intentionally not released/populated.
- **BLOCKED BY MISSING EVIDENCE:** no defensible component/value/topology can be selected from current records.
