"""Genera el CSV de relleno de la migración de audiciones (fuente del backfill de PR1).

Uso: python3 -I propose.py <auditions_raw.json> <countries_raw.json> <out.csv>
Una fila por audition_date. Reglas acordadas con el usuario el 2026-10-12 (Q37-Q41):
- Q37 single/various/varias ciudades: se migran tal cual lo extraído del texto.
- Q38 TBA con deadline fija y sin pista de fecha: audición = deadline + 30 días.
- Q39 sin ninguna fecha (ASAP/always open + TBA): deadline = creación + 30, audición = creación + 60.
- Q40 mes/periodo en la nota: se respeta; si supera 60 días se quedan los últimos 60.
- Q41 fecha que termina antes de la deadline fija: deadline propia = su fecha de inicio.
"""
import calendar
import csv
import datetime as dt
import json
import re
import sys

MAX_SPAN_DAYS = 59  # end - start <= 59  => 60 días

auditions = json.load(open(sys.argv[1]))
companies = json.load(open(sys.argv[2]))
KNOWN_ISO = {c["country_iso_code"]: c["country"] for c in companies}

MONTHS = {m.lower(): i for i, m in enumerate(calendar.month_name) if m}
MONTHS.update({m.lower(): i for i, m in enumerate(calendar.month_abbr) if m})

# Alias de país / ciudad -> ISO. Solo lo que aparece en los datos.
COUNTRY_ALIASES = {name.lower(): iso for iso, name in KNOWN_ISO.items()}
COUNTRY_ALIASES.update({
    "usa": "US", "us": "US", "united states": "US", "nyc": "US",
    "uk": "GB-ENG", "united kingdom": "GB-ENG", "england": "GB-ENG", "engalnd": "GB-ENG",
    "south korea": "KR", "korea": "KR", "thailand": "TH", "czechia": "CZ", "peru": "PE",
})
CITY_ISO = {
    "amsterdam": "NL", "paris": "FR", "berlin": "DE", "milan": "IT", "milano": "IT",
    "rome": "IT", "copenhagen": "DK", "munich": "DE", "zürich": "CH", "zurich": "CH",
    "budapest": "HU", "monte carlo": "MC", "tokyo": "JP", "hong kong": "HK",
    "new york": "US", "san francisco": "US", "washington": "US", "miami": "US",
    "phoenix": "US", "toronto": "CA", "calgary": "CA", "vancouver": "CA",
    "barcelona": "ES", "johannesburg": "ZA", "cape town": "ZA", "sydney": "AU",
    "brisbane": "AU", "bangkok": "TH", "auckland": "NZ", "wellington": "NZ",
    "leeds": "GB-ENG", "london": "GB-ENG", "birmingham": "GB-ENG", "bradford": "GB-ENG",
    "newcastle": "GB-ENG", "bath": "GB-ENG", "antwerp": "BE", "beer sheva": "IL",
    "ljubljana": "SI", "helsinki": "FI",
}

ONLINE_RE = re.compile(r"\b(video audition|online|virtual)\b", re.I)
TIME_RE = re.compile(r"\d{1,2}[:.]\d{2}|\b[ap]\.?m\.?\b", re.I)
NOTE_ONLY_RE = re.compile(r"^(men|women|woman|female|male|class audition|first round|second round)$", re.I)
# "(two day audition 13 & 14)" | "Two day audition (10 & 11-01-2027)" | "2 day audition - Berlin"
N_DAY_RE = re.compile(
    r"\((two|2|three|3)[ -]day audition[^)]*\)"
    r"|^(two|2|three|3)[ -]day audition\s*(?:\([^)]*\)|\d+\s*&\s*\d+)?\s*[-–]?\s*",
    re.I,
)
MULTI_PLACE_RE = re.compile(r"&|\band\b|;|\+|\btour", re.I)


def d(s):
    return dt.date.fromisoformat(s) if s else None


def month_range(year, month):
    return dt.date(year, month, 1), dt.date(year, month, calendar.monthrange(year, month)[1])


def next_month_occurrence(month, ref):
    year = ref.year if month >= ref.month else ref.year + 1
    return month_range(year, month)


def detect_iso(text):
    t = (text or "").lower()
    for alias, iso in sorted(COUNTRY_ALIASES.items(), key=lambda kv: -len(kv[0])):
        if re.search(rf"(?<![\w]){re.escape(alias)}(?![\w])", t):
            return iso
    for city, iso in CITY_ISO.items():
        if city in t:
            return iso
    return None


def clean_place(text):
    t = re.sub(r"\s*,\s*", ", ", text.strip())
    t = re.sub(r"\s+-\s+", ", ", t)
    return t.strip(" ,-–")


def clean_tba_label(note):
    t = (note or "").strip().replace("arragend", "arranged")
    return t[:1].upper() + t[1:] if t else "To be arranged"


