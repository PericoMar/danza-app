# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Danza-app is a platform for discovering dance companies, exploring auditions, and sharing reviews. Built with Expo (React Native + Web), it targets dancers and professionals seeking centralized audition information.

## Common Commands

```bash
pnpm install          # Install dependencies
pnpm start            # Start Expo development server (all platforms)
pnpm web              # Start web only
pnpm android          # Start Android
pnpm ios              # Start iOS
pnpm test             # Run Jest tests (watch mode)
pnpm lint             # Run ESLint via Expo
pnpm build            # Export web build for production
```

## Architecture

### Tech Stack
- **Expo SDK 52** with expo-router for file-based routing
- **TypeScript** with strict mode
- **Supabase** for PostgreSQL database, authentication, and real-time subscriptions
- **TanStack React Query** for server state management
- **React Native Paper** (MD3DarkTheme) for UI components
- **OpenAI** for AI-generated review summaries (via SSE streaming)

### Directory Structure
```
app/                    # Expo Router pages (file-based routing)
  _layout.tsx          # Root layout with providers stack
  companies/           # Company listing and management
  insights/            # AI-powered company insights
components/
  modals/              # Modal dialogs (ReviewMenuOptions, NewsletterModal, etc.)
  ui/                  # Reusable UI components
  common/              # Shared primitives (Card, IconButton, DateInput)
  landing/             # Landing page components
  auth/                # Auth forms
  auditions/           # Audition-related components
hooks/                 # React hooks for data fetching
services/              # Backend integration layer
  supabase.web.ts      # Web Supabase client
  supabase.native.ts   # Native Supabase client (with AsyncStorage)
  auditions.ts         # Audition CRUD operations
  favorites.ts         # Favorite companies management
  openai.ts            # OpenAI client setup
providers/
  RoleProvider.tsx     # Admin role context with real-time updates
types/                 # TypeScript type definitions
theme/                 # Design tokens (colors.tsx)
constants/             # App constants (layout, fields)
```

### Provider Stack (app/_layout.tsx)
The app wraps components in this order:
1. `AuthProvider` - Supabase auth session management
2. `QueryClientProvider` - React Query (recreated per session)
3. `RoleProvider` - Admin role detection via RPC + real-time subscription
4. `PaperProvider` - React Native Paper theming

The entire provider tree remounts on session change using `key={sessionKey}` to prevent stale cache.

### Data Flow Patterns
- **Companies**: Fetched via `companies_enriched` view which includes `is_favorite` and embedded `auditions` array
- **Reviews**: Stored with structured `content` JSON (salary, repertoire, staff, schedule, facilities, colleagues, city)
- **Favorites**: Junction table `favorite_companies` with real-time toggle
- **AI Summaries**: POST to `/api/summary` with JWT auth, returns SSE stream

### Platform-Specific Code
Uses TypeScript `moduleSuffixes: [".web", ".native", ""]` for platform variants:
- `supabase.web.ts` - Browser localStorage persistence
- `supabase.native.ts` - AsyncStorage persistence

### Import Alias
Use `@/` for absolute imports from project root (configured in tsconfig.json).

## Database Schema (inferred from code)

Key tables:
- `companies` / `companies_enriched` (view with favorites + auditions)
- `auditions` with flexible schedule modes (single_date, to_be_arranged, various_dates)
- `audition_height_requirements` - Height requirements per audition
- `reviews` - Company reviews with structured content JSON
- `favorite_companies` - User favorites junction table
- `users` - With `role` column for admin detection (uses `is_admin` RPC)

## Environment Variables

Required in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

`EXPO_PUBLIC_*` variables are exposed to the client. `OPENAI_API_KEY` is server-only.

## Key Implementation Notes

- Auth redirects handled by `AuthNavigator` component watching session state
- Public routes defined in `isPublicRoute()` function in root layout
- Admin detection uses Supabase RPC `is_admin` with fallback to direct table query
- AI summary uses SSE streaming with manual parsing (not EventSource)
- Auditions support multiple schedule modes: `single_date`, `to_be_arranged`, `various_dates`
