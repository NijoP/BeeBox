# Build Sheet — BeeBox Honeybee Research Platform

> **Source of truth:** `net_connection.md` wins on connectivity. This sheet defines the approved preliminary parts and functional partition. Main controller PCB and universal sensor FPC remain separate physical boards in one logical EasyEDA project.

**Main board:** provisional 60 × 40 mm placement envelope · 4-layer study · Rev PRELIMINARY · Updated 2026-10-12
**FPC:** two-layer polyimide/coverlay, 100 mm electrical baseline; 50/200 mm scenarios remain engineering cases.

## 1. Input power and charging — Board A

**U2 BQ24074RGT** — 1S linear charger/dynamic power path, 4.2 V regulation, 0.5 A baseline charge.

| Pin/function | Net |
|---|---|
| IN | `VIN_CHARGER` from U11 source mux |
| BAT | `VBAT` |
| OUT | `VSYS` |
| ISET | `R11 1.78k` to GND |
| ILIM | `R12 1.54k` to GND |
| TMR | `R13 46.4k` to GND |
| CE/EN | controlled enable / default charge-enabled state |
| CHG/PGOOD | status MCU inputs with pull-ups |
| TS | battery NTC or approved fixed-bias network; exact cell determines implementation |

**U6 TPS26600RGET** — protected ~6 V external input. `VIN_EXT_RAW → VIN_EXT_PROTECTED`; fault output to test/MCU input.

**U11 TPS2121RUXR** — source power mux. `VIN_USB_PROTECTED` and `VIN_EXT_PROTECTED` are selected into one `VIN_CHARGER` net before U2. This prevents USB and external sources from being directly shorted and provides automatic source selection/reverse-current isolation.

Supporting parts: F1 input fuse; D5/input TVS as line-rated; C input bypass; TP for raw/protected input.

## 2. 3.3 V and dock power — Board A

**U3 TPS62162DSG** — `VSYS → +3V3`, 2.2 µH L1, R14/R15 feedback baseline, 100 nF + 1 µF input/output support, 22 µF bulk as required.

**Q1 TPS22919DCK** — `VSYS → VDOCK`, presence-controlled/current-limited FPC supply.

## 3. ESP32-S3 core — Board A

**U1 ESP32-S3-WROOM-1-N16R8**, PCB antenna. Use official Espressif symbol/pin map and Figure 11-1 land-pattern source. `VDD33 → +3V3`; all grounds to `GND`; `GPIO0 → ESP_BOOT`; `EN → ESP_EN`; GPIO19/20 USB; GPIO43/44 debug UART.

GPIO assignment is canonical in `../../netlist/gpio_map.csv` and document 23. Do not use flash/PSRAM-reserved or strapping pins contrary to the exact module datasheet.

## 4. Local sensors and audio — Board A

- `U7 SHT45`: `I2C_MAIN_SDA/SCL`, +3V3, local 100 nF, external vent.
- `MIC1 ICS-43434`: `I2S_BCLK`, `I2S_WS`, `I2S_SD_EXT`, +3V3, local 100 nF, acoustic port.
- **U12 SN74LVC1G3157DBVR** selects `I2S_SD_EXT` or `DOCK_SD` into ESP32 GPIO13 as `I2S_SD`; `AUDIO_SEL` is ESP32 GPIO39. This prevents two microphone data sources from driving one input.
- `U-IMU ICM-42688-P`: optional V1 population, I²C or SPI after source allocation review.

## 5. Storage and RF expansion — Board A

SPI shared: `SPI_SCLK`, `SPI_MOSI`, `SPI_MISO`; separate `SD_CS` and `RF_CS`. RF expansion exposes UART1, SPI, 3V3, GND, reset, enable and IRQ. SD socket and RF module are DNI options for first capture until exact footprints are selected.

## 6. Docking — Board A boundary

12 pogo contacts on controller docking face; exact allocation is in `net_connection.md` and `../../netlist/connector_pinout.csv`. Two VDOCK and three GND contacts are mandatory. D5 dock ESD is at the connector. I²C is 100 kHz baseline. I²S is event-audio path and remains hardware-validation required.

## 7. Universal sensor FPC — Board B

**J2/FPC mating:** Hirose FH34SRJ-12S-0.5SH(50), 12 position, 0.5 mm pitch, locking ZIF, 0.3 mm FPC class; connector stiffener required.

V1 populated: `U8 SHT45`, `MIC2 ICS-43434`, `U9 ICM-42688-P`. `U10 SGP40`, second SHT45 and second microphone are DNI. Each populated IC has 100 nF local bypass; 1 µF local branch support. No sensor aperture receives conformal coating.

## 8. Status and test

D2 LTST-C193KRKT-5A, D3 LTST-C193KGKT-5A, D4 LTST-C193KBKT-5A through R1–R3 1 kΩ 0603. Green ready, red fault/charge, blue logging/link. Test points TP1–TP12: USB, external input, battery, system, 3V3, dock, GND, I²C, I²S and UART0.

## 9. Capture gate

- [ ] API preflight executed in connected EasyEDA window.
- [ ] Exact library identity and manufacturer fields verified for each placed part.
- [ ] No skipped essential part.
- [ ] Every net membership reconciled against `net_connection.md`.
- [ ] Main PCB/FPC board assignments preserved.
- [ ] Native EasyEDA readback and ERC result recorded.
- [ ] Annotate performed in EasyEDA UI.
