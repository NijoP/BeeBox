# 08 — PCB and FPC Design Plan

The main board and universal FPC are separate designs. The client has not supplied an outline, enclosure, mounting pattern, dock geometry, or bend profile; therefore no exact board dimensions or final stackup are asserted.

## Main PCB study
Compare 2-layer and 4-layer options. A 4-layer board is a recommendation for solid return paths, RF, dense expansion and power integrity; final dielectric heights and controlled impedance come from the fabricator. Place the external T/RH in a thermally isolated, ventilated region; antenna at an edge with the module vendor keepout; USB/dock mechanically supported; switching power away from sensors/audio/RF.

## FPC study
Two copper layers, polyimide/coverlay, compact connector tail, stiffener at connector, no components in dynamic bend zones, bend radius and neutral-axis guidance from fabricator. Define openings for T/RH/VOC/microphones and keep adhesive/foam from ports. Flex fatigue, insertion cycles and installation tooling must be tested.

## Rules of evidence
Controlled 50-ohm geometry, copper weight, impedance, creepage/clearance and minimum drill are **not final** until fab stackup and capability are quoted. Run early placement-only feasibility before routing; include courtyard, connector mating, sensor apertures, antenna keepout and enclosure clearance. 
> Navigation: [README](../README.md) · [Requirements](01_Project_Requirement_Analysis.md) · [Architecture](02_System_Architecture.md) · [BOM](04_BOM_Selection.md) · [Power](05_Power_Architecture.md) · [Interfaces](06_Interface_and_Sensor_FPC_Guide.md) · [DRR](14_Design_Readiness_Review.md)
