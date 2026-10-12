# 19 — Component Compliance and Selection Audit

This audit challenges the previous candidate list. Datasheet links and exact-source actions are in [03](03_Component_Research.md). “PASS” below means compatibility with the stated 3.3 V concept, not system validation.

| Ref | Manufacturer / MPN | Function | Relevant operating point / limit | Margin or issue | Decision |
|---|---|---|---|---|---|
| U1 | Espressif ESP32-S3-WROOM-1, exact suffix TBD | MCU/Wi-Fi/BLE | 3.0–3.6 V module domain; exact variant controls antenna/flash/pins | No exact suffix, GPIO map, strapping or thermal/current evidence yet | CLIENT DECISION REQUIRED |
| U2 | Sensirion SHT45 | T/RH | 3.3 V domain candidate; I²C; exposed vent required | Electrical concept compatible; self-heating and enclosure thermal error not calculated | INVESTIGATE |
| MIC1 | TDK ICS-43434 | digital microphone | 1.65–3.6 V class; I²S; 24-bit output capability | Compatible with 3.3 V; 16 kHz raw mono is ~384 kb/s before framing | RETAIN for V1, define audio mode |
| U3 | TDK ICM-42688-P | optional IMU | 3.3 V concept; SPI/I²C | Requirement says “if required”; no experiment justification or final bus assignment | CLIENT DECISION REQUIRED |
| U4 | Sensirion SGP40 | VOC | 3.3 V concept; I²C; heated gas sensor | Warm-up/heater current, airflow and contamination need design treatment | INVESTIGATE |
| U5 | TI BQ24074 | 1-cell charger/power path | 1-cell linear charger/power-path candidate | At 6 V/0.5 A, screening heat is 0.9–1.5 W; exact thermal/package/charge config required | INVESTIGATE; do not freeze |
| U6 | TI TPS62162 | 3.3 V buck | Candidate buck from battery/system rail | 0.67 A assumed peak leaves 0.33 A arithmetic margin; exact transient/thermal margin unknown | RETAIN provisionally |
| U7 | ADI MAX17048 | fuel gauge | 1-cell gauge, 2.5–4.5 V class | Compatible with VBAT concept; optional and cost trade remains | INVESTIGATE |
| D1 | TI TPD4E05U06 or equivalent | exposed-line ESD | low-capacitance data protection candidate | Not an OVP/reverse protection device for an unqualified ~6 V input | RETAIN only for suitable data lines |
| J1 | USB-C exact MPN TBD | charging/data | CC resistors, ESD, anchors required | No exact part, current rating or mechanical drawing | CLIENT DECISION REQUIRED |
| J3 | I-PEX/Molex/ZIF family TBD | FPC interface | pitch, cycles, mating height, current and stiffener required | Family name is not a purchasable design | REPLACE with exact MPN after mechanics |
| J4 | pogo array TBD | removable dock | contact force/current/cycles/alignment required | No pin count or vendor evidence | INVESTIGATE |
| BT1 | protected 1S Li-ion/LiPo TBD | energy source | capacity, C-rate, connector and protection unknown | Runtime and source-sag calculations cannot close | CLIENT DECISION REQUIRED |

## Required additional circuitry
- USB-C CC sink resistors, VBUS input protection, fuse/current limiting as appropriate, and connector ESD.
- External-input OVP/reverse-polarity protection before any line-rated downstream device.
- Battery protection or a documented protected-cell specification; charger protection is not automatically cell protection.
- Local decoupling at every IC and sensor, and a defined FPC/dock sensor-power switch or load isolation.
- Dock presence/ID, keyed polarity, hot-plug current limiting or load switch, ESD and test points.
- Programming/debug access, boot/reset support, USB data protection, and labelled rail/current test points.
- I²C isolation/buffering or differential transceivers if the final dock budget fails.
- Microphone acoustic port and sensor vent/contamination barrier.

## Alternatives
- **Charger/power path:** compare BQ24074 with a current TI/ADI 1-cell power-path device against input range, thermal dissipation, charge current and Indian availability. Do not substitute a charge-only IC without adding ideal-diode/load-share circuitry.
- **Regulator:** compare TPS62162 with a lower-cost, India-sourced 3.3 V buck whose transient/thermal data support the ESP32 load. An LDO is simpler but likely dissipates substantially more at external power or high battery current.
- **Dock:** retain I²C only for a short, low-speed, measured link; otherwise compare a complete RS-485/CAN-FD or other differential implementation including two endpoint transceivers and protocol firmware.
- **Environmental sensor:** retain SHT45 as a candidate, but compare HDC2080/BME280-class parts on accuracy, self-heating, package opening, cost and legitimate Indian sourcing.

## Audit conclusion
No current component is authorized as final solely because it appears in the previous BOM. The ESP32-S3 architecture and 3.3 V sensor concept can be retained; exact MPNs, power topology, dock connector/protocol and battery remain gated.