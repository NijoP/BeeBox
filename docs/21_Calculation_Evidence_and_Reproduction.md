# 21 — Calculation Evidence and Reproduction

## Repository calculation assets
| Asset | Purpose |
|---|---|
| [`tools/verify_engineering.py`](../tools/verify_engineering.py) | Power scenarios, charger thermal screening, I²C rise-time table and audio storage calculation |
| [`analysis_outputs/power_budget.csv`](../analysis_outputs/power_budget.csv) | Machine-readable scenario results |
| [`analysis_outputs/charger_screening.csv`](../analysis_outputs/charger_screening.csv) | Approximate linear charger dissipation screening |
| [`analysis_outputs/i2c_rise_time.csv`](../analysis_outputs/i2c_rise_time.csv) | Pull-up/capacitance first-order results |
| [`analysis_outputs/results.json`](../analysis_outputs/results.json) | All inputs and outputs in machine-readable form |

## Reproduction
From the repository root:

```text
python tools/verify_engineering.py
```

The script uses only Python standard-library modules and recreates the CSV/JSON outputs. It prints the complete result object to standard output. A successful run proves only that the equations execute; it does not validate the input assumptions or physical hardware.

## Input provenance
Inputs are located in the `A` dictionary at the top of the script. Each is labelled as an assumption because the exact ESP32-S3 suffix, sensor population, battery, dock geometry, FPC length, storage part, radio expansion and client acceptance limits are not fixed. Replace them with values from dated manufacturer datasheets, client decisions or measured evidence before using the outputs for release.

## Formulae
- `P = V × I`
- `runtime_h = capacity_Ah × usable_fraction × converter_efficiency / average_current_A`
- `charger_screening_loss = (input_voltage − battery_voltage) × charge_current`
- `I²C rise time: tr = 0.8473 × pullup_ohms × bus_capacitance_farads`
- `audio bytes/day = sample_rate × bits/sample × channels × overhead × 86400 / 8`

## Evidence boundaries
The scripts do not model battery voltage sag, regulator control-loop transients, exact thermal resistance, RF duty-cycle statistics, SD write bursts, cable impedance, pogo contact bounce, FPC flex fatigue, sensor self-heating or hive contamination. Those are either addressed as provisional risks or require measurement/fabricator/client inputs. Conclusions and statuses are summarized in [18](18_Mathematical_Engineering_Analysis.md) and [22](22_Pre_Schematic_Correction_and_Readiness_Report.md).