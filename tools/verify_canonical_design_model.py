#!/usr/bin/env python3
"""Regression checks for high-risk BeeBox canonical-model corrections."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
load = lambda p: json.loads((ROOT / p).read_text(encoding="utf-8"))
with (ROOT / "schematic/physical_pin_manifest.csv").open(encoding="utf-8", newline="") as f:
    pins = list(csv.DictReader(f))
with (ROOT / "netlist/canonical_net_membership.csv").open(encoding="utf-8", newline="") as f:
    membership = list(csv.DictReader(f))
parts = load("schematic/part_manifest.json")["parts"]
passives = load("schematic/verified_passive_library.json")
layout = load("schematic/section_layout.json")

pin = {(r["component_reference"], r["physical_pin_number"]): r for r in pins}
part = {r["reference"]: r for r in parts}

assert pin[("D6", "2")]["canonical_net"] == "GND"
assert pin[("D6", "5")]["canonical_net"] == "VBUS_USB"
assert pin[("D6", "1")]["canonical_net"] == "USB_D_P_CONN"
assert pin[("D6", "6")]["canonical_net"] == "USB_D_P"
assert pin[("D6", "3")]["canonical_net"] == "USB_D_N_CONN"
assert pin[("D6", "4")]["canonical_net"] == "USB_D_N"
assert pin[("J1", "A5")]["canonical_net"] == "USB_CC1"
assert pin[("J1", "B5")]["canonical_net"] == "USB_CC2"
assert pin[("J1", "A8")]["connection_classification"] == "INTENTIONAL_NC"
assert pin[("J1", "B8")]["connection_classification"] == "INTENTIONAL_NC"
assert passives["R6"]["mpn"] == passives["R7"]["mpn"] == "0603WAF5101T5E"
assert passives["C21"]["value"] == "4.7uF" and passives["C21"]["mpn"] == "CL21B475KOFNNNE"
assert passives["C22"]["value"] == "10nF" and passives["C22"]["mpn"] == "CL10B103KB8NNNC"
assert part["U3"]["manufacturerPartNumber"] == "TPS62161DSGR"  # fixed 3.3 V variant
assert pin[("U3", "5")]["canonical_net"] == "GND"  # FB on fixed-output variant
assert "R14" not in part and "R15" not in part
assert pin[("U4", "3")]["canonical_net"] == "I2C_MUX_RESET"
assert part["U7"]["manufacturerPartNumber"] == part["U8"]["manufacturerPartNumber"] == "SHT45-AD1B-R2"
assert part["D5"]["manufacturerPartNumber"] == "TPD4E05U06DQAR"
assert part["Q2"]["manufacturerPartNumber"] == "TPS22919DCKR" and part["Q2"]["verificationStatus"] == "PROVISIONAL_SUPPORT_PART_ARCHITECTURE_GATE"
assert [(r["physical_pin_number"], r["canonical_net"]) for r in pins if r["component_reference"] == "J4" and r["canonical_net"]] == [("1", "VBAT"), ("2", "GND")]
assert pin[("J4", "3")]["connection_classification"] == pin[("J4", "4")]["connection_classification"] == "INTENTIONAL_NC"
j3 = [r for r in parts if r.get("assemblyReference") == "J3"]
assert len(j3) == 12 and len({r["reference"] for r in j3}) == 12
assert all(r["manufacturerPartNumber"] == "0906-0-15-20-75-14-11-0" for r in j3)
assert part["D4"]["manufacturerPartNumber"] == "LTST-C193KBKT-5A"
assert part["D4"]["easyedaDeviceUuid"] is None and "BLOCKED" in part["D4"]["verificationStatus"]
main = layout["mainController"]
assert main["pageSize"] == "A0 landscape" and abs(main["width"] - 4681.102362204724) < 1e-9
assert layout["universalSensorFpc"]["currentPageUuid"] is None
for record in parts:
    for key in ("reference", "function", "manufacturerPartNumber", "manufacturer", "footprintIdentity", "population", "datasheetReference", "verificationStatus"):
        assert key in record, (record.get("reference"), key)
for forbidden in ("USB_DP_CONN", "USB_DN_CONN", "VFPC", "SW"):
    assert not any(r["canonical_net"] == forbidden for r in membership), forbidden
print(json.dumps({"status":"PASS","parts":len(parts),"physicalPins":len(pins),"membershipRows":len(membership),"highRiskAssertions":29}, indent=2))
