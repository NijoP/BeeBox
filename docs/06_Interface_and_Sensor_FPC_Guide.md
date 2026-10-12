# 06 — Interface and Universal Sensor FPC Guide

## Universal FPC
Use a two-layer polyimide flex with coverlay, rolled/annealed copper as appropriate, a connector stiffener, bend zones and defined sensor openings. Exact thickness, bend radius, copper weight, minimum trace/space, via technology and stiffener material come from the chosen FPC fabricator. Every optional footprint needs local decoupling strategy, address/CS/enable isolation and a documented DNI configuration; an unpopulated pad must not leave a bus short, floating power, or conflicting address.

Suggested population profiles: `FPC-A` two T/RH; `FPC-B` one T/RH + one mic; `FPC-C` IMU + VOC; all are proposals, not client-approved variants. Audio microphones require a defined I²S clock/data topology and acoustic openings; they are not interchangeable with slow I²C environmental sensors.

## Selected connector baseline
The permanent FPC interface baseline is Hirose FH34SRJ-12S-0.5SH(50), a 12-position 0.5 mm-pitch locking ZIF candidate for the 0.3 mm FPC class. It is selected for compactness, retention and a single-tail interface; final land pattern, mating direction, insertion cycles and FPC stiffener dimensions must be taken from the current manufacturer drawing. It is distinct from the repeated dock pogo array.

The repeated dock baseline is twelve Mill-Max 0906-0-15-20-75-14-11-0 spring contacts on the controller docking face, with plated fixed mating pads on the hive/FPC carrier. Two contacts are assigned VDOCK and three ground contacts provide redundancy. Contact stroke/force/resistance/cycles and actual current rating must be verified from the exact drawing before release.

## Connector trade study
| Option | Benefit | Risk / decision input |
|---|---|---|
| I-PEX micro coax/FPC family | compact, qualified mating systems | exact series, mating height, flex stiffener |
| Molex low-profile FFC/FPC | broad ecosystem | insertion cycles and ZIF mechanics |
| ZIF FPC | easy service, known FFC process | latch/envelope and contact reliability |
Choose by pitch, cycles, retention, contact count, current per contact, bend direction, mating height, sourcing and hive-installation access. Do not freeze a part from a family name.

## Dock protocol and pin count
Minimum practical proposed allocation is `GND, VSYS/VDOCK, +3V3 or switched sensor power, DATA+, DATA−/SDA, SCL/clock, RESET/ID, SHIELD/ESD` only after current and protocol are known. A short validated I²C link can be lowest-pin-count, but pogo contact resistance, intermittent opens, capacitance, hot-plugging and pull-up rise time make it a risk. Calculate `tr ≈ 0.8473 Rp Cp`; verify against the selected bus-mode limit and total FPC+pogo+input capacitance. Use series damping, bus switch, hot-plug sequencing and ESD as needed.

If distance/noise/rate requires it, compare a **complete** differential solution (e.g., CAN-FD or RS-485 transceiver pair, power and ground, termination, protocol, firmware and connector pins). Do not call “differential” a solution without specifying transceivers and return current paths. Audio should remain local/digitized and use I²S or a defined sample transport; do not push raw microphone clocks through an unvalidated slow I²C dock.

## Mechanical and electrical rules
Keep sensor vents clear of soldermask, adhesive and conformal coating; keep heat sources away from external T/RH; use strain relief and a bend-radius drawing; add ESD at accessible contacts; define dock polarity with asymmetric magnets/keying and an electrical ID. SI validation shall measure worst-case cable/FPC length, pull-ups, rise/fall, packet errors and hot-plug behavior. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
