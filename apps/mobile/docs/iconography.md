# Iconography Decision

Status: Accepted

## Decision

Use `@expo/vector-icons` with the `MaterialCommunityIcons` icon set for the mobile application.

## Rationale

- First-class Expo support with no additional native setup.
- Comprehensive icon coverage for education and reading experiences.
- Consistent appearance across Android, iOS, and web.
- Easy to replace selectively with branded assets in the future.

## Bottom Navigation

| Screen | Icon |
|--------|------|
| Home | `home-outline` |
| Library | `bookshelf` |
| Explore | `compass-outline` |

Reader, Exercises, Search, and Settings are pushed screens reached from within Home/Library/
Explore (e.g. "Continue reading", a chapter row, the search icon), not bottom-nav destinations —
per the Claude Design update that moved Library into the tab bar in Reader's place.

Guidelines:

- Default to outline icons.
- Standard size: 24px.
- Use the app accent color for the active tab.
- Avoid mixing icon families within the same UI.

**Filled/active icon variant — not currently used, despite being the natural Material 3
convention.** `expo-router`'s `NativeTabs.Trigger.Icon` resolves each `VectorIcon` via an async
`family.getImageSource()` call; providing separate `default`/`selected` icon elements means two
independent promises that can resolve in either order, and `react-native-screens` throws
(`[RNScreens] To use selectedIcon prop, the icon prop must also be provided`) if `selectedIcon`
happens to resolve first. A single icon per tab avoids that native validation path entirely, so
for now the active tab is distinguished by `iconColor`/the indicator pill only, not a swapped
glyph. Revisit once this (experimental, "MIGHT CHANGE W/O ANY NOTICE" per its own source comment)
API stabilizes.

This decision can be revisited if a dedicated Akshar design system or custom icon set is introduced.
