#!/usr/bin/env python3
"""Build data/items.json from the community @wfcd/items dataset.

Usage:
    npm pack @wfcd/items@latest            # downloads wfcd-items-<ver>.tgz
    mkdir -p /tmp/wfcd && tar xzf wfcd-items-*.tgz -C /tmp/wfcd
    python3 tools/build_data.py /tmp/wfcd/package

Reads data/tracker.json for the item / node names to look up and writes
data/items.json with images, mastery XP, parts, relics and resources.
"""
import glob
import json
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_FILES = {"Components.json", "Relics.json", "Node.json", "Enemy.json", "Mods.json",
              "Arcanes.json", "Skins.json", "Glyphs.json", "Sigils.json", "Quests.json"}
MISSION_TYPES = {
    0: "Assassination", 1: "Exterminate", 2: "Survival", 3: "Rescue", 4: "Sabotage",
    5: "Capture", 7: "Spy", 8: "Defense", 9: "Mobile Defense", 13: "Interception",
    14: "Hijack", 15: "Hive", 17: "Excavation", 21: "Infested Salvage", 22: "Arena",
    24: "Pursuit", 25: "Rush", 26: "Assault", 27: "Defection", 28: "Free Roam",
    33: "Disruption",
}
FACTIONS = {0: "Grineer", 1: "Corpus", 2: "Infested", 3: "Orokin", 4: "Crossfire",
            5: "Sentient", 6: "Narmer", 7: "Murmur", 8: "Scaldra", 9: "Techrot"}
NODE_TYPES = {4: "Dark Sector"}
RELIC_RE = re.compile(r"^(Lith|Meso|Neo|Axi|Requiem) (\S+) Relic(?: \((\w+)\))?$")


def rarity_from_intact(chance):
    if chance is None:
        return None
    if chance >= 20:
        return "Common"
    if chance >= 8:
        return "Uncommon"
    return "Rare"


def mastery_xp(item):
    cat, typ = item.get("category"), item.get("type")
    cap = item.get("maxLevelCap") or 30
    frame_like = cat in ("Warframes", "Archwing", "Sentinels", "Pets") or typ in (
        "K-Drive Component", "Necramech")
    per_rank = 200 if frame_like else 100
    return per_rank, per_rank * cap, cap


