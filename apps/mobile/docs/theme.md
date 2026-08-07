# Theme Decision

Status: Accepted

## Decision

Formalize the existing terracotta/cream brand direction (already present in `app.json`'s
splash/icon config and `src/constants/theme.ts`'s `tint`) into a full semantic token system:
surface hierarchy, text hierarchy, status colors, a fixed typography scale, and a radius scale.
All tokens live in `src/constants/theme.ts` — this document explains the *why*, the code is the
source of truth for the *values*.

## Rationale

- **Don't re-derive the brand from scratch.** `#B5541A` (terracotta) and `#FCEADD` (cream) were
  already chosen for the splash screen and adaptive icon before this doc existed. Treat them as
  the seed and build the rest of the palette to match, rather than introducing a second,
  competing color direction.
- **Warm, not clinical.** Akshar exists so a parent who can't read a script can still help their
  child with homework — the tone should read as approachable and human, not like enterprise
  software. Terracotta/cream over a cooler, more "productivity tool" blue-and-gray palette
  supports that.
- **Light and dark both matter.** This is a homework-time app — evenings, low light — so dark
  mode isn't optional polish.
- **Segment text needs its own type scale entry.** Kannada, Devanagari, Tamil, and Telugu all
  carry matras and diacritics above and below the baseline that a Latin-tuned line-height
  clips or crowds. `Typography.reading` uses a taller line-height (1.6×) than `Typography.body`
  (1.5×) for exactly this reason — it's the one place a generic type scale would get this app
  wrong.
- **Status colors are scoped to standard UI states only** (success/warning/error/info) — not to
  content-provenance concepts like "official vs. community-contributed," which the README
  discusses but no screen surfaces yet. Adding that distinction as a color token before a screen
  actually needs it would be guessing at a design that doesn't exist yet.

## Token reference

Colors (`Colors.light` / `Colors.dark` in `theme.ts`):

| Token | Purpose |
|---|---|
| `text` / `textSecondary` / `textDisabled` | Text hierarchy |
| `background` / `backgroundElement` / `backgroundSelected` | Surface hierarchy (page → card → selected state) |
| `border` | Dividers, input/card outlines |
| `tint` | Brand accent — links, active tab, primary actions |
| `tintMuted` | Soft accent surface (selected chip/badge backgrounds) |
| `success` / `warning` / `error` / `info` | Standard UI status states |

`tint` on `background` and `textSecondary` on `background` both verified ≥ 4.5:1 contrast
(WCAG AA for normal text) in both light and dark; same standard applied when picking the status
colors.

Typography (`Typography` in `theme.ts`): `display`, `title`, `subtitle`, `body`, `reading`,
`caption`, `label` — each a `{ fontSize, lineHeight, fontWeight }` triple.

Radius (`Radius` in `theme.ts`): `small` (6), `medium` (12), `large` (20), `pill` (999).

Existing `Spacing` and `Fonts` exports (font family selection, spacing scale) are unchanged by
this decision — see `theme.ts` directly.

## Scope

This decision covers tokens only. It doesn't restyle existing screens/components beyond fixing
`ThemedText`'s `linkPrimary` variant, which hardcoded a leftover Expo-template blue
(`#3c87f7`) instead of using the brand tint — left in place, it would have directly
contradicted this doc. No other component changed.

This decision can be revisited as real screens get built and the token set proves too sparse
or too rigid in practice.
