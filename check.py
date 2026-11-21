"""Controlla il contenuto: YAML valido, id unici, prerequisiti esistenti, file elencati in app.js. Uso: python check.py"""
import re
from pathlib import Path

import yaml

root = Path(__file__).parent
files = sorted(p.as_posix() for p in (root / "content").glob("*.yaml"))
listed = re.findall(r'"(content/[^"]+\.yaml)"', (root / "app.js").read_text(encoding="utf-8"))
assert sorted(Path(f).name for f in listed) == sorted(Path(f).name for f in files), f"CONTENT in app.js non allineato: {listed}"
items = [i for f in files for i in yaml.safe_load(Path(f).read_text(encoding="utf-8"))]
ids = [i["id"] for i in items]
assert len(ids) == len(set(ids)), f"id duplicati: {[i for i in ids if ids.count(i) > 1]}"
missing = {p for i in items for p in i.get("prereq", []) if p not in ids}
assert not missing, f"prerequisiti inesistenti: {missing}"
for i in items:
    assert i["kind"] in {"definizione", "proposizione", "formula", "teorema", "derivazione"}, i["id"]
    assert i.get("prompt") and i.get("answer"), i["id"]
print(f"ok: {len(items)} carte")
