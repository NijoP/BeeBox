import json
from pathlib import Path
src=json.loads(Path('projects/beebox/03_easyeda_init/a0_layout_map.json').read_text())
k=39.3700787
out={'project':src['project'],'page':src['page'],'detected_page':src['detected_page'],'units':'EasyEDA internal units','conversion':src['conversion'],'zones':[]}
for z in src['zones']:
 out['zones'].append({**z,'x':round(z['x_mm']*k),'y':round(z['y_mm']*k),'w':round(z['w_mm']*k),'h':round(z['h_mm']*k)})
Path('projects/beebox/04_schematic/layout_config.json').write_text(json.dumps(out,indent=2),encoding='utf8')
