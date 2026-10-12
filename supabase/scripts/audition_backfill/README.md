# Backfill del calendario de audiciones

Generan `supabase/migrations/*_backfill_audition_schedule.sql`, que copia las audiciones
antiguas (modos + JSONB) a `audition_deadlines` / `audition_dates`. Uso único: se borran en
la fase 3 junto con las columnas viejas. Contexto en `docs/adr/0001-audition-schedule-tree.md`.

```sh
# 1. Leer prod con la anon key (auditions y companies son de lectura pública)
set -a && . ./.env && set +a
H=(-H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Range: 0-9999")
curl -sS "${H[@]}" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/auditions?select=id,company_id,deadline_mode,deadline_date,audition_schedule_mode,audition_date,audition_schedule_note,audition_schedule_entries,location,created_at,content_updated_at,is_active,companies!auditions_company_id_fkey(name,location,country,country_iso_code)&order=id" > /tmp/auditions.json
curl -sS "${H[@]}" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/companies?select=country,country_iso_code" > /tmp/companies.json

# 2. Proponer (reglas en el docstring), validar contra las restricciones de la BD y generar el SQL
python3 -I supabase/scripts/audition_backfill/propose.py /tmp/auditions.json /tmp/companies.json /tmp/backfill.csv
python3 -I supabase/scripts/audition_backfill/validate.py /tmp/backfill.csv /tmp/auditions.json /tmp/companies.json
python3 -I supabase/scripts/audition_backfill/to_sql.py /tmp/backfill.csv supabase/migrations/<timestamp>_backfill_audition_schedule.sql
```

Si se crea una audición entre la lectura y el `db push`, la comprobación final de la
migración falla: repetir los pasos y volver a subirla. Una audición *editada* en ese intervalo
no se detecta (se copiaría la versión leída), así que no se editan audiciones desde la lectura
hasta que la app use las tablas nuevas.
