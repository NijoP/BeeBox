return {page:await eda.dmt_Schematic.getCurrentSchematicPageInfo(),violations:await eda.sch_Drc.check(true,false,true),netlist:await eda.sch_Netlist.getNetlist()};
