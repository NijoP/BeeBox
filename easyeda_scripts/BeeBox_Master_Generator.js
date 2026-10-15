/* BeeBox master schematic generator — fail-closed controlled orchestrator.
 *
 * Execute as an EasyEDA standalone script body or through POST /execute.
 * This revision intentionally performs no placement: mandatory engineering gates are open.
 * Closing a gate requires updating the canonical repository model and regression tests first.
 */
const BUILD_ID = 'BEEBOX-MASTER-20261015-R1';
const TARGET = {
  projectUuid: 'd84c4be0ef2e467fa17955faa23c6314',
  projectName: 'BEEBOX',
  mainPageUuid: 'd5e34c82cc3ba89c',
  mainPageName: 'P1',
  pageSize: 'A0',
  width: 4681.102362204724,
  height: 3311.023622047244,
};
const REQUESTED_PHASE = 'PRECHECK'; // PRECHECK or PHASE_01 ... PHASE_08

const PHASES = {
  PHASE_01: {name: 'power_usb', mandatory: true, blockers: ['BATTERY_TS_TOPOLOGY','EXTERNAL_INPUT_CONNECTOR_TVS_AND_TPS26600_VALUES','TPS2121_CONFIGURATION','BQ24074_CONFIGURATION']},
  PHASE_02: {name: 'regulator_mcu', mandatory: true, blockers: ['DEPLETED_1S_CANNOT_SUPPORT_FIXED_3V3_BUCK_OUTPUT','MCU_SUPPORT_PASSIVE_IDENTITIES']},
  PHASE_03: {name: 'sensors_audio', mandatory: true, blockers: ['MICROPHONE_LIBRARY_PIN_REVIEW','I2C_MUX_RESET_PULLUP_IDENTITY']},
  PHASE_04: {name: 'storage_rf', mandatory: false, blockers: ['EXACT_DNI_CONNECTOR_FOOTPRINTS']},
  PHASE_05: {name: 'docking', mandatory: true, blockers: ['TWELVE_MILL_MAX_CONTACT_LIBRARY_AND_LAND_PATTERN','DOCK_ESD_LINE_ALLOCATION','POWERED_OFF_SIGNAL_ISOLATION']},
  PHASE_06: {name: 'universal_sensor_fpc', mandatory: true, blockers: ['DEDICATED_FPC_PAGE_AND_BOARD_MISSING','J2_LIBRARY_IDENTITY','FPC_POWER_AND_BACKPOWER_POLICY']},
  PHASE_07: {name: 'status_test', mandatory: true, blockers: ['D4_EXACT_LIBRARY_IDENTITY','TEST_POINT_EXACT_FOOTPRINT']},
  PHASE_08: {name: 'final_verification', mandatory: true, blockers: ['PHASES_01_TO_07_NOT_VERIFIED']},
};

const VERIFIED_USB_IDENTITIES = {
  J1: {mpn:'TYPE-C-31-M-12',manufacturer:'韩国韩荣',uuid:'730e76758f9742ca9ca85c73f4ec0ecd',libraryUuid:'0819f05c4eef4c71ace90d822a990e87',symbolUuid:'e30d694d838e433dbe5423a6e817759e',footprintUuid:'45d257a27a304edd865bdb43b1945b61'},
  D6: {mpn:'USBLC6-2SC6',manufacturer:'ST(意法半导体)',uuid:'5f9a995bc73746278024add8c7b330e3',libraryUuid:'0819f05c4eef4c71ace90d822a990e87',symbolUuid:'a1ce4cdfd8c34673b2774988c19b159e',footprintUuid:'136db59d42184a44ac8441e35d752b13'},
  R6: {mpn:'0603WAF5101T5E',uuid:'5e5266518f0e41f791738aa9f7251c1d',libraryUuid:'0819f05c4eef4c71ace90d822a990e87'},
  R7: {mpn:'0603WAF5101T5E',uuid:'5e5266518f0e41f791738aa9f7251c1d',libraryUuid:'0819f05c4eef4c71ace90d822a990e87'},
  C21:{mpn:'CL21B475KOFNNNE',uuid:'e17be92a8eac408885c635361c15f72c',libraryUuid:'0819f05c4eef4c71ace90d822a990e87'},
  C22:{mpn:'CL10B103KB8NNNC',uuid:'860ad348098247a18e65be2d4651b260',libraryUuid:'0819f05c4eef4c71ace90d822a990e87'},
};
const USB_PHYSICAL_PIN_MAP = {
  J1:{A1B12:'GND',A4B9:'VBUS_USB',B8:null,A5:'USB_CC1',B7:'USB_DN_CONN',A6:'USB_DP_CONN',A7:'USB_DN_CONN',B6:'USB_DP_CONN',A8:null,B5:'USB_CC2',B4A9:'VBUS_USB',B1A12:'GND','1':'GND','2':'GND','3':'GND','4':'GND'},
  D6:{'1':'USB_DP_CONN','2':'GND','3':'USB_DN_CONN','4':'USB_D_N','5':'VBUS_USB','6':'USB_D_P'},
  R6:{'1':'USB_CC1','2':'GND'}, R7:{'1':'USB_CC2','2':'GND'},
  C21:{'1':'VBUS_USB','2':'GND'}, C22:{'1':'VBUS_USB','2':'GND'},
};

