# 15 — Client Clarification Register

| ID | Group / question | Why it matters | Blocks |
|---|---|---|---|
| Q-M01 | Main-board envelope, mounting, enclosure, magnetic geometry and hive attachment method? | determines outline, keepouts, thermal/acoustic placement | schematic/layout |
| Q-M02 | FPC length, bend radius, installation method, exposure, cleanability and connector access? | determines stackup, material, retention and SI | layout/fab |
| Q-S01 | Exact T/RH, microphone, IMU and VOC accuracy/range/sample-rate priorities? | freezes MPNs, buses and apertures | schematic |
| Q-S02 | Which 2–3 sensors are simultaneous on each normal FPC? | address/power/audio and DNI matrix | schematic |
| Q-C01 | Maximum dock separation/FPC length, cycle count and contact environment? | decides I²C versus differential and pogo rating | schematic/layout |
| Q-C02 | Required data rate, latency, hot-plug behavior and error tolerance? | defines protocol and SI acceptance | schematic/validation |
| Q-P01 | Battery capacity, chemistry/protection, peak current, connector and runtime target? | charger, regulator, copper and safety | schematic |
| Q-P02 | USB-PD required or USB-C 5 V sufficient? What are external/solar voltage/current profiles? | avoids incorrect PMIC topology | schematic |
| Q-D01 | Offline buffering duration, timestamp accuracy/timezone and export format? | storage, RTC/sync and firmware acceptance | architecture |
| Q-RF01 | Which expansion modules/antenna types and simultaneous radio use? | connector, power, RF keepouts and certification | layout |
| Q-E01 | Hive temperature/humidity, condensation, propolis, cleaning and ingress expectations? | materials, vents, conformal coating and validation | fab/validation |
| Q-Q01 | Confirm one-hive pilot scope versus RFQ 5–10 main / 10–20 FPC batch; spare ratio? | separates pilot procurement from quoted batch | plan/quote |
| Q-A01 | Acceptance limits for dock cycles, sensor accuracy, runtime, wireless, thermal and field trial? | turns plans into pass/fail tests | validation |

Client answers should be versioned and linked to requirement IDs before capture. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
