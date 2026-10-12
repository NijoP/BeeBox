# Root-cause reconciliation revision

## Actual current evidence (not stale counts)

- Active project UUID: `d84c4be0ef2e467fa17955faa23c6314` (BEEBOX).
- Active page UUID: `d5e34c82cc3ba89c` (Schematic1/P1).
- Native backup: `native_backup_rootcause.esch` and `native_backup_rootcause.json`.
- 55 components, 240 wires, 292 physical symbol pins.
- Native backup SHA-256: `e8254daa5a2e9a822d9de0403d15964e45d37b493fca1c77c5cbc1272395bdbc`.
- 2555 native source records were parsed as header/body JSON.
- Recovery was actually tested: `setDocumentSource()` accepted the exact current source on the same page and all 55 references were preserved. See `native_recovery_probe.json`.
- Actual API-exported PDF: `before_rootcause.pdf`; locally rendered/inspected image: `before_rootcause.png`.

## Visual verdict: FAIL

The rendered export is sparse and fragmented. IC support passives occupy separate rows, not local circuits. There are no functional section rectangles. The arrangement is not a professional schematic. Merely reducing grid spacing did not solve the grouping problem.

PDF dimensions are PDF points, not EasyEDA drawing units. Previous reports conflated these units. An automatically cropped export's MediaBox alone cannot prove the underlying sheet size. Current page metadata has an empty `titleBlockData`; A0 metadata/border must be inspected independently. No A0 PASS is justified.

## Electrical observations: FAIL / incomplete canonical reference

`physical_pins_before_rootcause.json` records actual physical pin numbers, aliases, coordinates, device and footprint identity. `observed_pin_contacts.csv` reconstructs direct geometric contacts with named wire segments.

- 52 physical pins have no observed contact. This includes potentially intentional no-connects; it is not a native ERC error count.
- 45 wire net names are missing from the current canonical dictionary (see `physical_contact_audit.json`).
- L1 uses `SW`, while U3 uses `BUCK_SW`.
- R12 uses `EXT_ILIM`, while the build sheet assigns it to `CHARGER_ILIM`.
- LED resistors terminate on `D2.A`/`D3.A`/`D4.A`, while LED pins use different named nets.
- U4 RESET# is grounded and therefore asserted.
- U9's SPI path has no corresponding signals on the defined docking interface.
- The canonical table uses aliases such as VOUT/VDD33/GPIO instead of complete actual pin numbers and omits essential support pins.
- The components source incorrectly calls TCA9546APWR TSSOP-24; live symbol has 16 pins.
- USBLC6 provenance points to a different manufacturer's device datasheet in the component-generation source.
- The source calls TPS22919 current-limited without a demonstrated current-limit function.
- Exact LED, connector, and passive identity mismatches remain under investigation; no substitutions are approved by this report.

## Generator fixes implemented in this revision

1. Removed both substring/EIA-digit guessing and generic passive exemplars.
2. A passive now requires a reviewed per-reference specification: MPN, manufacturer, package, tolerance, rating, evidence, library UUID/device UUID, value/kind and capacitor dielectric.
3. Entire section library preflight runs before any placement. Missing required passives cannot leave partially generated ICs.
4. Duplicate references are rejected across the current sheet AND within the requested section.
5. Component identity and passive display values are read back after modification.
6. Removed the modal message box that could leave execution waiting on UI interaction.
7. Corrected deterministic source nets: L1 BUCK_SW, R12 CHARGER_ILIM, LED intermediate anode nets.
8. Corrected U4 RESET# to an inactive logic-high connection in the preliminary script; final reset/bias arrangement still needs documented review.
9. Restored the specified D4 identity in the script instead of silently using TBKT.
10. Restored specified JST battery and TI audio-switch identities; changed USBLC6 pin 5 from GND to VBUS_USB. These changes are not library/footprint approval.
11. Removed the generic J3 connector search; its intended Mill-Max contact identity is restored. A guard rejects the existing 12-pin map for a single contact until all twelve contacts are independently represented.
12. Read the actual local RFQ (`rfq_local_extracted.txt`). It requires physical expansion provisions, so the earlier storage/RF no-op cannot be accepted as RFQ completion, even if fitted modules remain DNP.

Regression tests demonstrate missing reviewed passives and duplicate references fail before mutation. This is a safety fix, NOT a complete placement-engine implementation. Geometry-aware grouping and complete manufacturer-based power design remain to be implemented before section execution is accepted.

## Native verification attempts

`sch_Drc.check(true,false,true)` and `sch_Netlist.getNetlist()` each exceeded the bridge request deadline. Their actual timeout results are retained. Neither is a PASS or evidence of zero errors. Direct physical-pin/wire readback and PDF export succeeded.

## Latest reset / section execution

After successful native recovery, the defective 55 devices and 240 wires were deleted from the verified active page. Project/page/title metadata remain. Post-reset physical readback confirms zero devices and zero wires.

The corrected power preflight was executed and rejected unresolved D6 library identity before mutation. The sheet remained empty. Power section has NOT passed; no later section was executed. It would recreate the previous failures to run the incomplete configuration before selecting reviewed passives and completing the physical-pin power design.

## Source of truth status

The existing engineering tables are preliminary and contradictory, not a complete approved physical-pin netlist. Do not fabricate a complete canonical dictionary by copying the defective live nets. Do not change passive names to conceal wrong hardware identities. Manufacturing remains controller/sensor regions in one logical design; a cuttable rigid board is an alternative to the required flexible FPC and has not gained client approval.
