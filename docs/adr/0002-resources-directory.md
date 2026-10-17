# Resources are one table, and what each type is asked for is data

The directory lists eight kinds of resource (dance school, freelance teacher, photographer, physiotherapist, movement studio, personal trainer, nutritionist, general wellbeing). They share most of what they publish (name, country, region, contact, description, logo, gallery) and each has a handful of fields of its own, several of which repeat across types (year founded, founder, professional experience, relation to dance). We model all of them in one `resources` table with those shared custom fields as real columns, and we keep *which fields a type is asked for, in which onboarding step, and which it needs to go public* in a table, `resource_type_fields`. One function, `resource_field_state()`, reads that table and answers "is this field answered?", and everything else — the form, the check at publish time, the completeness percentage and where the onboarding resumes — is derived from it. Placement in the directory is derived from the region scope and never stored.

## Considered Options

- **A JSONB `details` column per type.** Rejected: the custom fields are filtered, sorted and displayed, several are shared by four or five types, and a mistyped key stays invisible until it reaches a screen.
- **One table per type.** Rejected: eight near-identical children for a handful of columns, and the main directory screen reads every type at once, so every read becomes a union.
- **Shared columns, but the per-type rules in TypeScript.** Rejected: the same rules are needed by the onboarding form, the publish check, the progress bar and the resume point. Four copies of "a photographer needs three photos" is four chances to disagree.
- **`owner_user_id` with no UNIQUE, so an account could hold several resources.** Rejected: a professional's resource *is* their profile, so it is one account, one resource. `users` keeps the sign-in; nothing about a professional is duplicated there.
- **Letting professionals publish themselves.** Rejected for now: the directory's value is that it is curated. A professional reaches `pending_review` and an admin publishes.

## Consequences

- Almost every column is NULLable and nothing at all is required to save, because the onboarding stores what it has at each step. Requirements are per type and only checked when a resource stops being a draft, by a deferred constraint trigger — so one save can fill the last missing field and send it for review in any order.
- Placement is `fixed` (one region) → `multiple` (two or three) → `nationwide` (none), derived from `region_scope`. Nobody can take a better position without accepting the rules of that scope, because there is no column to write.
- A nationwide resource shows up in every region of its country through `resource_region_placements`, which is what lets the directory screen be one join and one `order by` instead of two queries stitched client-side.
- Moving a resource from one country to another clears its regions and its scope: a region belongs to a country. Setting the country for the first time is not a move.
- Copy lives in TypeScript; the database only says what is asked and in what order. Fixing a typo should never be a migration.
- Adding a type means inserting rows in `resource_type_fields` and writing its copy. Adding a *field* also means teaching `resource_field_state()` how to tell whether it is answered; a field it does not know counts as unanswered, so the mistake blocks publishing loudly instead of passing silently.
- These are the first tables in the project written by people who are not admins: RLS keys on `user_id` rather than `is_admin()`, and `resources_guard()` keeps publishing, verifying, changing hands and the slug out of the client's reach.
- Regions are a curated table (`regions`), seeded only for countries that already have a company, because a country nobody is in does not need them yet. A country with no regions still works: its resources can only be nationwide until we add them.