def new_date(start, end=None, place="", iso="", fmt="in_person", date_label="", notes=""):
    return {"start": start, "end": end or start, "place": place, "iso": iso, "format": fmt,
            "date_label": date_label, "notes": notes}


def parse_entry(entry, audition, reasons):
    """Una entrada de various_dates -> propuesta de audition_date."""
    company_iso = audition["companies"]["country_iso_code"]
    raw_date, label = entry.get("date") or "", (entry.get("label") or "").strip()
    notes = (entry.get("extra_info") or "").strip()
    date_label = ""
    try:
        start = d(raw_date)
        end = start
    except ValueError:
        m = re.match(r"(\d{4})-(\d{2})", raw_date)
        start, end = month_range(int(m.group(1)), int(m.group(2)))
        date_label = f"{calendar.month_name[start.month]} {start.year}"
        reasons.add(f"Q37 fecha inválida en origen ({raw_date}): mes entero")
        label = re.sub(r"\(no day specified\)", "", label, flags=re.I).strip()

    m = N_DAY_RE.search(label)
    if m:
        n = 2 if (m.group(1) or m.group(2)).lower() in ("two", "2") else 3
        end = start + dt.timedelta(days=n - 1)
        label = N_DAY_RE.sub("", label).strip(" ,-–()")
    m = re.search(r"([A-Za-z]{3,9}) (\d{1,2})\s*[–-]\s*(\d{1,2}), (\d{4}),?\s*(.*)", label)
    if m and m.group(1).lower() in MONTHS:  # "Nov 17–20, 2026, across 4 rounds"
        end = dt.date(int(m.group(4)), MONTHS[m.group(1).lower()], int(m.group(3)))
        notes, label = m.group(5).strip(), ""
    m = re.search(r"to be arranged between ([A-Za-z]+) (\d{1,2}) and (\d{1,2})", label, re.I)
    if m:
        end = dt.date(start.year, MONTHS[m.group(1).lower()], int(m.group(3)))
        date_label, label = label, ""

    if not label:
        return new_date(start, end, audition["location"], detect_iso(audition["location"]) or company_iso,
                        date_label=date_label, notes=notes)
    if ONLINE_RE.search(label):
        return new_date(start, end, "Online", "", "online", date_label, notes)
    if TIME_RE.search(label) or NOTE_ONLY_RE.match(label):
        return new_date(start, end, audition["location"], detect_iso(audition["location"]) or company_iso,
                        date_label=date_label, notes=label if not notes else f"{label} · {notes}")
    place = clean_place(label.split(":")[0] if ":" in label else label)
    venue = label.split(":", 1)[1].strip() if ":" in label else ""
    if venue:
        place = f"{venue}, {place}"
    return new_date(start, end, place, detect_iso(label) or company_iso, date_label=date_label, notes=notes)


def merge_consecutive(dates):
    """Une días consecutivos con el mismo sitio, formato y textos en un solo rango."""
    out = []
    for x in sorted(dates, key=lambda x: (x["start"], x["place"])):
        key = (x["place"].lower(), x["format"], x["date_label"], x["notes"])
        prev = out[-1] if out else None
        if prev and prev["_key"] == key and x["start"] == prev["end"] + dt.timedelta(days=1):
            prev["end"] = x["end"]
            prev["_merged"] = True
        else:
            out.append({**x, "_key": key})
    return out


def tba_window(note, ref):
    """Ventana estimada a partir de la nota TBA. Devuelve (start, end, motivo)."""
    n = note or ""
    m = re.search(r"(\d{1,2}) ([A-Za-z]+) (\d{4}) - (\d{1,2}) ([A-Za-z]+) (\d{4})", n)
    if m:
        s = dt.date(int(m.group(3)), MONTHS[m.group(2).lower()], int(m.group(1)))
        e = dt.date(int(m.group(6)), MONTHS[m.group(5).lower()], int(m.group(4)))
        return s, e, "rango sacado de la nota"
    m = re.search(r"from ([A-Za-z]+) (\d{1,2})\w* to ([A-Za-z]+) (\d{1,2})", n, re.I)
    if m:
        s = dt.date(ref.year, MONTHS[m.group(1).lower()], int(m.group(2)))
        e = dt.date(ref.year, MONTHS[m.group(3).lower()], int(m.group(4)))
        if e < ref - dt.timedelta(days=60):
            s, e = s.replace(year=s.year + 1), e.replace(year=e.year + 1)
        return s, e, "rango sacado de la nota"
    m = re.search(r"\(([A-Za-z]+) to ([A-Za-z]+)\)", n)
    if m and m.group(1).lower() in MONTHS and m.group(2).lower() in MONTHS:
        s, _ = next_month_occurrence(MONTHS[m.group(1).lower()], ref)
        _, e = month_range(s.year if MONTHS[m.group(2).lower()] >= s.month else s.year + 1, MONTHS[m.group(2).lower()])
        return s, e, "rango de meses sacado de la nota"
    m = re.search(r"\(([A-Za-z]+)(?: (\d{4}))?\)", n)
    if m and m.group(1).lower() in MONTHS:
        month = MONTHS[m.group(1).lower()]
        s, e = month_range(int(m.group(2)), month) if m.group(2) else next_month_occurrence(month, ref)
        return s, e, "mes sacado de la nota: propuesto el mes entero"
    return None


