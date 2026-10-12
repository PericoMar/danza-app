# Audition schedules are a tree of dated deadlines and audition dates

An audition used to describe its dates with modes (`deadline_mode`: fixed date / ASAP / always open; `audition_schedule_mode`: single date / to be arranged / various dates), a free-text note and a JSONB list, so half the rows had no date and status and filters were guesses. We replaced that with a tree: an audition has 1-N deadlines, each deadline has 1-N audition dates (a range of up to 60 days at one place, in person or online). Every deadline and audition date carries a real date; "ASAP" and "To be arranged" are only display labels on top of it. Status (open call, post-deadline, past) is derived from those dates and nothing else.

## Considered Options

- **Many-to-many between deadlines and audition dates** (e.g. an early-bird and a final deadline for the same date). Rejected: one audition date always has exactly one deadline in practice, and the tree keeps writes and display simple.
- **A sentinel far-future date for ASAP / to be arranged** (e.g. 2099-12-31). Rejected: ASAP calls, the most urgent, would sort last and never expire. Admins enter a realistic estimate and the label says it is not exact.
- **Keeping the modes and adding more of them.** Rejected: every mode needed its own branch in status, sorting and filters, which is how they drifted.

## Consequences

- Rows the modes could not express were migrated with agreed estimates: to be arranged with a fixed deadline → audition date = deadline + 30 days; no date at all → deadline = created + 30 days, audition date = created + 60 days; a month or period in the note → that period. See `supabase/migrations/*_backfill_audition_schedule.sql`.
- A deadline may fall inside its audition dates' range (rolling calls such as "auditions 2 Feb–8 Mar, apply by 8 Mar") but never after it ends.
- "Today" for status is the database's `current_date` (UTC), so an audition can change status a few hours before or after local midnight.
- An audition and everything under it is written only through the `save_audition` RPC, in one transaction, which also enforces "at least one deadline" and "at least one audition date per deadline".
- Rolled out in three phases because the app and its staging branch share the production database: add the new tables and copy the data (old columns untouched), move the app to the new model, then drop the old columns.
