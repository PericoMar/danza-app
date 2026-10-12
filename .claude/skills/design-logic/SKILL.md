---
name: design-system
description: Danza App's current visual design system — black & white base, reflective "chrome" silver, sparing purple/pink accents, Inter typography, spacing/breakpoints, border-radius and shadow scales, and the reusable ChromeSurface / FilterTag / card interaction patterns used across the newest, not-yet-merged screens (Companies, Company Insights, Newsletter, shared Site Header/Footer, Home sections). Use before styling any new page or component, when asked to make something "match the app", or when asked about colors, fonts, spacing, or design tokens. Does NOT describe the older/legacy screens that haven't been restyled yet.
---

# Danza App — Design System (current restyle)

This documents the visual language actually in use in the **new, uncommitted work** in this repo — the Companies page, Company Insights, Newsletter, the shared `SiteHeader`/`SiteNavbar`/`SiteFooter`, and the Home sections. It does not describe older screens that haven't been touched by this restyle yet — don't copy patterns from files not listed under "Where things live" below.

Source of truth is always the theme files, not this document — if they diverge, trust the code and update this file:
- `theme/colors.ts` — the single palette + gradients
- `theme/companies.ts` — Inter type helpers, layout helpers, `webTextGradient`
- `theme/insights.ts` — re-exports companies theme + the narrower reading column
- `theme/landing.ts` — the Landing-page-only type system (DM Sans / Cormorant / JetBrains Mono)
- `components/common/siteStyles.ts` — shared navbar/button chrome
- `constants/layout.ts` — every breakpoint and max-width constant

## 1. Color

### Foundation: black & white
Everything sits on white surfaces with near-black text. Don't introduce off-brand grays — use the tokens below.

| Token (`Colors.*`) | Value | Use |
|---|---|---|
| `bg` / `surface` / `white` | `#ffffff` | Page and card backgrounds |
| `text` | `#000000` | Primary text, primary button fills |
| `textLightDark` | `#474747cc` | Secondary body copy |
| `textMuted` | `#929294` | Tertiary/meta text, placeholders, icons |
| `rule` | `rgba(0,0,0,.08)` | Default hairline border |
| `ruleStrong` | `rgba(0,0,0,.14)` | Input/card border, stronger dividers |

### Silver / chrome — the "modern reflective" layer
This is the signature detail of the new look: brushed-metal gradient surfaces, not flat gray. Reach for it on elevated/special elements (hero CTA-adjacent monograms, logo placeholders, the active favorites pill, date-filter trigger), **not** on ordinary buttons — most buttons stay flat black (see §5).

`Colors`: `silver #C0C0C0`, `silverSoft #e2e2e4` (card borders), `grey1 #333`, `grey2 #666` (eyebrow/mono labels), `panelBorder #DCDCE0`, `specSurface #FAFAFB`, `chromeSoft #F5F5F7`.

`Gradients` (consumed via `expo-linear-gradient`, angle ≈168°: `start {x:0.12,y:0}`, `end {x:0.88,y:1}` — see `CHROME_GRADIENT_START/END` in `theme/companies.ts`):
```ts
chrome:     ["#fdfdfe", "#eceef1", "#c9ccd2", "#e6e8ec", "#f8f9fa", "#d8dbe1"]  // light brushed metal
chromeSoft: ["#fdfdfe", "#eceef1", "#d8dbe1"]                                   // subtler version
darkPill:   ["#3a3d44", "#191b1f", "#2c2f35"]                                   // dark metal (active/selected states)
headline:   6-stop gray-silver sweep, also exposed as `Gradients.headline.css` for web text-gradient
```
Use the shared **`ChromeSurface`** component (`components/companies/ChromeSurface.tsx`) instead of hand-rolling gradients — it wraps a `LinearGradient` with a "ring": on web a triple `boxShadow` (inset top highlight + inset bottom shadow + 1px outline + soft drop shadow), on native an equivalent `shadowColor:'#282c37'` config. Variants: `chrome`, `chromeSoft`, `dark`.

For gradient *text* (e.g. an emphasised headline word), use `webTextGradient(css)` from `theme/companies.ts` — it applies `backgroundClip:'text'` on web and is a no-op object on native, so always pair it with a solid fallback `color`.

### Purple — sitewide subtle accent
`Colors.purple #7755FF`, `purpleDark #5A3EEA`, `purpleSoft #A98CFF`, `purpleLight #f3f1feff`, plus `surfaceAlt #ece6f9`. This is the app's general-purpose accent for **very restrained** use — a tinted section background, a soft icon-button fill (e.g. the "Auditions" admin action uses `purpleLight`), never a large solid fill or a primary CTA. If a screen needs *an* accent and doesn't have its own documented reason for something else, this is the default.