function requiredApis() {
  return [
    ['dmt_Project.getCurrentProjectInfo', eda.dmt_Project?.getCurrentProjectInfo],
    ['dmt_Schematic.getCurrentSchematicPageInfo', eda.dmt_Schematic?.getCurrentSchematicPageInfo],
    ['sch_PrimitiveComponent.getAll', eda.sch_PrimitiveComponent?.getAll],
    ['sch_PrimitiveComponent.getAllPinsByPrimitiveId', eda.sch_PrimitiveComponent?.getAllPinsByPrimitiveId],
    ['sch_PrimitiveComponent.create', eda.sch_PrimitiveComponent?.create],
    ['sch_PrimitiveComponent.createNetPort', eda.sch_PrimitiveComponent?.createNetPort],
    ['sch_PrimitiveWire.create', eda.sch_PrimitiveWire?.create],
    ['sys_FileManager.getDocumentSource', eda.sys_FileManager?.getDocumentSource],
    ['sys_FileManager.setDocumentSource', eda.sys_FileManager?.setDocumentSource],
  ].filter(([,fn]) => typeof fn !== 'function').map(([name]) => name);
}

async function exactIdentityCheck(ref, spec) {
  const record = await eda.lib_Device.get(spec.uuid, spec.libraryUuid);
  const property = record?.property;
  const association = record?.association;
  return {
    ref,
    pass: record?.uuid === spec.uuid && record?.libraryUuid === spec.libraryUuid && property?.manufacturerId === spec.mpn &&
      (!spec.manufacturer || property?.manufacturer === spec.manufacturer) &&
      (!spec.symbolUuid || association?.symbolUuid === spec.symbolUuid) &&
      (!spec.footprintUuid || association?.footprintUuid === spec.footprintUuid),
    observed: record ? {uuid:record.uuid,libraryUuid:record.libraryUuid,mpn:property?.manufacturerId,manufacturer:property?.manufacturer,symbolUuid:association?.symbolUuid,footprintUuid:association?.footprintUuid} : null,
  };
}

return await (async () => {
  const started = Date.now();
  const missingApis = requiredApis();
  const project = await eda.dmt_Project.getCurrentProjectInfo();
  const page = await eda.dmt_Schematic.getCurrentSchematicPageInfo();
  const failures = [];
  if (missingApis.length) failures.push({gate:'API_CONTRACT',missingApis});
  if (project?.uuid !== TARGET.projectUuid || project?.friendlyName !== TARGET.projectName) failures.push({gate:'ACTIVE_PROJECT',expected:TARGET,observed:project});
  if (page?.uuid !== TARGET.mainPageUuid || page?.name !== TARGET.mainPageName) failures.push({gate:'ACTIVE_PAGE',expected:TARGET,observed:page});
  const title = page?.titleBlockData || {};
  const value = key => title[key]?.value;
  const width = Number(value('Width')), height = Number(value('Height'));
  if (value('Page Size') !== TARGET.pageSize || value('Symbol') !== 'Drawing-Symbol_A0' || Math.abs(width-TARGET.width)>0.01 || Math.abs(height-TARGET.height)>0.01)
    failures.push({gate:'A0_PAGE_METADATA',expected:{size:TARGET.pageSize,width:TARGET.width,height:TARGET.height},observed:{size:value('Page Size'),symbol:value('Symbol'),width,height}});

  const source = await eda.sys_FileManager.getDocumentSource();
  if (typeof source !== 'string' || !source.length) failures.push({gate:'ROLLBACK_SOURCE',reason:'Native document source unavailable'});
  const refs = new Map(), duplicates = [];
  for (const component of await eda.sch_PrimitiveComponent.getAll()) {
    const ref = component.getState_Designator?.();
    if (!ref) continue;
    if (refs.has(ref)) duplicates.push(ref); else refs.set(ref, component.getState_PrimitiveId());
  }
  if (duplicates.length) failures.push({gate:'DUPLICATE_REFERENCES',duplicates:[...new Set(duplicates)]});

  const identityChecks = [];
  for (const [ref,spec] of Object.entries(VERIFIED_USB_IDENTITIES)) identityChecks.push(await exactIdentityCheck(ref,spec));
  const badIdentities = identityChecks.filter(x=>!x.pass);
  if (badIdentities.length) failures.push({gate:'VERIFIED_USB_LIBRARY_IDENTITIES',badIdentities});

  const unresolved = Object.entries(PHASES).flatMap(([phase,spec])=>spec.blockers.map(blocker=>({phase,blocker})));
  if (REQUESTED_PHASE !== 'PRECHECK' && !PHASES[REQUESTED_PHASE]) failures.push({gate:'REQUESTED_PHASE',reason:`Unknown phase ${REQUESTED_PHASE}`});
  if (REQUESTED_PHASE !== 'PRECHECK') failures.push({gate:'ENGINEERING_RELEASE',reason:'Canonical release gates are open; mutation is prohibited',unresolved});

  return {
    buildId: BUILD_ID,
    requestedPhase: REQUESTED_PHASE,
    status: failures.length || unresolved.length ? 'BLOCKED_NO_MUTATION' : 'PREFLIGHT_PASS_NO_MUTATION',
    elapsedMs: Date.now()-started,
    active:{projectUuid:project?.uuid,projectName:project?.friendlyName,pageUuid:page?.uuid,pageName:page?.name,pageSize:value('Page Size'),width,height},
    nativeBackupAvailable: typeof source === 'string' && source.length > 0,
    nativeSourceLength: typeof source === 'string' ? source.length : null,
    duplicateReferences: duplicates,
    identityChecks,
    reviewedUsbPhysicalPinMap:USB_PHYSICAL_PIN_MAP,
    failures,
    unresolved,
    mutationCount:0,
    evidenceRule:'Script completion is not an electrical PASS. Use physical-pin, native-netlist/ERC and PDF visual evidence.',
  };
})();
