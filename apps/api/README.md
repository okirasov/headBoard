# Headboard API (.NET 10)

Minimal-API backend for Headboard: per-user persistence of the core model
(`packages/core/src/model.ts`), Google/Apple sign-in exchanged for a JWT, and AI
task extraction / digest generation through the Anthropic Messages API.

- Solution: `Headboard.Api.sln` → `Headboard.Api` (app) and `Headboard.Api.Tests` (xunit).
- Listens on `http://localhost:5080`.
- `recur` accepts `daily`, `weekly`, `monthly` or `null`; rolling a completed recurring task into its next instance happens on the client (the original is patched to done, the next instance is a new task), so the API only validates the value.
- Wire format is exactly the TypeScript model: camelCase, epoch-millisecond `long`s,
  `pr` 0|1|2, `status` string union, nullable fields serialized as `null`.

## Run

```bash
# from the repo root
npm run api
# or
dotnet run --project apps/api/Headboard.Api
```

Development uses SQLite (`apps/api/Headboard.Api/headboard.db`, created and migrated on
startup). OpenAPI document: `GET http://localhost:5080/openapi/v1.json` (Development only).
CORS allows `http://localhost:5173` (web) and `http://localhost:8081` (Expo) in Development.

## Sign-in flows

- `POST /auth/google {idToken}` — native apps (expo-auth-session id-token response). The token audience must be one of `Auth:GoogleClientIds`.
- `POST /auth/google {code, redirectUri:"postmessage"}` — web. Google Identity Services code-flow popup returns an authorization code; the API exchanges it at `https://oauth2.googleapis.com/token` with `Auth:GoogleWebClientId` + `Auth:GoogleClientSecret`, then verifies the returned id-token.
- `POST /auth/apple {idToken, name?}` — web (Sign in with Apple JS, popup) and iOS (`expo-apple-authentication`). Apple sends the user's name only once, outside the token, so clients pass it along.
- `POST /auth/dev {email, name?, provider?}` — Development only.

Google Cloud console: create one OAuth client per platform (Web application with `http://localhost:5173` as authorized origin; iOS with bundle id `com.headboard.app`; Android with package `com.headboard.app` and the signing certificate SHA-1). Apple Developer portal: enable Sign in with Apple on the App ID, create a Services ID for the web with an https return URL (Apple does not accept `localhost`).

## Morning digest

`DigestScheduler` wakes every `Digest:CheckIntervalSeconds`, and for each user whose local clock (IANA `timeZone` from `PUT /settings`, UTC when unknown) has passed `Digest:Hour` without a digest that day, `DigestService` computes the same statistics as core `digestStats` (due today, forgotten ≥ 7 idle days, closed this week, in focus, recurring), asks Anthropic with the shared prompt, or falls back to the canned texts (`cannedDigest` port), and stores the result in `Settings.DigestText` with `Settings.DigestAt`. A manual regeneration from a client also updates `DigestAt`, so the scheduler does not overwrite it the same day. Clients pick the new text up with `GET /settings` when they come to the foreground.

## Google Calendar sync

Uses the same Google web client as sign-in (`Auth:GoogleWebClientId` + `Auth:GoogleClientSecret`) with the `https://www.googleapis.com/auth/calendar` scope and offline access; enable the Google Calendar API in the Cloud project and register `Calendar:RedirectUri`.

- `POST /calendar/connect {returnUrl}` → `{url}` consent screen; `GET /calendar/oauth/callback` stores the refresh token in `CalendarLinks` and redirects to `returnUrl?calendar=connected|denied|error`. `GET /calendar` status, `POST /calendar/sync` reconcile now, `DELETE /calendar` disconnect (revokes the token, events stay).
- A dedicated calendar named **Headboard** is created on first sync. Every task with a due date that is not done/archived is an all-day event tagged with `extendedProperties.private.headboardTaskId`; the pushed fingerprint is stored in `Tasks.CalendarHash` so unchanged tasks cost no calls.
- Inbound uses incremental listing (`syncToken`, 410 → full resync): date moves and renames update the task when the event changed after the task was last touched, cancelled events clear the task's date, events created directly in the Headboard calendar become Inbox tasks (and are tagged back). Our own pushes are recognised by fingerprint and ignored.
- Deleted tasks leave their event id in `CalendarLinks.PendingDeletesJson`; the next pass removes the event.

