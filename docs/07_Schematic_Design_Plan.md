# 07 — Schematic Design Plan

## Sheet plan
1. `01_INPUT_POWER`: USB-C CC/VBUS, external input, OVP, ESD, charger/power path, battery connector, test points.
2. `02_REGULATED_RAILS`: 3.3 V regulator, enable, sequencing, current monitor option.
3. `03_ESP32S3`: exact module, strapping, reset/boot, USB, decoupling, antenna keepout note.
4. `04_LOCAL_SENSORS`: external T/RH, microphone/I²S, optional IMU; thermal/acoustic mechanical notes.
5. `05_STORAGE_EXPANSION`: SD/flash option, headers, RF module interface.
6. `06_DOCK_FPC`: canonical pinout, power switch, ESD, level/translation if required, ID and presence.
7. `07_FPC`: universal connector, optional sensor footprints, DNI/isolation, vents and test pads.

## Net naming and canonical interface
Use `VBUS_USB`, `VIN_EXT`, `VBAT`, `VSYS`, `+3V3`, `VDOCK`, `VFPC`, `I2C_MAIN_SDA/SCL`, `DOCK_DATA_P/N`, `I2S_BCLK/WS/SD`, `SPI_*`, `UART_*`, `RF_*`, `USB_D_P/N`. The pinout and MPN table in this package become canonical only after client sign-off; no schematic capture is claimed.

## Capture checklist
- [ ] Exact ESP32-S3 module, antenna variant and strapping verified.
- [ ] Power source ranges, charge current, battery protection and load sharing calculated.
- [ ] GPIO/peripheral map conflict-free and all accessible resources labelled.
- [ ] Sensor addresses, I²S channels, optional DNI behavior and pull-ups reviewed.
- [ ] Dock protocol, pin count, hot-plug/ESD and FPC connector fixed.
- [ ] Expansion connector includes reset/enable/IRQ/GPIO/3.3 V/GND/antenna as applicable.
- [ ] Test points, programming/debug, polarity and creepage rules present.
- [ ] ERC/DRC rules and datasheet pin-by-pin review complete.

Material blockers are tracked in [14](14_Design_Readiness_Review.md); the plan is ready, capture is not. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
