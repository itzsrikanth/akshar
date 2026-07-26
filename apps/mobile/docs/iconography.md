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
| Search | `magnify` |
| Reader | `book-open-page-variant` |
| Explore | `compass-outline` |

Guidelines:

- Default to outline icons.
- Use filled/active variant only for the selected tab.
- Standard size: 24px.
- Use the app accent color for the active tab.
- Avoid mixing icon families within the same UI.

This decision can be revisited if a dedicated Akshar design system or custom icon set is introduced.