### Page-scoped accents — exceptions, don't copy without reason
- **Pink** (`Colors.pink #E0447B` + `pinkDark/pinkSoft/pinkTint/pinkBorder`) is scoped to **Company Insights only**: audition frame tint, status/lock pills, the AI-summary avatar, in-text links. It deliberately does not appear on Companies, Newsletter, or the shared header/footer. Don't reuse it elsewhere without an explicit reason to extend the Insights accent.
- **Newsletter** intentionally drops all accent color — it's stark black-on-white editorial (`components/newsletter/styles.ts`: `NL.ink #111`, `inkSoft #3f3f46`, `muted #6b6b70`, `hairline #ececee`). No purple, no pink, no gradients.
- **Account pages** (`/profile`, `/profile/delete-account`, `components/account/*`) reuse the Newsletter's monochrome editorial look built on `Colors` tokens: eyebrow + oversized headline, numbered hairline-ruled settings sections (label column left on wide screens), pill buttons, and the soft `dangerSoft`/`dangerText` tint as the only colour.

### Status / semantic color
- Audition status dots: open `#3ddc91`, closing soon `#ffd66b`, closed `#9b9ba1`.
- Success banners (e.g. "already reviewed"): `successBg #F0FDF4` / `successBorder #bbf0cf` / `successText #14532d` — soft pastel fill + a saturated text/icon color, never a loud solid.
- Danger action fill (e.g. delete button): `dangerSoft #fadddd` — same soft-pastel treatment, not a strong red.

## 2. Typography

Two separate type systems currently coexist. **Default to the Inter system for any new page** — it's what Companies, Insights, Newsletter, and the shared `SiteFooter` all use. Only the Landing page and `SiteNavbar` still use the DM Sans / Cormorant Garamond system.

| System | Fonts | Loader | Where |
|---|---|---|---|
| **App (default)** | Inter only, for every role (`INTER`/`DISPLAY`/`MONO_LABEL` are all the same family) | `loadCompaniesFonts()` in `theme/companies.ts` | Companies, Insights, Newsletter, `SiteFooter` |
| **Landing** | `SANS` = DM Sans (nav/UI), `SERIF` = Cormorant Garamond (display/emphasis), `MONO` = JetBrains Mono | `loadLandingFonts()` in `theme/landing.ts` | Landing page, `SiteNavbar` |

Inter's whole trick is doing every role through **weight + letter-spacing**, not multiple families — lean on that rather than reaching for a second font.

### Type roles (Inter system — copy these combinations)
- **Eyebrow / kicker**: `fontSize 10.5–12`, `letterSpacing 1.5–2.2`, `textTransform uppercase`, `fontWeight 600–700`, `color grey2`/`textMuted`. Used above nearly every headline and section title.
- **Display headline**: `fontWeight 800–900`, `textTransform uppercase`, tight/negative `letterSpacing -0.7` to `-1.4`, `color text`. Emphasis words go either a muted color (`grey2`/`textMuted`) or the silver `webTextGradient(Gradients.headline.css)` treatment.
- **Section title**: same display family, smaller (`26–40px`), a muted-colored trailing word for contrast (e.g. `"Insights & reviews"` with "& reviews" in `textMuted`).
- **Body copy**: `14–17px`, `lineHeight ≈1.4×`, `color textLightDark` or `textMuted`.
- **Micro/meta labels** (stat labels, footer text, "kbd" hints): `8–11px`, wide `letterSpacing 1–2.2`, uppercase, `color textMuted`/`grey2`.
- **Buttons/pills**: `13–14px`, `fontWeight 500–600`, normal case (contrast the uppercase micro-labels).

## 3. Layout & spacing

### Breakpoints (`constants/layout.ts`)
General: `MOBILE 600`, `TABLET 900`, `LARGE_SCREEN 1350`, `SMALL_SCREEN 550`.
Companies-specific: nav collapses `≤900`, filters go icon-only `≤560`, grid: 3-col `≥1080`, 2-col `≥680`, else 1-col.
Insights-specific: descriptions clamp `≤760`; audition timeline stacks `≤820`.

### Page containers
Every page centers a content column with a max-width + responsive horizontal padding — don't hardcode a new max-width, add a constant next to the existing ones and a small helper like `pageMaxWidth`/`pageHPadding`.

| Page | Max width | H padding |
|---|---|---|
| Companies / Insights outer / Footer | 1320 | 40 (22 at `≤720px`) |
| Insights reading column | 980 | same helper |
| Newsletter | 1120 | — |

### Border radius scale
- `4` — tiny chips (`⌘K` hint)
- `6` — buttons, nav icon buttons, brand mark corners
- `8` — inputs, dropdowns, admin action buttons
- `10–12` — cards, banners
- `999` — pills, dots, avatar/favorite circles

