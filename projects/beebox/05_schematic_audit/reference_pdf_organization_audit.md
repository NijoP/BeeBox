# Reference PDF Organization Audit and Rebuild Plan

## Inputs inspected

- `C:\Users\HP\Downloads\SCH_Schematic1_2026-10-12 (1).pdf`
- `C:\Users\HP\Downloads\SCH_Schematic1_2026-10-12 (3).pdf`

Rendered evidence:

- `projects/beebox/03_easyeda_init/reference_pdf_1.png`
- `projects/beebox/03_easyeda_init/reference_pdf_3.png`

## Findings

Both PDFs are one-page EasyEDA exports. They are not clean engineering references in their current state: they contain large unused whitespace, isolated symbols, repeated passives without local circuitry, incomplete-looking wire stubs, and weak functional grouping. PDF (1) is a larger landscape sheet with more objects distributed across the page; PDF (3) is a smaller export with fewer objects and similarly sparse grouping. Neither PDF demonstrates ERC-clean connectivity or complete Beebox function. They are useful only for observing EasyEDA symbol/text conventions, not as an electrical or layout authority.

The required target is therefore a deliberate grouped A0 landscape schematic, not a copy of the scattered placement in either PDF.

## Target organization

| Zone | Sheet region | Contents |
|---|---|---|
| PWR-IN | upper-left | J1, D6, R6/R7, C21/C22, J4, U2/U6/U11 and input protection |
| REG | upper-center | U3, Q1, L1, R14/R15, regulator capacitors, enable/PG nets |
| MCU | upper-right | U1, boot/reset, USB/programming, decoupling, debug |
| EXT-SENSE | center-left | U7, MIC1, local capacitors and I2C/I2S labels |
| AUDIO/RF | center | U12, optional storage/RF/DNI notes |
| DOCK | lower-left | J3, U4, docking protection and 12-contact net labels |
| FPC | lower-right | J2, U8, MIC2, U9, local decoupling and FPC net labels |
| DEBUG | bottom band | D2-D4, R1-R3, TP1-TP12 and test-net labels |

Each zone is a bounded rectangle with a title, power entry on the left/top, local passives adjacent to the device, and named off-sheet-style net labels only for long cross-zone connections.

## Electrical knowledge graph

```text
USB_VBUS -> D6.1 -> USB_PROTECTED
USB_PROTECTED -> U2.VBUS
BATTERY -> J4 -> U2.BAT
USB_PROTECTED -> U11.A
BATTERY -> U11.B
U11.OUT -> VSYS
VSYS -> U6.IN
U6.OUT -> VDOCK
VSYS -> U3.VIN
U3.SW -> L1 -> +3V3
U3.FB <- R14/R15 divider
+3V3 -> Q1.IN
Q1.OUT -> +3V3_FPC / FPC power domain
+3V3 -> U1.3V3, U7.VDD, MIC1.VDD, U4.VCC, U12.VCC, U9.VDD/VDDIO
U1.USB_D_P/N <-> J1 USB data through D6
U1.I2C_MAIN_SDA/SCL -> U4.SDA/SCL and U7.SDA/SCL
U1.I2S_BCLK/WS/SD -> MIC1 and U12
U12 selects I2S_SD versus I2S_SD_EXT using AUDIO_SEL
U4.SD0/SC0 -> dock-side I2C
J3 -> VDOCK, +3V3_FPC, GND, DOCK_SDA/SCL, DOCK_BCLK/WS/SD, DOCK_PRESENT_ID
J2 -> FPC_SDA/SCL, FPC_BCLK/WS/SD, FPC_INT, FPC_ID, +3V3_FPC, GND
U8 -> FPC_SDA/FPC_SCL
MIC2 -> FPC_BCLK/FPC_WS/FPC_SD
U9 -> SPI_MOSI/MISO/SCLK, IMU_CS, IMU_INT
U1.GPIO0 <- ESP_BOOT; U1.EN <- ESP_EN
U1.GPIO47/48/40 -> R1/R2/R3 -> D2/D4/D3 -> GND
TP1..TP12 -> named power, USB, I2C, I2S and enable nets
```

## Rebuild rules

1. Clear generated circuit objects once, preserving page/title metadata and backups.
2. Generate one zone at a time using fixed zone origins and local grid spacing.
3. Place each IC first, then place its support passives within the same zone.
4. Use explicit pin maps for every IC and connector; no guessed pins.
5. Use short local wires only for local circuitry; use net labels for cross-zone signals.
6. Use exact library records for BOM parts. If an exact record is unavailable, mark the part DNI/provisional in the audit and do not claim BOM compliance.
7. After each zone: read back objects, check bounds/duplicates, render evidence, compare pins/nets, then continue.
8. Run native ERC only after all required connectivity exists.
9. Do not declare complete until the live readback, ERC, canonical netlist comparison, rendered PDF and visual inspection all agree.
