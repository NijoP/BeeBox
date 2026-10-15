#!/usr/bin/env python3
"""Build BeeBox's fail-closed canonical schematic model from reviewed repository evidence.

This tool does not promote old EasyEDA connectivity to verified truth. Rows copied from
historical readback are explicitly classified PROVISIONAL until a datasheet-reviewed map
exists. Missing UUIDs and support-network values remain null/blocked rather than guessed.
"""
from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIBRARY_UUID = "0819f05c4eef4c71ace90d822a990e87"


def load_json(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def load_csv(path: str):
    with (ROOT / path).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_json(path: str, value):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_csv(path: str, fields, rows):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


component_rows = load_csv("netlist/components.csv")
reviewed_devices = load_json("schematic/verified_device_library.json")
reviewed_pin_maps = load_json("schematic/canonical_physical_pin_maps.json")["components"]
reviewed_passives = load_json("schematic/verified_passive_library.json")
historical = load_json("projects/beebox/05_schematic_audit/physical_pins_before_rootcause.json")["v"]["components"]
observed = load_csv("projects/beebox/05_schematic_audit/observed_pin_contacts.csv")

search_files = [
    "outputs/schematic/readback/library_search_power.json",
    "outputs/schematic/readback/library_search_sensors.json",
    "outputs/schematic/readback/library_search_misc.json",
]
search_records = []
for path in search_files:
    source = ROOT / path
    if source.exists():
        result = load_json(path).get("result", {})
        for records in result.values():
            if isinstance(records, list):
                search_records.extend(records)

# Manufacturer constraints prevent exact-MPN clones from being silently accepted.
manufacturer_tokens = {
    "Texas Instruments": ("TI(",), "Espressif": ("ESPRESSIF",),
    "Sensirion": ("Sensirion",), "TDK": ("TDK",), "TDK InvenSense": ("TDK",),
    "Lite-On": ("LITEON",), "Bourns": ("BOURNS",), "Analog Devices": ("ADI(", "MAXIM"),
}


def exact_candidate(mpn: str, manufacturer: str):
    candidates = [r for r in search_records if r.get("manufacturerId") == mpn]
    tokens = manufacturer_tokens.get(manufacturer)
    if tokens:
        candidates = [r for r in candidates if any(t.lower() in (r.get("manufacturer") or "").lower() for t in tokens)]
    return candidates[0] if len(candidates) == 1 else None


row_by_ref = {row["ref"]: row for row in component_rows if "-" not in row["ref"] or row["ref"] in {"J-SD", "J-RF", "U-IMU"}}
# Exact suffixes already established by reviewed manufacturer/library evidence.
for ref, exact_mpn in {"U7":"SHT45-AD1B-R2", "U8":"SHT45-AD1B-R2", "D5":"TPD4E05U06DQAR"}.items():
    row_by_ref[ref] = {**row_by_ref[ref], "mpn": exact_mpn}
# Q2 is the provisional second TPS22919 needed to create a switched regulated
# +3V3_FPC rail; its system-level isolation policy remains an explicit gate.
row_by_ref["Q2"] = {**row_by_ref["Q1"], "ref":"Q2", "function":"provisional +3V3_FPC load switch",
    "source":"schematic/canonical_physical_pin_maps.json; datasheets/TI_TPS22919.pdf"}
# Explicit expansion avoids hiding distinct electrical components in grouped BOM rows.
for grouped, refs in {
    "R1-R3": ["R1", "R2", "R3"], "R4-R5": ["R4", "R5"], "R6-R7": ["R6", "R7"],
    "C1-C12": [f"C{i}" for i in range(1, 13)], "C13-C17": [f"C{i}" for i in range(13, 18)],
    "C18-C20": [f"C{i}" for i in range(18, 21)], "TP1-TP12": [f"TP{i}" for i in range(1, 13)],
}.items():
    src = next(row for row in component_rows if row["ref"] == grouped)
    for ref in refs:
        row_by_ref.setdefault(ref, {**src, "ref": ref})

historical_by_ref = {item["ref"]: item for item in historical}
manifest = []
for ref, row in sorted(row_by_ref.items()):
    # J3 is handled as twelve individual physical contacts below.
    if ref == "J3":
        continue
    mpn = row["mpn"]
    if ref == "J4":
        mpn = "S2B-PH-SM4-TB(LF)(SN)"
    if ref in reviewed_devices:
        identity = reviewed_devices[ref]
        status = "VERIFIED_LIBRARY_IDENTITY"
    elif ref in reviewed_passives:
        identity = reviewed_passives[ref]
        status = "VERIFIED_LIBRARY_IDENTITY"
    else:
        candidate = exact_candidate(mpn, row["manufacturer"])
        identity = candidate or {}
        status = "LIBRARY_CANDIDATE_PIN_MAP_PENDING" if candidate else "BLOCKED_BY_MISSING_LIBRARY_IDENTITY"
    if row["population"].upper().startswith("DNI"):
        status = "PROVISIONAL_DNI" if not identity else "DNI_LIBRARY_CANDIDATE"
    if ref == "Q2":
        status = "PROVISIONAL_SUPPORT_PART_ARCHITECTURE_GATE"
    old = historical_by_ref.get(ref, {})
    package = identity.get("package") or row.get("package_or_note") or old.get("footprint", {}).get("name")
    manifest.append({
        "reference": ref,
        "function": row["function"],
        "manufacturerPartNumber": mpn,
        "manufacturer": row["manufacturer"],
        "easyedaLibraryUuid": identity.get("libraryUuid"),
        "easyedaDeviceUuid": identity.get("uuid"),
        "symbolUuid": identity.get("symbolUuid"),
        "footprintUuid": identity.get("footprintUuid"),
        "footprintIdentity": package,
        "supplierId": identity.get("supplierId"),
        "population": row["population"],
        "board": row["board"],
        "datasheetReference": row["source"],
        "verificationStatus": status,
        "notes": "Historical capture identity is not accepted as evidence" if old and status.startswith("BLOCKED") else "",
    })

j3_row = next(row for row in component_rows if row["ref"] == "J3")
for contact in range(1, 13):
    manifest.append({
        "reference": f"J3-{contact:02d}", "assemblyReference": "J3", "physicalContact": contact,
        "function": f"Dock physical contact {contact}", "manufacturerPartNumber": "0906-0-15-20-75-14-11-0",
        "manufacturer": "Mill-Max", "easyedaLibraryUuid": None, "easyedaDeviceUuid": None,
        "symbolUuid": None, "footprintUuid": None, "footprintIdentity": "one SMT spring contact",
        "supplierId": None, "population": "Yes", "board": "dock",
        "datasheetReference": j3_row["source"],
        "verificationStatus": "BLOCKED_BY_MISSING_LIBRARY_AND_LAND_PATTERN_EVIDENCE",
        "notes": "One physical spring contact. Twelve records intentionally model the twelve-contact interface.",
    })
manifest.sort(key=lambda x: x["reference"])

write_json("schematic/part_manifest.json", {
    "schemaVersion": 1,
    "releaseStatus": "BLOCKED_NOT_MANUFACTURING_READY",
    "generationSources": ["netlist/components.csv", "schematic/verified_device_library.json", "schematic/verified_passive_library.json", *search_files],
    "parts": manifest,
})

observed_net = {(row["ref"], str(row["physical_pin"])): row["observed_nets"] or None for row in observed}
# Deterministic corrections established by the root-cause audit. These normalize
# known aliases without claiming that the affected component identity is verified.
observed_net.update({
    ("L1", "1"): "BUCK_SW", ("L1", "2"): "+3V3",
    ("R12", "1"): "GND", ("R12", "2"): "CHARGER_ILIM",
    ("R1", "1"): "LED_R", ("R1", "2"): "LED_R_A",
    ("R2", "1"): "LED_G", ("R2", "2"): "LED_G_A",
    ("R3", "1"): "LED_B", ("R3", "2"): "LED_B_A",
    ("D2", "1"): "GND", ("D2", "2"): "LED_R_A",
    ("D3", "1"): "GND", ("D3", "2"): "LED_G_A",
    ("D4", "1"): "GND", ("D4", "2"): "LED_B_A",
})
physical_rows = []
# Reviewed maps supersede historical mappings. Historical pin inventory supplies names only.
for ref, spec in reviewed_pin_maps.items():
    pin_names = {str(p["number"]): p["name"] for p in historical_by_ref.get(ref, {}).get("pins", [])}
    for pin, net in spec["pins"].items():
        physical_rows.append({
            "component_reference": ref, "manufacturer_part_number": spec["mpn"], "physical_pin_number": pin,
            "pin_name": pin_names.get(pin, pin), "canonical_net": net or "",
            "connection_classification": "INTENTIONAL_NC" if net is None else "DATASHEET_RECONCILED",
            "verification_status": "VERIFIED" if ref in reviewed_devices or ref in reviewed_passives else "DATASHEET_REVIEWED_LIBRARY_PENDING",
            "evidence": spec["evidence"],
        })

# Add provisional inventory only when no reviewed map exists; never call old net truth verified.
for item in historical:
    ref = item["ref"]
    if ref in reviewed_pin_maps or ref in {"J3", "J4", "R14", "R15"}:
        continue
    for pin in item["pins"]:
        net = observed_net.get((ref, str(pin["number"])))
        physical_rows.append({
            "component_reference": ref, "manufacturer_part_number": item.get("mpn", ""),
            "physical_pin_number": str(pin["number"]), "pin_name": pin.get("name", ""),
            "canonical_net": net or "", "connection_classification": "HISTORICAL_CAPTURE_ONLY",
            "verification_status": "PROVISIONAL_REQUIRES_DATASHEET_RECONCILIATION",
            "evidence": "projects/beebox/05_schematic_audit/physical_pins_before_rootcause.json and observed_pin_contacts.csv",
        })

dock_nets = ["GND", "GND", "GND", "VDOCK", "VDOCK", "+3V3_FPC", "DOCK_SDA", "DOCK_SCL", "DOCK_BCLK", "DOCK_WS", "DOCK_SD", "DOCK_PRESENT_ID"]
for idx, net in enumerate(dock_nets, 1):
    physical_rows.append({"component_reference": f"J3-{idx:02d}", "manufacturer_part_number": "0906-0-15-20-75-14-11-0",
        "physical_pin_number": "1", "pin_name": f"DOCK_CONTACT_{idx}", "canonical_net": net,
        "connection_classification": "PROVISIONAL_MECHANICAL_INTERFACE", "verification_status": "BLOCKED_BY_MISSING_MANUFACTURER_LAND_PATTERN",
        "evidence": "docs/23_Baseline_Resolution_and_Schematic_Capture_Package.md"})

physical_rows.sort(key=lambda r: (r["component_reference"], r["physical_pin_number"]))
write_csv("schematic/physical_pin_manifest.csv", list(physical_rows[0]), physical_rows)

# Net membership is generated strictly from physical rows and retains row-level status.
members = defaultdict(list)
for row in physical_rows:
    if row["canonical_net"]:
        members[row["canonical_net"]].append(row)
membership_rows = []
for net in sorted(members):
    for row in sorted(members[net], key=lambda r: (r["component_reference"], r["physical_pin_number"])):
        membership_rows.append({"canonical_net": net, "component_reference": row["component_reference"],
            "physical_pin_number": row["physical_pin_number"], "pin_name": row["pin_name"],
            "verification_status": row["verification_status"], "evidence": row["evidence"]})
write_csv("netlist/canonical_net_membership.csv", list(membership_rows[0]), membership_rows)

# Build a physical pin-to-pin graph as a deterministic star per net. This avoids
# logical aliases such as VBUS or GPIO names in fields that claim to be physical pins.
pin_rows = []
for net in sorted(members):
    net_members = sorted(members[net], key=lambda r: (r["component_reference"], r["physical_pin_number"]))
    if len(net_members) < 2:
        only = net_members[0]
        pin_rows.append({"canonical_net": net, "source_ref": only["component_reference"],
            "source_physical_pin": only["physical_pin_number"], "source_pin_name": only["pin_name"],
            "destination_ref": "", "destination_physical_pin": "", "destination_pin_name": "",
            "verification_status": "PROVISIONAL_SINGLE_PIN_NET",
            "evidence": only["evidence"]})
        continue
    anchor = net_members[0]
    for destination in net_members[1:]:
        verified = anchor["verification_status"] == destination["verification_status"] == "VERIFIED"
        pin_rows.append({"canonical_net": net, "source_ref": anchor["component_reference"],
            "source_physical_pin": anchor["physical_pin_number"], "source_pin_name": anchor["pin_name"],
            "destination_ref": destination["component_reference"],
            "destination_physical_pin": destination["physical_pin_number"], "destination_pin_name": destination["pin_name"],
            "verification_status": "VERIFIED" if verified else "PROVISIONAL_REQUIRES_DATASHEET_RECONCILIATION",
            "evidence": f'{anchor["evidence"]}; {destination["evidence"]}'})
write_csv("netlist/canonical_pin_to_pin.csv", list(pin_rows[0]), pin_rows)

print(json.dumps({
    "parts": len(manifest), "physicalPins": len(physical_rows), "netMembershipRows": len(membership_rows),
    "verifiedLibraryParts": sum(p["verificationStatus"] == "VERIFIED_LIBRARY_IDENTITY" for p in manifest),
    "blockedLibraryParts": sum("BLOCKED" in p["verificationStatus"] for p in manifest),
}, indent=2))
