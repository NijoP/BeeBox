# USB/A0 continuation checkpoint — INCOMPLETE, NOT FOR FABRICATION

## Current live state and scope

BEEBOX project `d84c4be0ef2e467fa17955faa23c6314`, schematic `449f9b2562dabacc`, P1 `d5e34c82cc3ba89c`. Six electrical components (J1, D6, R6, R7, C21, C22), one native A0 drawing and an explicit incomplete-sheet notice. Historical 55-component exports are not the current inventory. No sheet reset, new project, PCB layout, browser automation or additional agent was used in this continuation.

This is **01A USB input/CC/ESD only**, not the complete power section or platform. USB-PD negotiation, full source-current/inrush policy, protected input, charger, power mux and downstream support remain incomplete.

## Actual electrical findings and repair

A fresh native netlist exposed a real VBUS-to-GND short introduced during the earlier C21 replacement/readability operation. Both capacitor terminals, D6 pin5 and J1 VBUS contacts had resolved to GND. This invalidated the earlier USB revision. Native/visual evidence of that bad revision is preserved as `usb_before_capacitor_short_repair.*`.

Measured C21 pin1 was below pin2. The bypass routing ran vertically through both terminals, and EasyEDA merged the VBUS/GND wire primitives. `01a_repair_capacitor_short.js` corrected only C21 orientation and the owned bypass wire: rotation270 was independently measured, the direct short segment was removed, and two separate three-segment GND/VBUS networks were reconstructed. No other component or sheet region was deleted. The readability helper now rejects this inverted terminal geometry **before** modifying wires.

After reconstruction and label styling, fresh native export and physical contact readback agree with the independently specified USB canonical maps: **30 pins, 28 electrical contacts and two explicit SBU no-connects**. `usb_checkpoint_verification.json` records topology/contact parity PASS with zero mismatches. This is not ERC approval.

C21 is Samsung CL21B475KOFNNNE,4.7uF,±10%,16V,X7R,0805,C107365. C22 is10nF. The former10uF bulk capacitor exceeded the discussed10uF USB input-capacitance budget by tolerance alone. Current nominal USB bypass is4.71uF; tolerance-only upper bound5.181uF, or5.95815uF including the X7R±15% temperature envelope. Other directly presented system capacitance, soft-start and inrush still require complete-system review. No USB compliance PASS is claimed.

## Native ERC — available, still NOT PASS

Installed editor version:3.2.206. The old combined ERC collector also awaited obsolete `sch_Netlist.getNetlist()`; its timeout did not establish that ERC itself timed out. ERC and supported netlist file export are now collected independently.

The isolated strict native check completes. Before short repair it returned six warnings; after repair it returned **five warnings**. Basic strict check also returned false. The current API response supplies severity/count, not rule/pin details; none are invented.

Native `.epro` symbol inspection found J1 terminals labelled `Undefined`, while D6/resistor/capacitor terminals are labelled `IN`. Passive component semantics require review/correction through an owned-library route, not relaxed strict mode, arbitrary active-pin retyping or unsupported component-pin writes. Project library UUID is `project`; direct private-symbol source retrieval timed out and the project-symbol editor attempt failed. No shared/public library symbol was modified. Warning causes beyond the experimentally removed short are not asserted from count alone.

**USB electrical acceptance remains BLOCKED** by unresolved strict warnings/library pin-type metadata. No section01 completion or whole-schematic release is approved.

## Genuine A0 geometry and actual visual review

The native Drawing-Symbol_A0 creation call timed out **after creating the drawing**. Independent readback confirmed exactly one drawing; it was not blindly recreated. Sheet primitives reject generic component modification, and the title-block manager probe failed. Existing drawing attributes were therefore updated through supported attribute value writes.

Native drawing Width=1189/0.254 and Height=841/0.254, with Page Size=A0. This uses schematic10mil units, not PDF points. The exported PDF's actual outer stroked drawing frame independently measures1189×841mm within0.002mm rounding. The exporter adds external padding; `normalize_a0_export.py` preserves the raw PDF and removes **only that measured outside-paper padding**, without scaling/redrawing. Final MediaBox is1188.998657×841.001035mm, landscape. `A0_geometry_verification.json` preserves measurements and hashes.

Locally reviewed `A0_usb_checkpoint.png`, `usb_checkpoint_A0_detail.png` and `A0_title_block_detail.png`: USB block frame/heading, values, SBU crosses, local CC/data paths, separate capacitor rails and DRAFT/A0/BeeBox title block are readable. The sheet is largely blank because other functional sections are not built. Visual organization is acceptable for this USB draft only; electrical approval remains blocked.

## Matching saved artifacts

- `A0_usb_checkpoint.epro`: native schematic export, including symbol/footprint definitions; ZIP contents inspected. Import/recovery of this particular package was not tested by replacing the live page.
- `A0_usb_checkpoint.esch`: actual current native page source.
- `A0_usb_checkpoint_raw.pdf`: untouched native export.
- `A0_usb_checkpoint.pdf`: measured-paper-boundary normalization, scale1.
- `A0_usb_checkpoint.png`: rendered from the final PDF.
- `usb_native.net`, `usb_physical_readback.json`, `schematic/usb_checkpoint_pin_to_net.csv`: real readbacks and independently reviewed assignments.

## Source/model status and next gates

Selective CSV synchronization updates the reviewed USB rows and datasheet-reconciled fixed-regulator/mux rows; it does not regenerate/approve unrelated legacy rows. The full canonical model remains explicitly a subset. Generated general section drivers now require pinned manufacturer/UUID identity, physical-pin inventories and reviewed passive specifications; they are **not approved whole-section executions**. Source/BOM consistency outside the reviewed subset, ESP32 variant GPIO allocations and full support circuitry remain unfinished.

Read-only power library queries found actual TI charger/eFuse/mux records, JST S2B-PH-SM4-TB(LF)(SN) rather than the XY clone, Semitec103AT-2 and Bourns MF-MSMF050-2. These are candidates, not approved placements. Remaining engineering review must include:

1. Resolve five native warnings and correct verified library electrical types without changing physical pin numbers/geometry.
2. Reconcile full charger temperature/programming circuitry, exact battery/NTC connector contacts and mechanical pads, protection/mux thresholds and full USB current/capacitance budget.
3. Explicitly reconcile RFQ USB-PD and potential solar-powered source requirements. The existing5V sink does not implement PD negotiation; raw panel open-circuit voltage cannot be assumed equal to its nominal6V rating.
4. Validate safe powered-off FPC signal behavior: switched3V3 alone does not prevent I2C/I2S back-powering. Review hardware isolation/buffers and reset/firmware sequencing before approving that section.
5. Complete physical maps, exact device/passive manifests, GPIO allocation and storage/RF expansion; generate functional sections incrementally in this same logical schematic.
6. Obtain full native netlist parity, strict ERC and actual integration visual acceptance before any PCB/fabrication work.

**Final platform release: BLOCKED. Flexible two-layer polyimide FPC remains the required primary implementation.**