## Push reminders about deadlines

`DueNotifier` runs alongside the stale notifier at `Notify:Hour` for users with `Settings.NotifyDue`: tasks whose reminder fires that day (`Task.remindDays` 0 = on the due day, 1 = the day before; overdue tasks with a reminder are included) are summarised in one push (“Deadlines — 1 overdue · 2 due today”) with deep link `/?view=due`. `remindDays` is part of the task wire model (`PATCH /tasks/{id} {remindDays: 0|1|null}`).

## Task change history

Every task carries `history: HistoryEntry[]` (`{id, at, kind, from?, to?, source?}`, oldest first, capped at 200). Clients build it: each store mutation diffs the previous and next task (`core/history.ts`) and appends entries, so the log travels with the task through `POST/PATCH /tasks` like any other field (the server validates `kind` against the known list and keeps only the newest 200). The API appends its own entries with `source: "calendar"` when Google Calendar sync changes a task's title or date, creates a task from a foreign event, or clears the date after an event is deleted. A `PATCH /tasks/{id}` that carries no `history` field (curl, integrations) is diffed on the server and logged with `source: "api"`, as are `POST/DELETE /tasks/{id}/comments`; a body with `history` is taken as the client's authoritative log. Stored as JSON in `Tasks.HistoryJson`.

## Push reminders about forgotten tasks

`StaleNotifier` evaluates every opted-in user (`Settings.NotifyStale`, toggled from the profile menu) once a day after `Notify:Hour` in their time zone: if `digestStats` finds forgotten tasks (idle ≥ 7 days, not snoozed), every registered device gets one notification (`StaleMessage`: “N forgotten tasks — “title” has waited X days…”, EN/RU) with deep link `/?view=review`. Devices: `POST /push/subscribe` with `{kind:"webpush", endpoint, keys}` (browser, VAPID) or `{kind:"expo", token}` (mobile, Expo Push API); `DELETE /push/subscribe`, `GET /push/subscriptions`, `GET /push/config` (VAPID public key), `POST /push/test`. Subscriptions that push services report as gone (404/410, `DeviceNotRegistered`) or that fail 5 times are dropped.

## Running several instances

Every background loop (digest, stale and due notifiers, the calendar full pass) is a hosted service inside the API, so two replicas would run the same job twice. `Jobs/LeaderLease` prevents that with a database lease: on each tick a loop tries to take or renew the `jobs` row in `Leases` (owner + expiry, guarded by a `Version` concurrency token, so the update is atomic on SQLite and PostgreSQL alike); only the holder runs the tick, the others skip it. A leader that dies stops renewing and another instance takes over after `Leases:TtlSeconds`. Calendar reconciliation for one user (triggered by task edits on any instance) takes a short `calendar:{userId}` lease instead, so nudges stay safe without routing them to the leader. `GET /health` reports `instance` and whether it is the `leader`.

## Tests

```bash
cd apps/api
dotnet build
dotnet test
```

Tests boot the app with `WebApplicationFactory` against a fresh SQLite file and storage
directory per factory instance (under the system temp dir), so they need no external services.
Anthropic calls are replaced with a fake `HttpMessageHandler`.

## Configuration

Keys can be set in `appsettings*.json`, environment variables (`Jwt__Secret`, ...) or user secrets.

