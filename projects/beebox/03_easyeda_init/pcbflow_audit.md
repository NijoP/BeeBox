# PCB Flow integration audit

## Files inspected

- `AGENTS.md`, `CLAUDE.md`
- `workflow/README.md`, phases `01`–`05`
- `agents/schematic-generator.md`, `agents/schematic-auditor.md`
- `automation/easyeda/README.md`, `api_probe.js`, `section_generator.template.js`, `dump_schematic.js`, `bridge.py`, `session.py`
- `automation/browser/recon.py`
- `templates/build_sheet.template.md`, `templates/net_connection.template.md`
- `AUDIT.md`, `VALIDATION.md`, `docs/06_EASYEDA_INTEGRATION.md`

## Reused architecture

BeeBox now follows PCB Flow's phase/project separation under `projects/beebox/`: feasibility, BOM, EasyEDA initialization, schematic source package and audit gate. Root CSV netlists remain the machine-readable export consumed by the project source documents.

## Verified framework issue

The framework template's `placeIC()` currently calls:

```js
eda.sch_PrimitiveComponent.create(part.uuid || part.id, x, y, rot || 0)
```

The installed API reference specifies the first parameter as a library-device object and the fourth parameter as `subPartName`; rotation is the fifth parameter. The template's `wirePins()` also reads direct `primitiveId`, `x`, `y` and pin fields while the documented API exposes getters and `getAllPinsByPrimitiveId()`. This is a reproducible source-level contract mismatch likely to cause the previous component-creation/parameter errors.

BeeBox has not patched upstream PCB Flow or claimed a live fix because the EasyEDA window is not connected. The BeeBox scripts must use a corrected local adapter after the one-time `api_probe.js` result confirms the live build's fields. This keeps the reusable framework unchanged and prevents a speculative upstream patch.

## Test status

The repository's Python test suite could not be run with `pytest` because pytest is not installed in the environment; `unittest discover` found no unittest cases for the selected files. The bridge health/API probe evidence is recorded in `easyeda_scripts/EXECUTION_LOG.md`.
