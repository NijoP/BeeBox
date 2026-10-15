"""Generate the USB subcircuit of section01 using reviewed identities.
This is a checkpoint within POWER_INPUTS, not completion of the power section.
"""
import json
from pathlib import Path
shared=Path('easyeda_scripts/section_generator.template.js').read_text(encoding='utf8').split('/* ============================ CONFIG')[0]
dev=json.loads(Path('schematic/verified_device_library.json').read_text(encoding='utf8'))
pas=json.loads(Path('schematic/verified_passive_library.json').read_text(encoding='utf8'))
body=Path('easyeda_scripts/usb_frontend_driver.template.js').read_text(encoding='utf8')
config='\nconst DEVICE_LIBRARY = '+json.dumps(dev,ensure_ascii=False)+';\nconst PASSIVE_LIBRARY = '+json.dumps(pas,ensure_ascii=False)+';\n'
style=Path('easyeda_scripts/usb_readability.template.js').read_text(encoding='utf8')
Path('easyeda_scripts/01a_usb_frontend.js').write_text(shared+config+style+body,encoding='utf8')
checkpoint=json.loads(Path('projects/beebox/05_schematic_audit/usb_checkpoint_execution.json').read_text(encoding='utf8')).get('v')
owned=checkpoint['wireIds'] if checkpoint else []
patch="const page=await eda.dmt_Schematic.getCurrentSchematicPageInfo();if(page.uuid!=='d5e34c82cc3ba89c')throw Error('Wrong page');\nconst parts={};for(const c of await eda.sch_PrimitiveComponent.getAll())if(['J1','D6','R6','R7','C21','C22'].includes(c.getState_Designator()))parts[c.getState_Designator()]=c;\nif(Object.keys(parts).length!==6)throw Error('USB inventory mismatch');\nconst wireIds="+json.dumps(owned)+";if(!wireIds.length)throw Error('No owned USB wires recorded');return await styleUsbLabels(parts,wireIds);\n"
Path('easyeda_scripts/01a_improve_usb_labels.js').write_text(style+patch,encoding='utf8')
