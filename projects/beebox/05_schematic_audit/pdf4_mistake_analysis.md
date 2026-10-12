# PDF (4) Mistake Analysis — Required Before Further Rebuild

## Evidence inspected

Input:

```text
C:\Users\HP\Downloads\SCH_Schematic1_2026-10-12 (4).pdf
```

Rendered copy:

```text
projects/beebox/03_easyeda_init/pdf4.png
```

PDF geometry reported by PyMuPDF:

```text
3366.72 x 2378.88 EasyEDA units
```

This is not evidence of the intended A0 landscape drawing boundary. The export is substantially smaller than the intended A0 geometry and must not be accepted as the final page.

## What was actually created

The PDF text extraction shows 41 placed designators and 171 short wire objects were previously read back from the live page. The export contains the following broad groups:

- U2/U6/U11 input power
- J1/D6/J4 USB, ESD and battery connectors
- U3/Q1/L1/R14/R15 regulator block
- U1 ESP32-S3 and U12 audio selector
- U7/U8 SHT45 devices
- MIC1/MIC2 ICS-43434 devices
- U4 I²C mux
- J2/J3 connectors
- U9 ICM-42688-P
- D2/D3/D4 LEDs
- TP1–TP12

The presence of symbols is not proof of electrical completeness. The PDF is visually a sparse field of isolated symbols and stubs rather than a finished schematic.

## Mistakes made

### 1. The reference PDF was incorrectly treated as a good organization model

PDF (4), like the earlier PDFs, is itself poorly organized. It has huge empty areas, no clear section frames/titles, and symbols spread across the sheet. It should have been rejected as a layout authority instead of copied.

### 2. Section coordinates were not controlled as a sheet layout

The generator originally used the same base origin for multiple sections. Later placement used independent offsets without a real zone/bounds calculation. This produced the separated field of symbols visible in the PDF rather than compact functional blocks.

### 3. Supporting passives were not generated reliably

The PDF demonstrates missing required support parts:

- C1 and C2 are absent from the ESP32 section.
- C10/C11/C12 are absent from the FPC sensor section.
- R1/R2/R3 are absent from the LED section.
- Several documented protection and local decoupling components are absent.
- R11/R12/R13 appeared, but section completion was not checked against the declared passive list before proceeding.

Root cause: the generator failed or timed out after placing ICs, and the work continued without a per-section inventory gate.

### 4. LED components were silently substituted with the same red LED

D2, D3 and D4 all appear as:

```text
LTST-C193KRKT-5A
```

The approved section called for separate red/green/blue indicators. The generator used a shared exemplar instead of verified distinct library identities. This violates the exact-component rule.

### 5. LED current-limiting resistors were missing

The PDF shows LED nets but no R1/R2/R3. This is an electrical design error, not only a visual issue. The LED outputs are not a complete functional circuit without their calculated series resistors.

### 6. R14 value is wrong

The regulator feedback resistor is shown as:

```text
R14 = 100k
```

The approved regulator plan specifies R14 = 316 kΩ and R15 = 100 kΩ. The value was overwritten using a generic passive exemplar/manual insertion. This invalidates the regulator output calculation.

### 7. Test-point library identity is wrong

TP1–TP12 appear as four-pin symbols. The intended test points are single electrical test nodes. The selected `TESTPOINT_23`/equivalent symbol is not an appropriate one-pin test point. This explains the visually strange switch-like/extra-pin symbols and must be corrected with a verified one-pin test-point library record.

### 8. A provisional connector was allowed into the schematic without clear isolation

J3 is labeled:

```text
12-contact dock (provisional library connector)
```

and uses `KH-A2009-2X06AB`, not the approved Mill-Max part. It must be either replaced by an exact verified library identity or clearly marked DNI/provisional and excluded from a completion claim.

### 9. Incomplete pin-map handling was bypassed manually

Several components were placed by custom repair scripts after the section generator stopped. This created inconsistent behavior: some pins have short stubs and labels, while other pins/support networks are absent. Manual patching was not followed by a full canonical pin-to-net comparison.

### 10. Net labels/stubs were mistaken for completed circuit wiring

The PDF mainly shows isolated symbol pin stubs and labels. There is no evidence that all required local power, decoupling, pull-up, protection, feedback, or signal paths are physically connected. A component inventory alone was treated as section completion.

### 11. No per-section visual gate was enforced

The required loop was not followed:

```text
run one section -> read back -> export section -> inspect image -> compare inventory -> correct -> checkpoint
```

Instead, multiple sections were executed despite earlier section failures and timeouts.

### 12. No native ERC evidence exists

The PDF is not ERC evidence. Native EasyEDA ERC was not run and no zero-error report exists. The project must not be described as functionally verified.

### 13. A0 was not verified from the actual export

The PDF geometry does not match the intended A0 landscape boundary. Title-block metadata alone was treated as sufficient, even though the export proves the page geometry was not verified.

## Corrective lessons

1. Clear the live page once, then verify zero components, zero wires and zero generated attributes.
2. Run only one section script.
3. Require exact expected designator/value/MPN inventory before allowing the next section.
4. Abort on any missing passive, missing pin map, timeout, duplicate or provisional part.
5. Use fixed bounded section rectangles with calculated placement, not arbitrary tile offsets.
6. Use one-pin test-point symbols and verified LED identities.
7. Never substitute a passive or LED merely to make a script continue.
8. Treat short stubs as incomplete until the reconstructed live netlist proves the intended net.
9. Export each section and inspect it before continuing.
10. Run native ERC only after the complete canonical netlist comparison passes.

## Acceptance criteria for the next rebuild

A section is accepted only if all are true:

- Every declared designator exists exactly once.
- Every value and manufacturer ID matches the approved section data.
- Every IC pin is mapped or explicitly marked intentional NC.
- Every declared passive exists and is locally placed.
- No object bounds overlap another object.
- All objects are inside the section rectangle and page boundary.
- Live readback matches the section inventory.
- Rendered section image is readable and grouped.
- Reconstructed nets match the canonical netlist for that section.

Until these criteria are met, the section remains failed and the next section must not run.
