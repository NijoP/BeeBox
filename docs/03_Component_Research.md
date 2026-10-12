# 03 — Component Research

**Research discipline:** manufacturer pages/datasheets are the authority; supplier stock and price are intentionally not asserted. Links below were recorded 2026-10-12 and must be rechecked before AVL release. Sourcing shall prioritize authentic Indian vendors and reasonable landed cost; an expensive part is justified only by a documented electrical, mechanical, safety or availability requirement.

| Function | Candidate / exact MPN | Package / key fit | Alternative and trade-off | Status / source |
|---|---|---|---|---|
| MCU/RF | Espressif ESP32-S3-WROOM-1 (variant TBD) | module; Wi-Fi/BLE; exposes rich peripherals | ESP32-S3-MINI-1: smaller, fewer expansion mechanics | Candidate; [datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf), [S3 datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf) |
| External T/RH | Sensirion SHT45 | I²C, small DFN; verify address/vent | TI HDC2080: compare accuracy, availability, package | Candidate; [SHT45](https://sensirion.com/resource/datasheet_sht4x) |
| MEMS mic | TDK ICS-43434 | digital I²S; needs clock/data topology | Infineon IM73A135V01: compare supply/noise/availability | Candidate; [ICS-43434](https://invensense.tdk.com/wp-content/uploads/2016/02/DS-000069-ICS-43434-v1.2.pdf) |
| IMU | TDK ICM-42688-P | 6-axis, SPI/I²C; package and library verify | Bosch BMI270: compare current and software | Optional candidate; [datasheet](https://invensense.tdk.com/wp-content/uploads/2020/04/DS-000347-ICM-42688-P-v1.3.pdf) |
| VOC/environment | Sensirion SGP40 | I²C; heater/current and humidity compensation | Bosch BME688: adds T/RH/pressure/gas, different algorithm | Candidate; [SGP40](https://sensirion.com/resource/datasheet_sgp40) |
| Charger/power path | TI BQ24074 | 1-cell charger/power-path; configure input limits | Analog Devices LTC4054 plus load switch: simpler, less integrated | Topology candidate; [datasheet](https://www.ti.com/lit/ds/symlink/bq24074.pdf) |
| 3.3 V regulator | TI TPS62162 buck | efficient, input range suited after power path; inductor/layout required | low-Iq LDO: simpler but thermal/runtime trade | Candidate; [datasheet](https://www.ti.com/lit/ds/symlink/tps62162.pdf) |
| Fuel gauge | Analog Devices MAX17048 | I²C, 1-cell model-gauge | no gauge + ADC: lower BOM, poorer SoC estimate | Optional; [datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/max17048-max17049.pdf) |
| ESD | TI TPD4E05U06 | low-capacitance multi-line protection | Nexperia PESD: compare capacitance/package | Candidate at suitable data lines; not input OVP; [datasheet](https://www.ti.com/lit/ds/symlink/tpd4e05u06.pdf) |
| USB-C | USB Type-C receptacle, exact MPN TBD | CC resistors, ESD, mechanical anchors | alternate receptacle validated by fab | MPN not frozen; do not claim stock |
| External input protection | TI TPS2660 | eFuse/OVP candidate for ~6 V input | discrete fuse + reverse MOSFET: lower cost, less integrated protection | Candidate; [datasheet](https://www.ti.com/lit/ds/symlink/tps2660.pdf) |
| I²C branch | TI TCA9546A | 4-channel I²C switch for same-address sensors and isolation | TCA9517/TCA4307: buffering/hot swap trade | Candidate; [datasheet](https://www.ti.com/lit/ds/symlink/tca9546a.pdf) |
| Dock connector | Hirose BM20/BM22 or Molex SlimStack family, exact MPN TBD | fine-pitch options; not a pogo pin by itself | ZIF/FPC connector or spring contacts | mechanical study required |

## Selection checks before commitment
Confirm exact package land pattern from manufacturer CAD, voltage/logic compatibility, addresses, I²S channel behavior, exposed-pad assembly, lifecycle/PCN policy, thermal dissipation, and an authorized source. Footprints are not generated yet. Prices, stock, lead time and lifecycle status remain unresolved research actions. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
