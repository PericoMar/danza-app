"""Comprueba el CSV de relleno contra las restricciones acordadas para la BD.

Uso: python3 -I validate.py <auditions_backfill.csv> <auditions_raw.json> <countries_raw.json>
Sale con código 1 si hay algún error.
"""
import collections
import csv
import datetime as dt
import json
import re
import sys

MAX_SPAN_DAYS = 59
FORMATS = {"in_person", "online"}
ISO_RE = re.compile(r"^[A-Z]{2}(-[A-Z]{3})?$")

rows = list(csv.DictReader(open(sys.argv[1])))
raw_ids = {a["id"] for a in json.load(open(sys.argv[2]))}
known_iso = {c["country_iso_code"] for c in json.load(open(sys.argv[3]))}

errors = []


def err(r, msg):
    errors.append(f"{r['company']} ({r['audition_id'][:8]}): {msg}")


deadlines = collections.defaultdict(set)
schedule_labels = collections.defaultdict(set)
new_codes = set()

for r in rows:
    try:
        start, end = dt.date.fromisoformat(r["start_date"]), dt.date.fromisoformat(r["end_date"])
        deadline = dt.date.fromisoformat(r["deadline_date"])
    except ValueError as e:
        err(r, f"fecha inválida: {e}")
        continue
    if end < start:
        err(r, "end_date < start_date")
    if (end - start).days > MAX_SPAN_DAYS:
        err(r, f"rango de {(end - start).days + 1} días > 60")
    if deadline > end:
        err(r, f"deadline {deadline} posterior al fin {end}")
    if r["format"] not in FORMATS:
        err(r, f"format desconocido {r['format']!r}")
    iso = r["country_iso_code"]
    if r["format"] == "in_person" and not iso:
        err(r, "presencial sin país")
    if r["format"] == "online" and iso:
        err(r, "online con país")
    if iso and not ISO_RE.match(iso):
        err(r, f"código de país mal formado {iso!r}")
    if iso and iso not in known_iso:
        new_codes.add(iso)
    if not r["place"].strip():
        err(r, "place vacío")
    for col in ("deadline_date_label", "deadline_notes", "date_label", "notes", "schedule_label"):
        if r[col] and not r[col].strip():
            err(r, f"{col} solo con espacios")
    deadlines[(r["audition_id"], r["deadline_key"])].add(
        (r["deadline_date"], r["deadline_date_label"], r["deadline_notes"]))
    schedule_labels[r["audition_id"]].add(r["schedule_label"])

for (aid, key), values in deadlines.items():
    if len(values) > 1:
        errors.append(f"{aid[:8]} {key}: la deadline tiene valores distintos en sus filas {values}")
for aid, values in schedule_labels.items():
    if len(values) > 1:
        errors.append(f"{aid[:8]}: schedule_label distinto entre filas {values}")

csv_ids = {r["audition_id"] for r in rows}
for missing in raw_ids - csv_ids:
    errors.append(f"audición {missing} no está en el CSV")
for unknown in csv_ids - raw_ids:
    errors.append(f"audición {unknown} del CSV no existe en prod")

print(f"filas={len(rows)} audiciones={len(csv_ids)}/{len(raw_ids)} deadlines={len(deadlines)}")
print(f"códigos de país nuevos (deben estar en la semilla ISO completa): {sorted(new_codes) or 'ninguno'}")
print("\n".join(errors) if errors else "OK: ninguna fila incumple las restricciones")
sys.exit(1 if errors else 0)
