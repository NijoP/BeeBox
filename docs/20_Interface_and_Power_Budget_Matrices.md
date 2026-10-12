# 20 — Interface and Power Budget Matrices

These are audit matrices, not a final pinout. Values marked `A` are explicit assumptions from [`tools/verify_engineering.py`](../tools/verify_engineering.py); `TBD` requires exact datasheet/client input.

## Rail/load budget
| Subsystem | Rail | Min | Nominal | Max | Typical current | Peak current | Power | Duty | Thermal impact | Source | Margin |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---|---|
| ESP32-S3 | +3V3 | TBD | 3.3 V | 3.6 V | 240 mA A | 430 mA A | 0.79–1.42 W | radio dependent | regulator transient | script + exact module datasheet required | 1 A rail leaves 330 mA against A peak |
| Local sensors | +3V3 | TBD | 3.3 V | TBD | 12 mA A | TBD | 40 mW A | profile dependent | low, self-heating relevant | script / datasheets | TBD |
| FPC sensors | VFPC/+3V3 | TBD | 3.3 V | TBD | 10 mA A | TBD | 33 mW A | population dependent | SGP40/heaters TBD | script / datasheets | TBD |
| Storage | +3V3 | TBD | 3.3 V | TBD | 80 mA A | TBD | 264 mW A | write duty | burst/decoupling | script / device datasheet | TBD |
| RF expansion | +3V3 | TBD | 3.3 V | TBD | 100 mA A | module-specific | 330 mW A | optional | module-specific | script / selected module | TBD |
| Dock | VDOCK | TBD | TBD | TBD | 20 mA A | sensor-dependent | TBD | population dependent | contact/load switch | assumption | TBD |

## Preliminary GPIO/peripheral budget
| Function | Required resource | Proposed mapping | Status |
|---|---|---|---|
| USB D+/D− | USB pins or module-supported interface | exact GPIO map TBD | BLOCKED — exact module/USB plan |
| Local I²C | SDA/SCL + interrupts | GPIO pair TBD | PROVISIONAL |
| Local I²S microphone | BCLK/WS/SD | 3 peripheral signals TBD | PROVISIONAL |
| SPI expansion/storage | SCLK/MOSI/MISO + CS | shared bus, CS per device | PROVISIONAL |
| UART debug/RF | TX/RX + optional CTS/RTS | UART allocation TBD | PROVISIONAL |
| Dock | SDA/SCL or DATA+/DATA− plus presence/ID | TBD | BLOCKED — protocol |
| SD card | SDMMC or SPI | optional; may consume pins | CLIENT DECISION REQUIRED |
| Reset/boot | EN and boot strap | reserved | REQUIRED |
| PWM/ADC/interrupt | multiple GPIO-capable pins | reserve before expansion | REQUIRED |

The ESP32-S3 has multiplexed peripherals, but not every pin is equally safe: strapping, flash/PSRAM, USB, module antenna and startup constraints must be checked against the exact module variant. No complete GPIO claim is made until the variant is fixed.

## Sensor/interface matrix
| Device | Interface | Voltage concept | Address/CS | Timing/data | Dock suitability |
|---|---|---|---|---|---|
| SHT45 | I²C | 3.3 V | address per datasheet | low-rate conversion | suitable locally; dock only after SI |
| ICS-43434 | I²S | 3.3 V | L/R select | 16 kHz/24-bit example = 384 kb/s raw | keep local; do not carry over slow I²C |
| ICM-42688-P | SPI/I²C | 3.3 V concept | CS/address | sample-rate dependent | local or FPC with defined isolation |
| SGP40 | I²C | 3.3 V concept | fixed/address constraints verify | heater/warm-up | dock power/thermal review |
| MAX17048 | I²C | VBAT/logic per datasheet | fixed/address verify | low-rate | local preferred |

## I²C address and pull-up table
| Bus | Devices | Address | Pull-up | Estimated Cb | Calculated rise | Decision |
|---|---|---|---:|---:|---:|---|
| I2C_MAIN | SHT45, MAX17048, optional SGP40/IMU | verify each exact device | 4.7 kΩ | 100 pF A | 398 ns | 100 kHz calculated pass; verify address conflicts |
| DOCK_I2C | FPC sensors via pogo | depends on population | 4.7 kΩ initially | 200 pF A | 797 ns | 100 kHz only provisional; 400 kHz fails |

## Dock/FPC pin budget
| Pin class | Count | Purpose | Required decision |
|---|---:|---|---|
| Ground/return | ≥2 recommended | low impedance and signal return | connector/pogo geometry |
| Power | ≥1 | VDOCK or switched VFPC | maximum sensor current |
| Data | 2 for I²C, or 2+ for differential | selected protocol | SI and endpoint topology |
| Control | 1–3 | presence/ID/reset/enable/IRQ | hot-plug and population |
| Shield/guard | optional | ESD/noise | mechanical connector |

The practical minimum is not frozen until the FPC population and link protocol are fixed.

## Pogo/dock trade study
| Option | Data pins | Power/ground | Calculated screen | Component impact | Recommendation |
|---|---:|---:|---|---|---|
| 100 kHz direct I²C | 2 | ≥3 recommended | 200 pF/4.7 kΩ: 797 ns, pass against 1 µs screen | pull-ups, ESD, hot-plug/load switch | V1 candidate only after measured SI |
| 400 kHz direct I²C | 2 | ≥3 recommended | 200 pF/4.7 kΩ fails 300 ns; 1 kΩ passes first-order but increases sink current | stronger pull-ups and tighter capacitance | do not freeze without actual Cb |
| Differential transport | 2 data + endpoint power/ground/control | ≥3 plus transceiver requirements | not calculated until transceiver/protocol/termination selected | two endpoint transceivers, firmware, more BOM/pins | fallback if direct I²C fails |

Pogo contact current rating, resistance, force and cycle life are exact-part data still missing. A direct I²C result is therefore only a timing screen, not a connector reliability pass.

## Storage/data screening
| Mode | Example rate | Storage/day | Decision |
|---|---:|---:|---|
| Environmental telemetry | sensor records only | client interval/TBD | feasible after interval/schema |
| I²S mono raw audio, 16 kHz/24-bit | 384 kb/s raw | ~4.83 GiB/day with 1.25 overhead | event/features or large storage required |
| IMU | ODR/axes/TBD | calculate from selected configuration | reserve buffer and timestamp overhead |
