# Preliminary Schematic Capture Specification

**Revision:** 2026-10-12

This is the controlled preliminary capture baseline. It is not a released manufacturing schematic. Native KiCad symbol/footprint assignment is still subject to final library and manufacturer drawing review.

## Sheet hierarchy

1. `01_INPUT_POWER` — J1 USB-C 5 V sink, JEXT 6 V input, TPS26600RGET protection, F1, ESD, BQ24074RGT, BT1, battery protection responsibility, VSYS and test points.
2. `02_3V3_REGULATOR` — TPS62162DSG, L1, feedback, input/output decoupling, +3V3 test point.
3. `03_ESP32S3_DEBUG_USB` — ESP32-S3-WROOM-1-N16R8, EN, BOOT, USB D+/D−, UART0, strapping, programming pads, antenna keepout note.
4. `04_LOCAL_SENSORS_AUDIO` — external SHT45, external ICS-43434, ICM-42688-P option, I²C, I²S source selection, sensor interrupts.
5. `05_STORAGE_RF_EXPANSION` — SPI bus, SD CS option, UART1 RF expansion, reset/enable/IRQ, 3V3/GND.
6. `06_DOCK_INTERFACE` — TCA9546APWR, VDOCK load switch, dock ESD, 12-contact pogo pinout, presence/ID, I²C at 100 kHz, I²S fallback/source select.
7. `07_UNIVERSAL_FPC` — Hirose FH34SRJ-12S-0.5SH(50), SHT45, ICS-43434, ICM-42688-P, SGP40 DNI, second sensor DNI footprints, local bypass and test pads.
8. `08_STATUS_AND_TEST` — LTST-C193KRKT-5A / KGKT-5A / KBKT-5A, 1 kΩ resistors, battery warning/fault nets, rail and bus test points.

## Canonical nets

`VBUS_USB`, `VIN_EXT_RAW`, `VIN_EXT_PROTECTED`, `VBAT`, `VSYS`, `+3V3`, `VDOCK`, `VFPC`, `USB_D_P`, `USB_D_N`, `I2C_MAIN_SDA`, `I2C_MAIN_SCL`, `I2C_FPC_SDA`, `I2C_FPC_SCL`, `I2S_BCLK`, `I2S_WS`, `I2S_SD_EXT`, `I2S_SD_FPC`, `SPI_SCLK`, `SPI_MOSI`, `SPI_MISO`, `SD_CS`, `RF_CS`, `RF_IRQ`, `RF_RST`, `RF_EN`, `UART1_TX`, `UART1_RX`, `DOCK_PRESENT_ID`, `ESP_EN`, `ESP_BOOT`, `LED_R`, `LED_G`, `LED_B`.

## Capture rules

- Use exact MPN fields from [24](../docs/24_Final_Baseline_BOM_and_Interface_Release.md).
- General resistors/capacitors use 0603/1608 metric; exceptions require a schematic note.
- Every IC has a local 100 nF bypass unless its datasheet explicitly changes the recommendation.
- Use 1 µF local rail support and 10–22 µF bulk where the power/transient calculation calls for it.
- Mark USB-PD controller, SD card, SGP40, second microphone, second T/RH and RF module as DNP options.
- Do not connect two I²S microphone data sources to one input simultaneously; use a source-select provision or capture only one source in V1.
- Do not connect both sides of a TCA9546A branch as if it were an audio multiplexer.
- Place ESD at the exposed connector; place input OVP before the charger.
- Add test points for VBUS_USB, VIN_EXT_PROTECTED, VBAT, VSYS, +3V3, VDOCK, GND, I²C, I²S and UART0.

## Preliminary review result
The electrical architecture is sufficiently defined for a controlled schematic draft. Final symbol/footprint assignment, ERC, and manufacturer drawing review must occur before layout release. No PCB/FPC layout or fabrication package is released by this specification.
