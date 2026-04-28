# Reference Flow Route Map

This maps each screenshot-derived state from the `6ix-back-volleyball` reference to an explicit `web` route and live feature component.

## Public flow

- `landing` → `/` → `HomeMarketingPage`
- `browse` → `/app` → schedule browsing flow
- `detail` → `/app/games/[id]` → game detail flow
- `host` → `/host` → `HostPage` (new explicit route)
- `roster` → `/app/my-games` and `/app/league-team` → roster and portal views

## Admin control room flow

- `overview` → `/admin` (redirects to `/admin/games`)
- `events` → `/admin/games`
- `hosts` → `/admin/hosts` (new explicit route)
- `players` → `/admin/players` (new explicit route)
- `venues` → `/admin/venues`
- `reports` → `/admin/reports` (new explicit route)

## Equivalency notes

- Existing signup, payment, and auth business logic remains in server queries/actions.
- New pages are route-level wrappers and feature-level renderers on top of existing data sources.
- Legacy `/app/*` routes remain supported while the new explicit pages are linked from top-level navigation.
