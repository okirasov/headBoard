# Headboard API (.NET 10)

Minimal-API backend for Headboard: per-user persistence of the core model
(`packages/core/src/model.ts`), Google/Apple sign-in exchanged for a JWT, and AI
task extraction / digest generation through the Anthropic Messages API.

- Solution: `Headboard.Api.sln` → `Headboard.Api` (app) and `Headboard.Api.Tests` (xunit).
- Listens on `http://localhost:5080`.
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
| PATCH | `/tasks/{id}` | partial `Task` (`"due": null` clears; absent keeps) → `Task` |
| DELETE | `/tasks/{id}` | → 204 (also removes its comments and files) |
| POST | `/tasks/{id}/comments` | `{text, id?, at?}` → `201 Comment` |
| DELETE | `/tasks/{id}/comments/{cid}` | → 204 |
| GET | `/projects` | → `(Project & {files: FileRef[]})[]` |
| POST | `/projects` | `{id?, name, color}` → `201 Project` |
| PATCH | `/projects/{id}` | `{name?, color?}` → `Project` |
| DELETE | `/projects/{id}` | → 204 (tasks keep existing with `proj: null`) |
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