### Borders — "hairline" philosophy
Never a heavy 2px+ border. Everything is a 1px hairline using `Colors.rule` (`rgba(0,0,0,.08)`) for quiet dividers or `Colors.ruleStrong` (`rgba(0,0,0,.14)`) for things that need to read as interactive (inputs, pill outlines, card borders use `silverSoft` specifically).

### Shadows — soft, oversized, low-opacity
Web shadows use a large blur with a **negative spread** so they read as a soft floating glow, not a hard drop shadow:
```css
/* card hover */
box-shadow: 0 18px 42px -22px rgba(0,0,0,.18);
/* sticky filter bar */
box-shadow: 0 10px 24px -20px rgba(0,0,0,.25);
```
On native, the equivalent is a low `shadowOpacity` (`.15–.4`) with a large `shadowRadius` and `elevation 2–3`. Always branch with `Platform.select({ web: {...}, default: {...} })` — RN's `shadow*` props don't work on web and `boxShadow` doesn't work on native.

## 4. Interaction & component conventions

### Buttons
- **Primary**: flat solid black (`backgroundColor: Colors.text`), white text, `borderRadius 6`. This is the default — most CTAs (`siteStyles.btnPrimary`, `siteStyles.navCta`).
- **Ghost/secondary**: transparent fill, `borderWidth 1`, `borderColor rgba(0,0,0,.18)`, black text.
- **Chrome/special**: wrap in `ChromeSurface` when a control should read as an elevated physical object rather than a flat UI button (reserve for genuinely special elements, not routine actions).

### Pills / tags (see `FilterTag`)
Default: white fill, `ruleStrong` border, radius `999`. Active state normally flips to **solid black fill + white content** — not a color change. One special case (`favorites`, `variant="fav"`) uses the `darkPill` chrome gradient instead of flat black when active, to keep the "metal" motif on a toggle that's meant to feel a little more premium.

### Cards (see `CompanyCard`)
White background, `Colors.silverSoft` border, `borderRadius 12`, `overflow:hidden`. Hover (web): border darkens to `Colors.silver`, `transform: scale(1.01)`, plus the soft floating shadow from §3. Track hover via React state (`onHoverIn`/`onHoverOut`) or the `Pressable` render-prop `({ hovered }) => [...]` — both patterns appear; prefer the render-prop for simple style-only changes, state when other UI (e.g. a companion element) needs to react too.

### Status pills/dots
Small circular dot (`6–8px`) colored to match the pill's text color, pill background is a soft pastel tint of the same hue, label is tiny/bold/uppercase with letter-spacing. This is the same recipe for audition status, success banners, and danger fills — pastel background + saturated text/icon, never a loud solid fill.

### Hover/pointer conventions (web)
```tsx
style={({ hovered }) => [
  styles.base,
  Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
  hovered && styles.baseHovered,
]}
```
Always gate `cursor: 'pointer'` behind `Platform.OS === 'web'` — it's meaningless (and a TS error) on native.

### Imagery
Photography is used sparingly and never full-bleed/saturated: `CompaniesHero` clips a single photo into two overlapping circular "orb" cutouts, rendered at low opacity (`~0.12`) as a background texture behind the copy — decorative texture, not a hero banner.

## 5. Quick do / don't
- **Do** default new pages to the Inter-only type system and the black/white/chrome palette.
- **Do** use pastel-tint + saturated-text for any status/semantic color, not a solid loud fill.
- **Do** keep accents restrained: purple is the sitewide default, sparingly; pink stays inside Insights; Newsletter stays monochrome.
- **Don't** invent a new accent hue for a new page without a stated reason — extend purple first.
- **Don't** use a flat gray box where the design calls for the chrome gradient — reach for `ChromeSurface`.
- **Don't** hardcode a page max-width/padding — add a constant to `constants/layout.ts` alongside the existing ones.
- **Don't** mix the Landing (DM Sans/Cormorant) and App (Inter) type systems on the same screen.

## 6. Where things live
- Tokens: `theme/colors.ts`, `theme/companies.ts`, `theme/insights.ts`, `theme/landing.ts`
- Shared chrome: `components/common/{SiteHeader,SiteNavbar,SiteFooter,siteStyles}.ts(x)`
- Chrome surface primitive: `components/companies/ChromeSurface.tsx`
- Reference implementations to copy patterns from: `components/CompanyCard.tsx`, `components/FilterTag.tsx`, `components/companies/CompaniesHero.tsx`, `components/companies/CompaniesFilters.tsx`, `components/insights/*`, `components/newsletter/*`, `components/account/*`
- Layout constants: `constants/layout.ts`
