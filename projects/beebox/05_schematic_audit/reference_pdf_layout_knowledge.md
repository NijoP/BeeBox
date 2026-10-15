# Reference PDF visual-layout knowledge

Source: `C:/Users/HP/Downloads/SCH_Schematic1_2026-10-12 (1).pdf`, page 1.
Scope: visual conventions only; it is **not** the BeeBox electrical authority.

## Inspection performed

- Full A0-like page reviewed.
- USB, charger/power and MCU regions rendered and inspected at 250%.
- PDF vector/text structure extracted: 989 words, 1,570 drawing objects, 95 component-reference labels and 468 net-label instances.
- 1,239 line segments classified; 91.53% are exactly horizontal or vertical.
- Machine-readable graph: `schematic/reference_layout_knowledge_graph.json`.
- High-resolution inspection crops: `outputs/schematic/reference_inspection/usb_250pct.png`, `charger_250pct.png`, and `mcu_250pct.png`.

## What the reference actually does

1. **Named stubs instead of wire bundles.** Most IC and connector pins leave on a straight stub. The net name is printed along that stub, and the remote endpoint is a small dot. Distant blocks are not tied together by cross-page wiring.
2. **Pin-side-aware layout.** Left-side pins exit left, right-side pins exit right, and bottom/top pins exit vertically. Labels follow the actual pin side rather than a fixed right-facing assumption.
3. **Symbol orientation follows pin topology.** The USB-C connector stays upright. The USBLC6-2SC6 is rotated 90° so pins 1–3 and 4–6 form clean vertical triplets. This prevents labels and pin numbers from competing for horizontal space.
4. **Large text-clearance corridors.** Stub lengths are much longer than the failed BeeBox generator's 12-unit stubs. Net names do not overlap symbol bodies, physical pin numbers, pin names, references or values.
5. **Passives are self-contained circuits.** Each resistor/capacitor is horizontal, with the reference above and value below. The two rail names are at opposite ends. VBUS and GND are visually and electrically separate.
6. **Duplicate USB contacts are readable because of spacing.** The reference repeats canonical net names on the connector contacts, but uses aligned rows and long stubs so repeated names do not overlap. It does not make a crossing branch-wire maze merely to reduce label count.
7. **Whitespace is functional.** Components are grouped by function but not packed so tightly that text collides. Rows and columns remain obvious.
8. **No decorative section boxes.** Separation comes from whitespace, alignment and a small section caption.

## Mistakes in the prior BeeBox attempts

- The generic generator used `LOCAL_STUB = 12`, placing labels on top of connector pin names.
- It created a large arrow-shaped net port at almost every pin.
- Every net port used rotation `0`, even on left/top/bottom exits.
- Generic passives were placed in a detached row rather than adjacent to the pins/functions they support.
- An attempted cleanup joined interleaved USB contacts with crossing branch buses. Although named nets could remain electrically distinct, the result was visually worse than the reference's aligned named stubs.
- Visual acceptance was attempted from an inconvenient live zoom before a reliable PDF/close-crop review.

## Binding rules for the next generator revision

- Compute pin side from live pin coordinates after final component rotation.
- Choose component rotation by testing whether input/connector-side pin groups and output/protected-side groups land on the intended sides.
- Reserve at least one full label-width corridor beyond the symbol; no fixed 12-unit offset.
- Prefer named-wire stubs matching the reference's small-endpoint appearance. Add a net-port glyph only when required for native global connectivity and place it outside the clearance corridor.
- Keep all labels outside symbol bounds and orient them from the outward pin vector.
- Use no crossing wire bundles for duplicated connector contacts. Use aligned named stubs or a demonstrably planar shared branch.
- Place CC pull-downs and VBUS capacitors as separate, horizontal, readable two-net circuits close to the USB functional region.
- Rotate the ESD symbol only if its actual live pins confirm that doing so creates the reference-style vertical triplets while preserving D6 physical pin mapping.
- Require full-page and 250% section review plus physical-pin/net readback before any next section.
