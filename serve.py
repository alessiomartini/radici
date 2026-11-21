"""Radici: server locale. Serve il sito e salva lo stato delle ripetizioni in state.json.

Uso: python serve.py  ->  http://localhost:8770
Test: python serve.py --test
"""
import json
import os
import sys
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import yaml
from fsrs import Card, Rating, Scheduler

ROOT = Path(__file__).parent
STATE = ROOT / "state.json"
PORT = 8770
# Niente passi di apprendimento in minuti: una sessione al giorno, intervalli in giorni.
SCHEDULER = Scheduler(learning_steps=(), relearning_steps=())


def load_items():
    items = []
    for f in sorted((ROOT / "content").glob("*.yaml")):
        items += yaml.safe_load(f.read_text(encoding="utf-8"))
    ids = [i["id"] for i in items]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        raise ValueError(f"id duplicati: {dup}")
    missing = {p for i in items for p in i.get("prereq", []) if p not in ids}
    if missing:
        raise ValueError(f"prerequisiti inesistenti: {missing}")
    return items


def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {"cards": {}, "log": []}


def save_state(state):
    tmp = STATE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, indent=1, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, STATE)  # atomico: mai un state.json a metà


def review(state, item_id, rating, now=None):
    """Applica un voto (1-4) alla carta e aggiorna lo stato in memoria."""
    now = now or datetime.now(timezone.utc)
    old = state["cards"].get(item_id)
    card = Card.from_dict(old) if old else Card()
    card, log = SCHEDULER.review_card(card, Rating(rating), review_datetime=now)
    state["cards"][item_id] = card.to_dict()
    entry = log.to_dict()
    entry["item"] = item_id
    state["log"].append(entry)
    return state["cards"][item_id]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(ROOT), **k)

    def send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/data":
            try:
                return self.send_json({"items": load_items(), "state": load_state()})
            except Exception as e:  # errore nel contenuto: mostralo nella pagina
                return self.send_json({"error": str(e)}, 500)
        if self.path.startswith(("/state", "/serve", "/.")):
            return self.send_error(404)
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/review":
            return self.send_error(404)
        data = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if data.get("rating") not in (1, 2, 3, 4) or not isinstance(data.get("id"), str):
            return self.send_json({"error": "richiesta non valida"}, 400)
        state = load_state()
        card = review(state, data["id"], data["rating"])
        save_state(state)
        self.send_json(card)


def test():
    s = {"cards": {}, "log": []}
    t0 = datetime(2026, 1, 1, tzinfo=timezone.utc)
    c = review(s, "x", 3, t0)
    due1 = datetime.fromisoformat(c["due"])
    assert due1 > t0, "una carta nuova con 'Bene' va nel futuro"
    c = review(s, "x", 3, due1)
    assert datetime.fromisoformat(c["due"]) - due1 > due1 - t0, "l'intervallo cresce"
    before = c["stability"]
    c = review(s, "x", 1, datetime.fromisoformat(c["due"]))
    assert c["stability"] < before, "'Di nuovo' abbassa la stabilità"
    assert len(s["log"]) == 3 and s["log"][0]["item"] == "x"
    load_items()  # contenuto valido, id unici
    print("ok")


if __name__ == "__main__":
    if "--test" in sys.argv:
        test()
    else:
        print(f"Radici su http://localhost:{PORT}")
        ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