def main(pkg):
    data_dir = os.path.join(pkg, "data", "json")
    tracker = json.load(open(os.path.join(ROOT, "data", "tracker.json")))

    by_name, by_unique = {}, {}
    for f in sorted(glob.glob(os.path.join(data_dir, "*.json"))):
        base = os.path.basename(f)
        for it in json.load(open(f)):
            if "uniqueName" in it:
                by_unique.setdefault(it["uniqueName"], it)
            if base in SKIP_FILES or "name" not in it:
                continue
            key = it["name"].lower()
            # Prefer masterable entries when names collide
            if key not in by_name or (it.get("masterable") and not by_name[key].get("masterable")):
                by_name[key] = it
    components = {c["uniqueName"]: c for c in json.load(open(os.path.join(data_dir, "Components.json")))}

    # Relic info: market url per reward + which relics are currently in drop tables
    market = {}
    relic_meta = {}
    for r in json.load(open(os.path.join(data_dir, "Relics.json"))):
        if not r["name"].endswith(" Intact"):
            continue
        relic_meta[r["name"][:-len(" Intact")]] = {"vaulted": bool(r.get("vaulted"))}
        for rw in r.get("rewards", []):
            wm = (rw.get("item") or {}).get("warframeMarket")
            if wm:
                market[rw["item"]["uniqueName"]] = wm["urlName"]

    out = {"generated": date.today().isoformat(), "items": {}, "nodes": {}}

    for entry in tracker["items"]:
        it = by_name.get(entry["name"].lower())
        if not it:
            print("WARN: not found:", entry["name"], file=sys.stderr)
            continue
        per_rank, total, cap = mastery_xp(it)
        rec = {
            "name": it["name"],
            "category": it.get("category"),
            "type": it.get("type"),
            "description": it.get("description", ""),
            "masteryReq": it.get("masteryReq", 0),
            "image": it.get("imageName"),
            "wikiImage": it.get("wikiaThumbnail"),
            "wiki": it.get("wikiaUrl") or "https://wiki.warframe.com/w/" + it["name"].replace(" ", "_"),
            "isPrime": bool(it.get("isPrime")) or it["name"].endswith(" Prime"),
            "vaulted": bool(it.get("vaulted")),
            "releaseDate": it.get("releaseDate"),
            "maxRank": cap,
            "xpPerRank": per_rank,
            "masteryXP": total,
            "buildPrice": it.get("buildPrice"),
            "buildTime": it.get("buildTime"),
            "marketCost": it.get("marketCost"),
            "parts": [],
            "resources": [],
            "requiresItems": [],
        }
        for comp in it.get("components") or []:
            uid, count = comp["uniqueName"], comp.get("itemCount", 1)
            c = components.get(uid)
            ref = by_unique.get(uid, {})
            if c is None or uid.startswith("/Lotus/Weapons/") or uid.startswith("/Lotus/Powersuits/"):
                name = (c or ref).get("name", uid.rsplit("/", 1)[-1])
                if uid.startswith(("/Lotus/Weapons/", "/Lotus/Powersuits/")):
                    existing = next((r for r in rec["requiresItems"] if r["name"] == name), None)
                    if existing:
                        existing["count"] += count
                    else:
                        rec["requiresItems"].append({"name": name, "count": count})
                    continue
                rec["resources"].append({"name": name, "count": count, "image": ref.get("imageName")})
                continue
            drops = c.get("drops") or []
            is_part = c.get("name") in ("Blueprint",) or "Recipes" in uid or "WeaponParts" in uid
            if not is_part:
                rec["resources"].append({"name": c.get("name"), "count": count, "image": c.get("imageName")})
                continue
            relics, other = {}, {}
            for d in drops:
                m = RELIC_RE.match(d.get("location", ""))
                if m:
                    relic = f"{m.group(1)} {m.group(2)}"
                    ref_level = m.group(3) or "Intact"
                    r = relics.setdefault(relic, {"relic": relic, "tier": m.group(1), "chances": {}})
                    r["chances"][ref_level] = d.get("chance")
                else:
                    loc = re.sub(r", Rotation \w$", "", d.get("location", ""))
                    o = other.setdefault(loc, {"location": loc, "chance": 0, "rarity": d.get("rarity")})
                    o["chance"] = max(o["chance"], d.get("chance") or 0)
            relic_list = []
            for r in relics.values():
                r["rarity"] = rarity_from_intact(r["chances"].get("Intact"))
                r["vaulted"] = relic_meta.get(r["relic"], {}).get("vaulted")
                relic_list.append(r)
            order = {"Lith": 0, "Meso": 1, "Neo": 2, "Axi": 3, "Requiem": 4}
            relic_list.sort(key=lambda r: (order.get(r["tier"], 9), r["relic"]))
            # Same part listed twice (e.g. two drop tables) -> merge
            existing = next((p for p in rec["parts"] if p["name"] == c.get("name")), None)
            if existing:
                existing["count"] = max(existing["count"], count)
                continue
            rec["parts"].append({
                "name": c.get("name"),
                "count": count,
                "ducats": c.get("ducats"),
                "tradable": c.get("tradable"),
                "market": market.get(uid),
                "relics": relic_list,
                "otherDrops": sorted(other.values(), key=lambda o: -o["chance"])[:6],
            })
        order = {"Blueprint": 0}
        rec["parts"].sort(key=lambda p: (order.get(p["name"], 1), p["name"]))
        out["items"][it["name"]] = rec

    nodes = json.load(open(os.path.join(data_dir, "Node.json")))
    for entry in tracker["nodes"]:
        n = next((x for x in nodes if x["name"] == entry["name"] and x["systemName"] == entry["planet"]), None)
        if not n:
            print("WARN: node not found:", entry, file=sys.stderr)
            continue
        out["nodes"][f'{entry["name"]} ({entry["planet"]})'] = {
            "name": n["name"],
            "planet": n["systemName"],
            "mission": MISSION_TYPES.get(n.get("missionIndex"), "Mission"),
            "faction": FACTIONS.get(n.get("factionIndex"), ""),
            "levels": f'{n.get("minEnemyLevel")}-{n.get("maxEnemyLevel")}',
            "darkSector": NODE_TYPES.get(n.get("nodeType")) == "Dark Sector",
        }

    with open(os.path.join(ROOT, "data", "items.json"), "w") as fh:
        json.dump(out, fh, indent=1, ensure_ascii=False)
    print(f'wrote {len(out["items"])} items, {len(out["nodes"])} nodes')


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/wfcd/package")
