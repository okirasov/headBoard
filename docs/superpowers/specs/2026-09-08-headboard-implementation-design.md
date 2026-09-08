# Headboard — implementation design (web + mobile + API)

Date: 2026-09-08. Source of truth for visuals: `design_handoff_headboard/README.md` and `Headboard.dc.html`.
Where README and the prototype disagree, **the prototype wins** (decisions below).

## Goal
Recreate the Headboard prototype pixel-for-pixel in the target stack:
React + Tailwind (web), React Native / Expo (iOS + Android, single UI), .NET 10 Web API.

## Repository layout (npm workspaces)
```
apps/web        React 18 + Vite + TypeScript + Tailwind 3
apps/mobile     Expo (React Native) + TypeScript
apps/api        .NET 10 Web API, EF Core, SQLite (dev) / PostgreSQL (prod)
packages/core   shared TS: model types, i18n dictionaries (EN/RU), token names,
                domain logic (idle/stale/due, sorting, calendar grids, digest stats,
                capture heuristic), API client
```

## Decisions
1. **Backend in parallel with web.** Web runs on local persisted state first; the same
   store then syncs through the API client (`packages/core/api`). API provides
   Google/Apple id-token → JWT, tasks/projects/files/comments CRUD, settings,
   and AI endpoints (`/ai/extract`, `/ai/digest`) that replace `window.claude.complete`.
2. **"Show Done" toggle** added to the Board header (chip r7 next to priority chips,
   persisted in settings). Default on, matching prototype `showDone=true`.
3. **Snooze presets** row (Tomorrow / +3 days / Next week / Next month) above the
   mini-calendar in the snooze picker, chips r7.
4. **Extra tokens** for colours the prototype uses outside the README table:
   `--wait #9A7B2D` (Waiting column dot), `--okHov #516F4A`,
   `--fabShadow rgba(188,86,54,.4)`, `--scrimDrawer rgba(32,29,23,.28)`.
   Same values in light and dark. Project colours are user data, not tokens.
5. **Fonts:** Golos Text (UI, 400/500/600) and IBM Plex Mono (labels). No serifs —
   README mentions of Literata are stale; prototype uses Golos Text 500.
6. **Sidebar** as in prototype: logo, 4 nav items (Board / Review / Digest / Calendar),
   projects list, profile + menu, sync line. Priority chips live in the Board header,
   project files in a bar under it. No dot next to the active nav item.
7. **Persistence key** `headboard-v1`; `oboard-v3` migration is not ported.
8. **Android** uses the same RN UI as iOS (tab bar with FAB, sheets); only safe-area differs.
9. Demo data from the prototype is not hard-coded. Web ships an empty board
   plus a "seed sample data" action visible only in development builds.
10. Not implemented (decorative in prototype): Google Calendar two-way sync,
    the 8:00 digest cron. The calendar sync chip is rendered as a status chip.

## Theming
CSS variables on `:root` (light) and `.dark` (dark), exactly the README table plus the four
extra tokens. Tailwind `theme.colors` maps every token to `var(--name)`; components use
only token classes. Theme default = system; user choice persisted. Mobile: the same token
object (light/dark) through a ThemeContext.

## Data model (packages/core)
```ts
type Priority = 0 | 1 | 2;                    // High, Medium, Low
type Status = 'inbox' | 'focus' | 'waiting' | 'done' | 'archived';
interface Task { id; title; proj: string|null; pr: Priority; status: Status;
  touched: number; created: number; due: number|null; snoozedUntil: number;
  recur: 'weekly'|null; tags: string[]; note: string; chat: string|null;
  files: FileRef[]; comments: Comment[]; doneAt: number|null }
interface FileRef { id; name; kind: 'img'|'file'; size?: number; src?: string }
interface Comment { id; text; at: number }
interface Project { id; name; color: string }
interface User { name; email; provider: 'Google'|'Apple'; initials }
```
Derived rules (pure functions, unit-tested): `idleDays`, `isStale(task, staleDays=7)`,
`dueDiff/dueLabel`, `sortAutoBump`, `buildMonthGrid`, `buildSnoozeGrid`,
`digestStats`, `heuristicExtract`, `cannedDigest`.

## Web component tree
- `App` → `SignIn` gate | `Shell` (`Sidebar`, `TopBar`, view) + overlays
  (`TaskDrawer`, `CaptureModal`, `SnoozePicker`, `FilePreviewModal`, `Snackbar`).
- `Sidebar`: `Logo`, `NavItem`, `ProjectList`, `ProfileButton`, `ProfileMenu`, `SyncStatus`.
- `TopBar`: date kicker, `SearchInput`, Capture button.
- `BoardView`: `PriorityChips`, `ShowDoneChip`, `ProjectFilesBar`, `Column`, `TaskCard`.
- `TaskDrawer`: `IdleBadge`, `StatusSelect`, `PriorityDots`, `AttachmentChips`,
  `CommentList`, `CommentInput`, `MetaRows`, `DrawerActions`.
- `ReviewView` → `ReviewRow`; `DigestView` → `RowList`; `CalendarView` → `MonthGrid`,
  `DayCell`, `ScheduleList`.
- UI primitives: `Button`, `Chip`, `Segmented`, `IconButton`, `Kicker`, `Dot`, `Icons`.
- State: zustand store (persisted slice: tasks, projects, projFiles, digestText, user,
  lang, theme, showDone; UI slice: sel, filters, capture, snooze, preview, profile, drag).

## Mobile screens
`Header`, `BoardScreen` (segments + cards), `ReviewScreen`, `DigestScreen`,
`CalendarScreen`, `TabBar` with FAB, sheets: `TaskSheet`, `CaptureSheet`,
`ProfileSheet`, `SnoozeSheet`; `FilePreview` (always-dark overlay); `SignInScreen`.

## API
`POST /auth/{google|apple}` → JWT · `GET/POST/PATCH/DELETE /tasks` · `/projects` ·
`POST /files` (multipart) · `/tasks/{id}/comments` · `GET/PUT /settings` ·
`POST /ai/extract`, `POST /ai/digest` (Anthropic API, model `claude-sonnet-5`).
EF Core, SQLite in dev, PostgreSQL via connection string in prod.

## Build order
Web: tokens + primitives → Sidebar → Board → TaskDrawer → Review → Calendar → SignIn/Profile
→ Digest → Capture → Snooze/preview. Then API. Then mobile.