rows = []
for a in auditions:
    c = a["companies"]
    reasons = set()
    company_iso = c["country_iso_code"]
    loc = (a["location"] or "").strip()
    dl_mode, sched = a["deadline_mode"], a["audition_schedule_mode"]
    created = d(a["created_at"][:10])
    deadline = d(a["deadline_date"])
    open_label = {"asap": "ASAP", "always_open": "Always open"}.get(dl_mode, "")
    open_deadline = None

    countries_in_loc = {detect_iso(part) for part in re.split(r",|\(|\)", loc)} - {None}
    if MULTI_PLACE_RE.search(loc) or len(countries_in_loc) >= 2:
        if sched != "various_dates":
            reasons.add("Q37 location de varias ciudades, texto tal cual")

    # ---- fechas de audición propuestas
    if sched == "single_date":
        ad = d(a["audition_date"])
        iso = detect_iso(loc) or company_iso
        fmt = "online" if ONLINE_RE.search(loc) else "in_person"
        dates = [new_date(ad, ad, "Online" if fmt == "online" else loc, "" if fmt == "online" else iso, fmt)]
    elif sched == "various_dates":
        reasons.add("Q37 varias fechas extraídas del texto")
        dates = merge_consecutive([parse_entry(e, a, reasons) for e in a["audition_schedule_entries"] or []])
        if any(x.get("_merged") for x in dates):
            reasons.add("Q37 días consecutivos fusionados")
    else:  # to_be_arranged
        note = a["audition_schedule_note"] or ""
        ref = deadline or created
        win = tba_window(note, ref)
        if win:
            s, e, why = win
            reasons.add(f"Q40 {why}")
            if e - s > dt.timedelta(days=MAX_SPAN_DAYS):
                s = e - dt.timedelta(days=MAX_SPAN_DAYS)
                reasons.add("Q40 periodo > 60 días: últimos 60")
        elif deadline:
            s = e = deadline + dt.timedelta(days=30)
            reasons.add("Q38 TBA: audición = deadline + 30")
        else:
            s = e = created + dt.timedelta(days=60)
            open_deadline = created + dt.timedelta(days=30)
            reasons.add("Q39 sin fechas: deadline = creación + 30, audición = creación + 60")
        if re.search(r"video audition", note, re.I):
            fmt, place, iso = "online", "Online", ""
        else:
            fmt, place, iso = "in_person", loc, detect_iso(loc) or company_iso
            if ONLINE_RE.search(note):
                reasons.add("Q37 nota menciona online, una sola fila presencial")
        dates = [new_date(s, e, place, iso, fmt, clean_tba_label(note))]

    # ---- deadlines: fija -> una para todas; ASAP / always open -> una por fecha
    dates.sort(key=lambda x: x["start"])
    for i, x in enumerate(dates):
        if open_label:
            x["deadline_key"], x["deadline_label"] = f"D{i + 1}", open_label
            x["deadline_date"] = open_deadline or x["start"]
        else:
            x["deadline_key"], x["deadline_date"], x["deadline_label"] = "D1", deadline, ""
    if not open_label:  # Q41: lo que acaba antes de la deadline fija lleva deadline propia
        early = [x for x in dates if x["end"] < deadline]
        for i, x in enumerate(early):
            x["deadline_key"], x["deadline_date"] = f"D{i + 2}", x["start"]
        if early:
            reasons.add("Q41 fecha anterior a la deadline: deadline propia")
    # claves D1, D2… en orden cronológico de deadline
    order = sorted({(x["deadline_date"], x["deadline_key"]) for x in dates})
    renamed = {key: f"D{i + 1}" for i, (_, key) in enumerate(order)}
    for x in dates:
        x["deadline_key"] = renamed[x["deadline_key"]]


    for x in dates:
        rows.append({
            "audition_id": a["id"],
            "company": c["name"],
            "rule": "; ".join(sorted(reasons)) or "directa",
            "deadline_key": x["deadline_key"],
            "deadline_date": x["deadline_date"].isoformat(),
            "deadline_date_label": x["deadline_label"],
            "deadline_notes": "",
            "start_date": x["start"].isoformat(),
            "end_date": x["end"].isoformat(),
            "format": x["format"],
            "place": x["place"],
            "country_iso_code": x["iso"],
            "date_label": x["date_label"],
            "notes": x["notes"],
            "schedule_label": "",
        })

rows.sort(key=lambda r: (r["company"].lower(), r["audition_id"], r["start_date"], r["deadline_key"]))

with open(sys.argv[3], "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)

print(f"rows={len(rows)} auditions={len({r['audition_id'] for r in rows})}")
