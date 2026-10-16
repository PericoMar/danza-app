# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Danza-app is a platform for discovering dance companies, exploring auditions, and sharing reviews. Built with Expo (React Native + Web), it targets dancers and professionals seeking centralized audition information.

## Architecture

### Tech Stack
- **Expo SDK 52** with expo-router for file-based routing
- **TypeScript** with strict mode
- **Supabase** for PostgreSQL database, authentication, and real-time subscriptions
- **TanStack React Query** for server state management
- **React Native Paper** (MD3DarkTheme) for UI components
- **OpenAI** for AI-generated review summaries (via SSE streaming)

### Provider Stack (app/_layout.tsx)
The app wraps components in this order:
1. `AuthProvider` - Supabase auth session management
2. `QueryClientProvider` - React Query (recreated per session)
3. `RoleProvider` - Admin role detection via RPC + real-time subscription
4. `PaperProvider` - React Native Paper theming

The entire provider tree remounts on session change using `key={sessionKey}` to prevent stale cache.

### Platform-Specific Code
Uses TypeScript `moduleSuffixes: [".web", ".native", ""]` for platform variants:
- `supabase.web.ts` - Browser localStorage persistence
- `supabase.native.ts` - AsyncStorage persistence

### Import Alias
Use `@/` for absolute imports from project root (configured in tsconfig.json).

## Environment Variables

Required in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Server-only, used by the functions under api/
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
BEEHIIV_API_KEY=
BEEHIIV_PUBLICATION_ID=
```

`EXPO_PUBLIC_*` variables are exposed to the client. Everything else is server-only
and must never be imported from `app/`, `components/`, `hooks/` or `services/` —
those run in the browser and on device. Without the `BEEHIIV_*` pair the newsletter
endpoints still record consent in Supabase but subscribe nobody, which is the
intended behaviour for local development.

## Key Implementation Notes

- Auth redirects handled by `AuthNavigator` component watching session state
- Public routes defined in `isPublicRoute()` function in root layout
- Admin detection uses Supabase RPC `is_admin` with fallback to direct table query
- AI summary uses SSE streaming with manual parsing (not EventSource)
- An audition's schedule is a tree: 1-N deadlines, each with 1-N audition dates (a range of up to 60 days at one place). Labels like "ASAP" only replace a real date on display. Read it from the `auditions_enriched` view and write it only through the `save_audition` RPC. Terms in `GLOSSARY.md`, rationale in `docs/adr/0001-audition-schedule-tree.md`

## Code Quality Standards

These rules are non-negotiable for any code Claude writes or edits in this repo. When a change conflicts with an existing pattern, prefer fixing the pattern over copying it. Directory layout, exact commands, and the live database schema are not documented here — they drift too fast to stay trustworthy. Discover them from `package.json`, the current folder tree, and `supabase/migrations` (or the Supabase dashboard) instead of relying on a snapshot in this file.

### SOLID Principles

- **Single Responsibility**: A component renders UI; a hook manages state/data-fetching; a service talks to Supabase/OpenAI. Never mix fetching logic and JSX in the same function beyond calling a hook. If a component file grows multiple concerns (e.g. form validation + submission + analytics), split it.
- **Open/Closed**: Extend behavior through props, composition, and variants — not by adding `if (specialCase)` branches inside shared components (`Card`, `IconButton`, `CompanyCard`). New use cases should be satisfied by passing new props/children, not editing the component's internals for every caller.
- **Liskov Substitution**: Any component that has multiple "variants" (e.g. in-person vs online audition dates, review content sections) must expose the same prop contract per variant so callers can swap one for another without special-casing. Don't let one variant silently accept different prop shapes.
- **Interface Segregation**: Keep component prop types and hook return types narrow. Don't force a component to accept a giant `CompanyEnriched` object when it only needs `name` and `logoUrl` — destructure at the call site or accept a minimal slice type.
- **Dependency Inversion**: UI components must depend on `hooks/` and `services/` abstractions, never call `supabase` or `fetch` directly. This keeps `supabase.web.ts` / `supabase.native.ts` swappable and keeps components testable.

### DRY — Don't Repeat Code

- Before writing new logic, search `hooks/`, `services/`, `utils/`, and `components/common` for an existing implementation. Reuse or extend it instead of re-implementing.
- Any logic duplicated in two or more places (data fetching, formatting, validation, Supabase queries) must be extracted into a shared hook, service function, or util.
- Shared UI patterns (cards, chips, modals, form fields) belong in `components/common` or `components/ui`, not re-created per screen.
- Prefer composing existing components over copy-pasting and tweaking one.

### No Magic Strings — Constants & Enums

- Never hardcode repeated string/number literals inline (table names, storage keys, route paths, audition statuses, roles, query keys, RPC names, SSE event names). Define them once in `constants/` or as TypeScript union types / `as const` objects in `types/`, then import everywhere.
- Examples of values that must be centralized: `AuditionStatus` (`open_call`, `post_deadline`, `past`), `UserRole`, Supabase table/view names, React Query key factories, AsyncStorage/localStorage keys, API route paths (`/api/summary`), SSE event types.
- Prefer a single `as const` object + derived union type (e.g. `const AuditionStatus = { OPEN_CALL: 'open_call', ... } as const;`) over scattered raw strings, so renames happen in one place and TypeScript catches typos.
- Same rule applies to numeric "magic numbers" (pagination sizes, timeouts, breakpoints) — pull from `constants/layout.ts` or a dedicated constants file.

### Perfect Database Structure

Treat the Supabase/PostgreSQL schema as the source of truth for the domain model — these are the rules to apply whenever it changes, not a description of its current shape:

- **Naming**: tables and columns in `snake_case`, tables pluralized, junction tables named after both sides they connect.
- **Normalization**: avoid duplicating data across tables; use foreign keys and joins/views instead of denormalized copies, except where a view is intentionally built for read performance (and documented as such in the migration).
- **Constraints**: every column that models a fixed set of states must be a Postgres `enum` type or a `CHECK` constraint mirroring the corresponding TypeScript union — never a free-text column.
- **Foreign keys**: always explicit, with a deliberate `ON DELETE` behavior (`CASCADE`, `RESTRICT`, or `SET NULL`) — never rely on the client to maintain referential integrity.
- **Indexes**: add indexes on foreign key columns and any column used in `WHERE`/`ORDER BY` in hot paths.
- **Row Level Security**: every table exposed to the client must have RLS enabled with explicit policies — never disable RLS as a shortcut.
- **Timestamps**: every table has `created_at` and, where mutable, `updated_at` (via trigger or default).
- **Migrations**: schema changes go through tracked SQL migrations under `supabase/migrations` (not ad-hoc dashboard edits), so the schema history is reproducible and reviewable.
- **Views over client joins**: prefer a Postgres view when a screen needs data assembled from multiple tables, instead of doing N+1 fetches or client-side joins in hooks.
