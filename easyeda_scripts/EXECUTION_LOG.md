# BeeBox EasyEDA execution log

## 2026-10-15 — standalone script release gate

### Generated script set

`01_usb_power_entry.js` through `11_final_verification.js` were generated/updated as independent copy-pasteable scripts. The old combined section scripts were removed to prevent accidental duplicate placement.

### Offline validation

- `tools/validate_standalone_scripts.py`: **PASS**
  - 11 scripts
  - 60 unique placed references
  - 330 physical pin/contact rows
  - 68 nets
  - 237 graph links
  - all 15 high-risk checks passed
- Canonical model verifier: **PASS**
- Four Node regression tests: **PASS**
- Node async syntax compilation of all 11 scripts: **PASS**
- Live read-only validation of 37 unique pinned EasyEDA UUID records: **PASS**, zero mismatches.

Evidence:

- `outputs/schematic/logs/standalone_script_validation.json`
- `outputs/schematic/readback/standalone_library_uuid_validation.json`
- `netlist/canonical_net_membership.csv`
- `netlist/canonical_pin_to_pin.csv`

### Live mutation

No completed placement is claimed in this entry.

## 2026-10-15 — visual reset and reference-study gate

- Stopped section expansion before any non-USB section was run.
- Preserved the two failed USB visual attempts as native checkpoints:
  - `outputs/schematic/checkpoints/pre_reset_usb_failed_layout_native_backup.json`
  - `outputs/schematic/checkpoints/pre_second_reset_usb_layout_test_backup.json`
- Restored the known empty native A0 source. Readback after reset: one `sheet` object, zero circuit components and zero wires; project/page/title settings retained.
- Inspected the supplied PDF at full-page scale and USB/charger/MCU close zoom.
- Generated `schematic/reference_layout_knowledge_graph.json` and `projects/beebox/05_schematic_audit/reference_pdf_layout_knowledge.md`.
- Confirmed the failed generator defects: 12-unit label clearance, fixed rotation-zero ports, arrow-port clutter, detached passive rows and crossing duplicate-contact buses.
- Increased named-stub clearance and derived direction from actual EasyEDA pin rotation. The dedicated USB generator was rebuilt in the reference style and passed offline checks.
- Subsequently executed sections 01–10. Final live readback contains 72 designator-bearing references, 97 total component objects and 279 named wires.
- `outputs/schematic/readback/final_physical_pin_parity.json`: **PASS**, 314 checked physical pins, zero mismatches.
- Three endpoint collisions found during parity (`MIC2/U9`, `R1/TP11`, `R2/TP12`) were corrected in place; generator/test-point coordinates were then changed so clean future execution avoids those collisions without an orphan repair stage.
- Final visual cleanup moved C30 inside the usable boundary, moved TP11/TP12 above the lower boundary, removed two obsolete colliding net ports, and replaced the malformed LED backtracking stubs.
- Independent datasheet review found that TPS62162 is the fixed 5.0 V member, not 3.3 V. Transactional script `03a_replace_u3_3v3_variant.js` replaced live U3 with exact TPS62161DSGR/C2864193 and reconstructed all nine named pin stubs.
- Latest live readback: 72 designator-bearing references, 95 total component objects, 279 wires. `tools/verify_live_schematic_readback.py`: **PASS**, 314 physical pins and exact live identities checked, no boundary/backtracking/different-net endpoint errors.
- Actual EasyEDA PDF/PNG export is under `outputs/schematic/final/`; file-signature/page/dimension/hash evidence is in `export-verification.txt`.
- Native GUI ERC: **NOT TESTED**. Separate P2/Board-B universal sensor FPC assignment: **FAIL release gate / pending**. Manufacturing readiness is not claimed.
