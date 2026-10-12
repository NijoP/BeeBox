# 04 — Preliminary BOM and Selection

This is a design-study BOM, not a purchase list. MPNs marked TBD are deliberately unresolved; no supplier stock or price is invented. Main-board and FPC quantities remain separate.

## India-first, cost-conscious sourcing policy
The AVL shall prioritize legitimate Indian distributors and assemblers (for example Mouser India, Digi-Key India, element14 India, RS India, LCSC India service where acceptable, and qualified local PCB/FPC houses) with exact manufacturer variants, invoices and traceable authenticity. Local availability and landed cost (unit price, GST, freight, minimum order and import risk) shall be compared before selection. Do not optimize for the lowest sticker price at the expense of counterfeit risk, lifecycle, safety or yield; conversely, do not select premium parts without a measurable requirement. Prefer commodity passives, standard connectors and a common 3.3 V ecosystem, while preserving a second qualified source for critical parts. Record INR estimates only from dated Indian quotations and keep engineering/NRE, pilot and production costs separate.

| Ref | Subsystem | Manufacturer / MPN | Qty main | Qty/FPC | Package / footprint status | Source / status |
|---|---|---|---:|---:|---|---|
| U1 | MCU | Espressif ESP32-S3-WROOM-1, variant TBD | 1 | — | module; verify land pattern | [official](https://www.espressif.com/en/products/modules/esp32-s3-wroom-1) / candidate |
| U2 | external T/RH | Sensirion SHT45 | 1–2 | optional 0–2 | DFN; opening required | [official](https://sensirion.com/products/catalog/SHT45) / candidate |
| MIC1 | external audio | TDK ICS-43434 | 1 | — | digital MEMS; acoustic port | [official PDF](https://invensense.tdk.com/wp-content/uploads/2016/02/DS-000069-ICS-43434-v1.2.pdf) / candidate |
| U3 | optional IMU | TDK ICM-42688-P | 0/1 | 0/1 | LGA; verify assembly | [official PDF](https://invensense.tdk.com/wp-content/uploads/2020/04/DS-000347-ICM-42688-P-v1.3.pdf) / optional |
| U4 | optional VOC | Sensirion SGP40 | 0/1 | 0/1 | DFN; gas opening | [official](https://sensirion.com/products/catalog/SGP40) / optional |
| U5 | charger/path | TI BQ24074 | 1 | — | WQFN/QFN; thermal review | [datasheet](https://www.ti.com/lit/ds/symlink/bq24074.pdf) / topology candidate |
| U6 | regulator | TI TPS62162 | 1 | — | QFN; inductor required | [datasheet](https://www.ti.com/lit/ds/symlink/tps62162.pdf) / candidate |
| U7 | fuel gauge | ADI MAX17048 | 0/1 | — | TDFN; optional | [datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/max17048-max17049.pdf) / optional |
| D1.. | protection | TI TPD4E05U06 or equivalent | as exposed lines | as docked lines | low-C ESD | [datasheet](https://www.ti.com/lit/ds/symlink/tpd4e05u06.pdf) / select after pinout |
| J1 | USB-C | exact MPN TBD | 1 | — | anchored SMT/THT TBD | sourcing action |
| J2 | expansion | exact header/mezzanine TBD | 1+ | — | mechanical envelope TBD | client/mechanical blocker |
| J3 | FPC | I-PEX/Molex/ZIF exact MPN TBD | — | 1 | mating pair required | connector trade study |
| J4 | dock | pogo array + magnet/alignment hardware TBD | 1 | 1 mating | mechanical drawing required | blocker |
| BT1 | battery | protected 1S Li-ion/LiPo, capacity TBD | 1 | — | off-board | client safety/mechanical input |
| R/C/L | passives | values per final datasheets | lot | lot | use fab-approved footprints | not frozen |

## Quantity roll-up
- **Pilot:** one-hive deployment may use 1 assembled main board and 1–N FPC variants, plus spares agreed with the client.
- **RFQ batch:** 5–10 main PCBs and 10–20 universal FPCs; this remains unchanged.
- **Production estimates:** request supplier quotations at 100/500/1,000. Engineering/NRE, tooling/setup, assembly, components, pogo/connectors and FPC stiffeners must be separate lines.

## Cost and sourcing policy
No price, availability, lifecycle or lead-time claim is complete until tied to a dated Indian supplier quote and exact variant. Request comparison quotes for prototype and 100/500/1,000-unit quantities, including GST, freight, import/customs exposure, assembly and NRE. Maintain an AVL with at least one qualified alternative for each single-source risk. A cost-down substitution requires an electrical, mechanical, firmware and validation impact review; it must not silently change the design. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
