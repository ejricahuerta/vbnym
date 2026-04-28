# 6IX Back Design Reference Map

This matrix maps `web` route groups to the extracted reference app pages and screenshot set.

## Reference sources

- `6ixBack/design-extract/6ix-back-volleyball/project/landing.jsx`
- `6ixBack/design-extract/6ix-back-volleyball/project/browse.jsx`
- `6ixBack/design-extract/6ix-back-volleyball/project/detail.jsx`
- `6ixBack/design-extract/6ix-back-volleyball/project/roster.jsx`
- `6ixBack/design-extract/6ix-back-volleyball/project/admin.jsx`
- `6ixBack/design-extract/6ix-back-volleyball/project/host.jsx`
- `6ixBack/design-extract/6ix-back-volleyball/images/*.jpg`

## Route-group mapping

| Web surface | Primary files | Reference page(s) |
|---|---|---|
| Public landing and legal pages | `web/components/features/home-marketing/*`, `web/components/features/legal-*/*`, `web/components/features/community-hub/*` | `landing.jsx`, `host.jsx`, `primitives.jsx` |
| Player app schedule and game detail | `web/components/features/app-schedule/*`, `web/components/games/*`, `web/components/features/game-detail/*` | `browse.jsx`, `detail.jsx`, `roster.jsx` |
| Leagues public and portal flow | `web/components/features/leagues/*` | `browse.jsx`, `detail.jsx`, `host.jsx` |
| Admin hubs and editors | `web/components/features/admin-*/*`, `web/components/admin/*` | `admin.jsx`, `browse.jsx` |

## Visual priorities to preserve across all pages

1. Hard 2px ink borders and offset brutalist shadows.
2. Warm paper background with high-contrast ink/accent tokens.
3. Display-style uppercase headings and mono micro-labels.
4. Image-backed section blocks using extracted visual references.
5. Consistent card rhythm and section spacing between route groups.