| Key | Default | Notes |
| --- | --- | --- |
| `Jwt:Secret` | dev value in `appsettings.Development.json` | **Required**; ≥ 32 bytes. Startup fails without it. |
| `Jwt:Issuer` | `headboard` | Also used as audience. Tokens live 30 days. |
| `Auth:GoogleClientIds` | `[]` | Accepted audiences for Google id-tokens: web, iOS and Android OAuth client ids (each app type has its own). Legacy single `Auth:GoogleClientId` is still honoured. |
| `Auth:GoogleWebClientId` | — | The "Web application" client id; also accepted as an audience. |
| `Auth:GoogleClientSecret` | — | Secret of the web client. Needed only for the browser code-flow (`POST /auth/google {code}`); without it that path returns 503 `code_exchange_unavailable`. |
| `Auth:AppleClientIds` | `[]` | Accepted audiences for Apple id-tokens: the Services ID (web) and the iOS bundle id (`com.headboard.app`). Legacy `Auth:AppleClientId` is still honoured. |
| `Auth:AllowDevLogin` | `true` in Development, else `false` | Enables `POST /auth/dev`. |
| `Anthropic:ApiKey` | — | Without it `/ai/*` return `503 {"error":"ai_unavailable"}` and clients fall back locally. |
| `Anthropic:Model` | `claude-sonnet-5` | Model id sent to `POST https://api.anthropic.com/v1/messages`. |
| `ConnectionStrings:Sqlite` | `Data Source=headboard.db` | Used when no Postgres connection string is set. |
| `ConnectionStrings:Postgres` | — | When present the app uses Npgsql instead of SQLite. |
| `Storage:Root` | `./storage` | Uploaded files land in `{Storage:Root}/{userId}/{fileId}`. |
| `Digest:Enabled` | `true` | Runs the morning digest scheduler (`DigestScheduler`, a hosted service). |
| `Digest:Hour` | `8` | Local hour (per user's `timeZone`) after which today's digest is generated. |
| `Digest:CheckIntervalSeconds` | `60` | How often the scheduler looks for due users. |
| `Calendar:Enabled` | `true` | Runs the Google Calendar reconciliation loop (`CalendarSyncScheduler`). |
| `Calendar:PollIntervalSeconds` | `300` | Full pass over connected users; task mutations and "sync now" trigger immediate passes. |
| `Calendar:RedirectUri` | `{host}/calendar/oauth/callback` | Must be registered as an authorized redirect URI of the Google web client. |
| `Calendar:AllowedReturnUrls` | localhost web/Expo, `headboard://` | Prefixes the OAuth flow may redirect back to. |
| `Push:VapidPublicKey`, `Push:VapidPrivateKey` | — | VAPID key pair for Web Push (generate once with `npx web-push generate-vapid-keys`). Without them `/push/subscribe` for `webpush` returns 503; Expo pushes need no keys. |
| `Push:Subject` | `mailto:hello@headboard.app` | VAPID subject (contact) sent to push services. |
| `Notify:Enabled` | `true` | Runs the daily forgotten-tasks notifier (`StaleNotifier`). |
| `Leases:Enabled` | `true` | Background jobs run only on the instance holding the `jobs` lease in the `Leases` table (see *Running several instances*). `false` = every instance runs every job. |
| `Leases:TtlSeconds` | `180` | How long a lease lasts without renewal; a crashed leader is replaced after this. |
| `Notify:Hour` | `9` | Local hour after which the reminder is evaluated once per day. |
| `Notify:CheckIntervalSeconds` | `60` | Notifier polling interval. |

### Database schema

EF Core migrations live in `Headboard.Api/Data/Migrations` and were generated for **SQLite**
(`dotnet tool run dotnet-ef migrations add <Name>` from `Headboard.Api/`; the tool manifest is
`apps/api/.config/dotnet-tools.json`). On startup the app runs `Migrate()` for SQLite. For
PostgreSQL the schema is created with `EnsureCreated()` because the checked-in migrations carry
SQLite column types; generate Postgres-specific migrations before relying on schema evolution there.

## Dev login

In Development (or with `Auth:AllowDevLogin=true`) you can sign in without Google/Apple:

```bash
curl -s localhost:5080/auth/dev -H 'content-type: application/json' \
  -d '{"email":"you@example.com","name":"Your Name","provider":"Google"}'
# → {"token":"...","user":{"name":"Your Name","email":"you@example.com","provider":"Google","initials":"YN"}}
curl -s localhost:5080/me -H "authorization: Bearer $TOKEN"
```

Never enable dev login outside local development: anyone can obtain a token for any email.

## Endpoints

All endpoints except `/health` and `/auth/*` require `Authorization: Bearer <jwt>`; every row is
scoped to the authenticated user.

| Method | Path | Body → Response |
| --- | --- | --- |
| POST | `/auth/google` | `{idToken}` → `{token, user}` |
| POST | `/auth/apple` | `{idToken, name?}` → `{token, user}` |
| POST | `/auth/dev` | `{email, name?, provider?}` → `{token, user}` (dev only) |
| GET | `/me` | → `User {name, email, provider, initials}` |
| GET | `/tasks?includeArchived=true` | → `Task[]` (archived excluded by default) |
| GET | `/tasks/{id}` | → `Task` |
| POST | `/tasks` | `Task` (id optional; nested `comments` created, `files` linked by id) → `201 Task` |
| PATCH | `/tasks/{id}` | partial `Task` (`"due": null` clears; absent keeps; `history` replaces the log, 400 `invalid_history` on unknown kinds) → `Task` |
| DELETE | `/tasks/{id}` | → 204 (also removes its comments and files) |
| POST | `/tasks/{id}/comments` | `{text, id?, at?}` → `201 Comment` |
| DELETE | `/tasks/{id}/comments/{cid}` | → 204 |
| GET | `/projects` | → `(Project & {files: FileRef[]})[]` |
| POST | `/projects` | `{id?, name, color}` → `201 Project` |
| PATCH | `/projects/{id}` | `{name?, color?}` → `Project` |
| GET/POST | `/templates` | task blueprints `{id, name, title, proj, pr, tags, note, dueInDays, remindDays, usedCount}` → list / `201 Template` |
| PATCH/DELETE | `/templates/{id}` | partial patch (`proj` must exist, `remindDays` 0/1/null) → `Template` / `204` |
| DELETE | `/projects/{id}` | → 204 (tasks keep existing with `proj: null`) |
| POST | `/tags/rename` | `{from, to}` → `{changed, tasks: Task[]}`: renames (or merges into `to`) across all the user's tasks, archived included, in one transaction; each changed task gets a `tags` history entry with `source: "api"` |
| POST | `/tags/remove` | `{tag}` → `{changed, tasks}` |
| GET | `/settings` | → `{lang, theme, showDone, digestText}` |
| PUT | `/settings` | `{lang, theme, showDone, digestText}` → same |
| POST | `/files?taskId=` or `?projectId=` | multipart (first file part) → `201 FileRef` (`kind` `img` for `image/*`, `src` = `/files/{id}/content`) |
| GET | `/files/{id}/content` | → bytes with the stored content type |
| DELETE | `/files/{id}` | → 204 |
| POST | `/ai/extract` | `{text, projects:[{id,name}]}` → `CaptureItem[] {title, pr, tags, proj}` |
| POST | `/ai/digest` | `{stats:{dueN,dueFirst,staleN,oldT,oldI,doneW,focusN,recN}, lang}` → `{text}` |
| GET | `/health` | → `{ok: true}` |

Error bodies are `{"error": "<code>"}`; `/ai/*` return 503 `ai_unavailable` without an API key
and 502 `ai_failed` when the upstream call fails. Prompts and response parsing mirror
`packages/core/src/capture.ts` and `digest.ts` verbatim (`Ai/Prompts.cs`).
