# Headboard

Personal thinking board: paste raw text, get tasks in Inbox / In focus / Waiting on, review forgotten ones, see load per day in a calendar. Web + iOS/Android + API, built from the design handoff in `design_handoff_headboard/`.

## Layout

| Path | What | Stack |
|---|---|---|
| `packages/core` | Model, EN/RU dictionaries, design-token values, domain logic (idle/stale/due, sorting, calendar grids, digest, capture heuristics), typed API client | TypeScript, vitest |
| `apps/web` | Desktop web app (reference 1440×900) | React 19, Vite, Tailwind 3, zustand |
| `apps/mobile` | iOS + Android app (reference 402×874) | Expo SDK 57, React Native, react-native-svg |
| `apps/api` | Backend: auth, tasks, projects, files, settings, AI | .NET 10 minimal API, EF Core (SQLite dev / PostgreSQL) |
| `docs/superpowers` | Design spec and implementation plans | |

## Run

```bash
npm install
npm run dev            # web on http://localhost:5173 (local-only mode)
npm run mobile         # Expo dev server; press i / a for iOS / Android
npm run api            # .NET API on http://localhost:5080
npm test && npm run typecheck
```

Web talks to the API when `apps/web/.env` sets `VITE_API_URL` (see `.env.example`); mobile when `EXPO_PUBLIC_API_URL` is set (e.g. `EXPO_PUBLIC_API_URL=http://localhost:5081 npm run mobile`; use the Mac's LAN IP on a physical device). Without an API both work fully offline (web `localStorage`, mobile AsyncStorage, key `headboard-v1`). Sync is offline-first and shared: `packages/core/src/sync.ts` pulls server state on sign-in (server wins when it has tasks, otherwise local data is pushed) and then diffs every store change into POST/PATCH/DELETE calls; failed pushes retry. Sign-in runs the real Google/Apple flows when client ids are configured (web: `VITE_GOOGLE_CLIENT_ID`, `VITE_APPLE_SERVICES_ID`, `VITE_APPLE_REDIRECT_URI`; mobile: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`; Apple on iOS needs no client-side id) and the matching `Auth:*` keys on the API (see `apps/api/README.md`). Without them the API's development login is used. Google and Apple sign-in in mobile need a development build (`npx expo run:ios` / `run:android`), not Expo Go. AI extraction and digest call the API and fall back to local heuristics when the API or the Anthropic key is missing.

Development helpers: an empty board shows a "Load sample data" button in dev builds (web and mobile). Mobile also accepts `EXPO_PUBLIC_DEV_AUTOLOGIN=1`, `EXPO_PUBLIC_DEV_RESET=1`, `EXPO_PUBLIC_DEV_VIEW`, `EXPO_PUBLIC_DEV_THEME`, `EXPO_PUBLIC_DEV_LANG`, `EXPO_PUBLIC_DEV_SHEET` for screenshot verification.

## Design rules enforced in code

- Colours only through tokens (`packages/core/src/tokens.ts`; web CSS variables in `apps/web/src/styles/tokens.css`, kept in sync by a test).
- Golos Text for UI, IBM Plex Mono for labels and counters; no serifs, no 700 headings.
- Radii: chips 7, cards 12–14, buttons 9–12, sheets/modals 16–22.
- Where README and prototype disagree, the prototype wins (see `docs/superpowers/specs/2026-09-08-headboard-implementation-design.md`).
