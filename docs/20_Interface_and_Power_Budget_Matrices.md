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
| Ground/return | 3 | three GND contacts | low impedance and return redundancy |
| Power | 3 | two VDOCK + one +3V3_FPC | distributes sensor current |
| Data | 5 | SDA/SCL + BCLK/WS/SD | 100 kHz I²C plus I²S microphone |
| Control | 1 | DOCK_PRESENT/ID | hot-plug and FPC population |

The baseline is a 12-contact interface; exact contact geometry and ratings remain hardware-release evidence.

## Pogo/dock trade study
| Option | Data pins | Power/ground | Calculated screen | Component impact | Recommendation |
|---|---:|---:|---|---|---|
| 100 kHz direct I²C | 2 | 2×VDOCK + 3×GND baseline | 200 pF/2.2 kΩ: 373 ns, pass against 1 µs screen | pull-ups, ESD, hot-plug/load switch | V1 candidate only after measured SI |
| 400 kHz direct I²C | 2 | ≥3 recommended | 200 pF/4.7 kΩ fails 300 ns; 1 kΩ passes first-order but increases sink current | stronger pull-ups and tighter capacitance | do not freeze without actual Cb |
| Differential transport | 2 data + endpoint power/ground/control | ≥3 plus transceiver requirements | not calculated until transceiver/protocol/termination selected | two endpoint transceivers, firmware, more BOM/pins | fallback if direct I²C fails |

Pogo contact current rating, resistance, force and cycle life are exact-part data still required from the Mill-Max drawing. For planning only, two parallel VDOCK contacts with an assumed 50 mΩ each have 25 mΩ equivalent resistance; at an assumed 100 mA FPC load, drop is 2.5 mV and dissipation is 0.25 mW. Replace the assumed resistance/current with exact part and worst-case load before release. A direct I²C result is therefore only a timing screen, not a connector reliability pass.

## FPC-length planning scenarios
| Installed length | Planning capacitance model | 2.2 kΩ rise time | 100 kHz screen | Engineering implication |
|---:|---:|---:|---|---|
| 50 mm | 40 pF fixed + 0.8 pF/mm = 80 pF | 149 ns | PASS calculated | preferred compact pilot |
| 100 mm | 120 pF | 224 ns | PASS calculated | provisional baseline |
| 200 mm | 200 pF | 373 ns | PASS calculated | use only if mechanical need; I²S noise/return risk increases |

The capacitance model is an explicit planning assumption, not a fabricator measurement. All three scenarios are timing-feasible at 100 kHz under the model; electrical length, contact bounce, EMI and I²S integrity still require hardware validation.

## Storage/data screening
| Mode | Example rate | Storage/day | Decision |
|---|---:|---:|---|
| Environmental telemetry | sensor records only | client interval/TBD | feasible after interval/schema |
| I²S mono raw audio, 16 kHz/24-bit | 384 kb/s raw | ~4.83 GiB/day with 1.25 overhead | event/features or large storage required |
| IMU | ODR/axes/TBD | calculate from selected configuration | reserve buffer and timestamp overhead |
