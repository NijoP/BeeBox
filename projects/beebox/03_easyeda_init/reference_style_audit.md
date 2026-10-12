# Reference schematic audit — 2026-10-12

Source: `C:\Users\HP\Downloads\SCH_Schematic1_2026-10-12 (1).pdf`

## Reused conventions

- Central IC inside a functional block.
- Connector at the block edge.
- Straight labelled USB data paths.
- Duplicated USB-C VBUS, GND and D+/D− pins explicitly represented.
- USBLC6-2SC6 close to the USB connector.
- CC1/CC2 5.1 kΩ pull-downs grouped together.
- VBUS 10 µF and 10 nF capacitors grouped beside the USB entry.
- MCU support passives arranged in aligned rows.

## Deliberately not copied

Motor drivers, latching power circuitry, unrelated sensors, motor connectors, and unrelated battery/protection topology were not imported from the reference product.

## Verified EasyEDA library records

| Function | Exact library identity | Footprint |
|---|---|---|
| USB-C | `TYPE-C-31-M-12` | `USB-C_SMD-TYPE-C-31-M-12_1` |
| USB ESD | `USBLC6-2SC6` | `SOT-23-6_L2.9-W1.6-P0.95-LS2.8-BL` |
| ESP32 family | `ESP32-S3-WROOM-1` generic record and N16R8-related records were returned | `WIRELM-SMD_ESP32-S3-WROOM-1` |

The exact ESP32 orderable memory/antenna suffix remains a BOM gate; the generic reference record must not be treated as proof of N16R8 identity.

## Current live rebuild evidence

Before rebuilding, the live object readback was saved to `live_schematic_backup_before_reference_rebuild.json`. The old generated objects and wires were removed from the active page, preserving the two pre-existing non-BeeBox artifacts. The revised power/USB script then placed U2, U6, U11, J1, D6, J4 and partial passive content. The section is not yet electrically or visually signed off; a later passive placement failure left one unresolved resistor designator and requires correction before further section generation.
