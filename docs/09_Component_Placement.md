# 09 — Component Placement

## Priority zones
1. Mechanical envelope, mounting, magnetic dock and FPC exit.
2. ESP32 antenna/module vendor keepout and RF edge.
3. External T/RH thermal/acoustic apertures away from charger, regulator, battery and MCU.
4. USB-C, battery and dock retention/load paths.
5. Power conversion and bulk capacitors in compact current loops.
6. Sensors, storage, debug and expansion with probe access.

Place the external microphone behind a defined acoustic port, away from switching inductors and vibration sources. Put IMU on a mechanically quiet, flat region and document axes. Put FPC sensor apertures in straight, low-stress flex zones; add stiffeners and strain relief at the connector. Magnets must not interfere with the IMU, storage or magnetic components (if any); verify field strength.

Antenna orientation, ground keepout and enclosure detuning follow the selected module's layout guide. Battery and charger thermal paths must not bias environmental readings. Produce a 1:1 placement mockup and mechanical review before routing. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
