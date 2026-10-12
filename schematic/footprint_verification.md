# Footprint verification record

## ESP32-S3-WROOM-1-N16R8

- Authority: Espressif `ESP32-S3-WROOM-1 & WROOM-1U Datasheet`, official Figure 11-1 recommended PCB land pattern and Section 10.1 module dimensions.
- Verified module body screening dimension: approximately 18.0 mm × 25.5 mm × 3.1 mm.
- The official document was retrieved successfully on 2026-10-12.
- A project-specific KiCad footprint is not claimed yet because the exact pad geometry must be transcribed from the current Figure 11-1 and checked against the selected orderable suffix. The official figure is the footprint source; a generic library footprint must not be substituted silently.
- Footprint release gate: compare every castellated pad number/position, courtyard, antenna keepout, paste/mask behavior and exposed thermal/ground requirements against the manufacturer drawing, then run KiCad footprint checker and 1:1 print review.

## Other selected parts
The following parts require manufacturer CAD/drawing attachment before PCB release: BQ24074RGT, TPS62162DSG, TCA9546APWR, TPS26600RGET, MAX17048G+T10, Hirose FH34SRJ-12S-0.5SH(50), and Mill-Max 0906-0-15-20-75-14-11-0. Their schematic-level MPN selection is complete; footprint verification remains a layout/manufacturing gate, not a reason to block the preliminary electrical schematic.
