# Graph Report - headboard  (2026-09-10)

## Corpus Check
- 242 files · ~155,171 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1704 nodes · 4890 edges · 109 communities (75 shown, 34 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `08064ac2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTheme
- .InboundAsync
- support.js
- Headboard.Api.Data
- devDependencies
- Task
- web/src/store/sync.ts
- src/index.ts
- ui/Icons.tsx
- TaskRow
- AppDb
- Shell.tsx
- stats.ts
- TaskDrawer.tsx
- expo
- .MapFiles
- useStore
- .Login
- src/App.tsx
- normalizeTags
- PushSubscriptionRow
- FilesTests
- compilerOptions
- Global Constraints
- Headboard.Api.csproj
- history.ts
- tasks.ts
- .LoginAsync
- AiTests
- FakeGoogleCalendar
- search.ts
- model.ts
- .Now
- .ReconcileAsync
- Handoff: Headboard — personal thinking board (Web + iOS)
- core/package.json
- startOfDay
- compilerOptions
- GoogleAuthTests
- Headboard API (.NET 10)
- scripts
- .ComputeStats
- PushEndpoints.cs
- dependencies
- TaskDto
- .ParseExtractResponse
- cx
- Headboard — implementation design (web + mobile + API)
- Headboard.Api.Data.Migrations
- .Apply
- CalendarState
- PushTests
- FakeAnthropicHandler
- mobile/package.json
- AnthropicClient
- .MapTemplates
- Global Constraints
- Global Constraints
- .MapAi
- due.ts
- ApiFactory
- AuthTests
- Leases
- 20260908183441_Initial.Designer.cs
- tokens.ts
- scripts
- providers.d.ts
- Migration
- ArchivedAt
- DigestSchedule
- 20260910111015_SeriesId.Designer.cs
- PushSubscriptions
- DueReminders
- Templates
- 20260910111625_Leases.Designer.cs
- .Recur_AcceptsDailyWeeklyMonthly_RejectsOthers
- .SendAsync
- mobile/tsconfig.json
- projects.ts
- Headboard
- 20260909173924_ArchivedAt.Designer.cs
- .Crud_And_Validation_And_Isolation
- expo-auth-session
- 20260910075741_Templates.Designer.cs
- tailwind.config.ts
- expo
- expo-apple-authentication
- expo-document-picker
- expo-file-system
- expo-font
- @expo-google-fonts/golos-text
- @expo-google-fonts/ibm-plex-mono
- expo-image-picker
- expo-notifications
- expo-sharing
- expo-splash-screen
- expo-status-bar
- expo-web-browser
- @headboard/core
- react
- @react-native-async-storage/async-storage
- react-native-svg

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 91 edges
2. `useStore` - 90 edges
3. `txt()` - 84 edges
4. `useStore` - 81 edges
5. `useT()` - 81 edges
6. `useT()` - 76 edges
7. `cx()` - 74 edges
8. `Task` - 48 edges
9. `fmtDate()` - 47 edges
10. `Headboard.Api.Data` - 41 edges

## Surprising Connections (you probably didn't know these)
- `Root()` --calls--> `todayLabel()`  [EXTRACTED]
  apps/mobile/App.tsx → packages/core/src/dates.ts
- `Root()` --calls--> `digestStats`  [EXTRACTED]
  apps/mobile/App.tsx → packages/core/src/digest.ts
- `RecurChips()` --calls--> `recurLabel()`  [EXTRACTED]
  apps/mobile/src/components/DueControls.tsx → packages/core/src/i18n.ts
- `StatusPicker()` --calls--> `statusLabel()`  [EXTRACTED]
  apps/mobile/src/components/StatusPriority.tsx → packages/core/src/i18n.ts
- `PriorityDots()` --calls--> `priorityLabel()`  [EXTRACTED]
  apps/mobile/src/components/StatusPriority.tsx → packages/core/src/i18n.ts

## Import Cycles
- None detected.

## Communities (109 total, 34 thin omitted)

### Community 0 - "useTheme"
Cohesion: 0.05
Nodes (149): plugins, Root(), useDevAutologin(), CalendarSyncCard(), DueButton(), RecurChips(), RemindChips(), AttachButtonM() (+141 more)

### Community 1 - ".InboundAsync"
Cohesion: 0.07
Nodes (33): HttpContext, IConfiguration, IEndpointRouteBuilder, CalendarEndpoints, CancellationToken, Guid, List, string (+25 more)

### Community 2 - "support.js"
Cohesion: 0.07
Nodes (52): boot(), cdnScriptFor(), collectProps(), compileAttr(), compileTemplate(), contentKey(), createComponentFactory(), createExternalModules() (+44 more)

### Community 3 - "Headboard.Api.Data"
Cohesion: 0.10
Nodes (20): CalendarStatusDto, ConnectRequest, CreateCommentRequest, ProjectPatch, RemoveTagRequest, RenameTagRequest, TagOpResult, Headboard.Api.Jobs (+12 more)

### Community 4 - "devDependencies"
Cohesion: 0.04
Nodes (44): dependencies, @headboard/core, react, react-dom, zustand, devDependencies, autoprefixer, jsdom (+36 more)

### Community 5 - "Task"
Cohesion: 0.14
Nodes (27): Actions, PersistedSlice, Actions, PersistedSlice, RowItem, Api, ApiError, AuthResponse (+19 more)

### Community 6 - "web/src/store/sync.ts"
Cohesion: 0.24
Nodes (14): msg, providerConfigured(), signInWith(), appleIdToken(), googleAuthorizationCode(), loaded, loadScript(), getEngine() (+6 more)

### Community 7 - "src/index.ts"
Cohesion: 0.14
Nodes (23): BAR, Button(), ButtonProps, Dot(), Empty(), HOVER, Kicker(), KICKER_SIZE (+15 more)

### Community 8 - "ui/Icons.tsx"
Cohesion: 0.11
Nodes (36): base(), IcArchive(), IcArrowUp(), IcBell(), IcBoard(), IcCalendar(), IcCheck(), IcChevronDown() (+28 more)

### Community 9 - "TaskRow"
Cohesion: 0.20
Nodes (10): TaskRow, IEndpointRouteBuilder, TaskEndpoints, Guid, IEnumerable, JsonElement, List, Snapshot (+2 more)

### Community 10 - "AppDb"
Cohesion: 0.18
Nodes (12): ModelBuilder, AppDb, Guid, CommentRow, FileRow, LeaseRow, ProjectRow, SettingsRow (+4 more)

### Community 11 - "Shell.tsx"
Cohesion: 0.24
Nodes (16): Sidebar(), TopBar(), IcSpark(), useNow(), CalendarView(), DigestView(), BAR, DueView() (+8 more)

### Community 12 - "stats.ts"
Cohesion: 0.24
Nodes (17): StatsScreen(), StatsView(), addDays(), completionStreak(), IDLE_BUCKETS, IdleBucketKey, idleBuckets(), medianDaysToClose() (+9 more)

### Community 13 - "TaskDrawer.tsx"
Cohesion: 0.21
Nodes (13): AttachButton(), FileChip(), DueDateInput(), fromInput(), RecurPicker(), RemindPicker(), toInput(), BAR (+5 more)

### Community 14 - "expo"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, projectId (+17 more)

### Community 15 - ".MapFiles"
Cohesion: 0.21
Nodes (7): HashSet, IEndpointRouteBuilder, FileEndpoints, CancellationToken, Guid, LocalStorage, Stream

### Community 16 - "useStore"
Cohesion: 0.10
Nodes (43): CaptureModal(), FilePreviewModal(), ProjectList(), TagEditor(), HistoryPeek(), PriorityDots(), StatusSelect(), useT() (+35 more)

### Community 17 - ".Login"
Cohesion: 0.07
Nodes (23): CancellationToken, string, AppleVerifier, IEndpointRouteBuilder, string, AuthEndpoints, AuthResponse, DevLoginRequest (+15 more)

### Community 18 - "src/App.tsx"
Cohesion: 0.12
Nodes (18): App(), Logo(), Size, SIZES, Avatar(), ProfileBlock(), SyncStatus(), Shell() (+10 more)

### Community 19 - "normalizeTags"
Cohesion: 0.17
Nodes (18): guessProject(), heuristicExtract(), parseExtractResponse(), PROJECT_KEYWORDS, cannedDigest(), digestStatsLine(), now, projects (+10 more)

### Community 20 - "PushSubscriptionRow"
Cohesion: 0.16
Nodes (16): PushSubscriptionRow, CancellationToken, string, ExpoPushSender, IPushSender, PushPayload, PushResult, WebPushSender (+8 more)

### Community 21 - "FilesTests"
Cohesion: 0.22
Nodes (8): Fact, InlineData, JsonSerializerOptions, Theory, FilesTests, byte, IClassFixture, MultipartFormDataContent

### Community 22 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+13 more)

### Community 23 - "Global Constraints"
Cohesion: 0.10
Nodes (20): Global Constraints, Headboard Web + Core Implementation Plan, Task 10: Shell + TopBar + Board, Task 11: Task drawer, Task 12: Review view, Task 13: Calendar view, Task 14: Sign-in gate + profile, Task 15: Digest view (+12 more)

### Community 24 - "Headboard.Api.csproj"
Cohesion: 0.11
Nodes (18): net10.0, Headboard.Api.Tests, net10.0, coverlet.collector (6.0.4), Google.Apis.Auth (1.76.0), Microsoft.AspNetCore.Authentication.JwtBearer (10.0.11), Microsoft.AspNetCore.Mvc.Testing (10.0.11), Microsoft.AspNetCore.OpenApi (10.0.11) (+10 more)

### Community 25 - "history.ts"
Cohesion: 0.11
Nodes (26): buildSeed(), buildSeed(), now, reset(), createdEntry(), diffTask(), entry(), historyByDay() (+18 more)

### Community 26 - "tasks.ts"
Cohesion: 0.17
Nodes (17): IdleBadge(), commentTime(), fmtTime(), sizeHuman(), digestStats, dict, EN, RU (+9 more)

### Community 27 - ".LoginAsync"
Cohesion: 0.12
Nodes (13): HttpClient, Fact, InlineData, JsonSerializerOptions, Theory, ArchiveTests, CommentMergeTests, HistoryTests (+5 more)

### Community 28 - "AiTests"
Cohesion: 0.24
Nodes (5): IEnumerable, Fact, JsonSerializerOptions, object, AiTests

### Community 29 - "FakeGoogleCalendar"
Cohesion: 0.24
Nodes (7): Dictionary, Fact, Guid, HttpClient, List, CalendarTests, FakeGoogleCalendar

### Community 30 - "search.ts"
Cohesion: 0.19
Nodes (14): Marked(), Status, excerpt(), hasAll(), highlight(), MatchField, SearchHit, SearchOptions (+6 more)

### Community 31 - "model.ts"
Cohesion: 0.20
Nodes (15): UiSlice, UiSlice, capHistory(), mergeById(), mergeTask(), SCALARS, taskDelta(), base (+7 more)

### Community 32 - ".Now"
Cohesion: 0.11
Nodes (14): Guid, HttpContext, CurrentUser, IEndpointRouteBuilder, CommentEndpoints, IEndpointRouteBuilder, ProjectEndpoints, IEndpointRouteBuilder (+6 more)

### Community 33 - ".ReconcileAsync"
Cohesion: 0.06
Nodes (32): CancellationToken, Guid, CalendarSyncScheduler, int, TimeZoneInfo, DigestSchedule, CancellationToken, DigestScheduler (+24 more)

### Community 34 - "Handoff: Headboard — personal thinking board (Web + iOS)"
Cohesion: 0.12
Nodes (15): About the Design Files, Assets, Design Tokens, Fidelity, Files, Handoff: Headboard — personal thinking board (Web + iOS), Interactions & Behavior, iOS (402×874, фрейм `ios-frame.jsx` — только презентация) (+7 more)

### Community 35 - "core/package.json"
Cohesion: 0.12
Nodes (15): devDependencies, typescript, vitest, exports, typescript, vitest, main, name (+7 more)

### Community 36 - "startOfDay"
Cohesion: 0.19
Nodes (15): buildMonthGrid(), buildSnoozeGrid(), gridStart(), MonthDay, SnoozeDay, SnoozePreset, SnoozePresetKey, snoozePresetLabel() (+7 more)

### Community 37 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, lib, module, moduleResolution, noEmit, skipLibCheck, strict, target (+6 more)

### Community 38 - "GoogleAuthTests"
Cohesion: 0.18
Nodes (8): CancellationToken, Dictionary, Fact, HttpRequestMessage, HttpResponseMessage, FakeGoogleTokenHandler, GoogleAuthTests, HttpMessageHandler

### Community 39 - "Headboard API (.NET 10)"
Cohesion: 0.13
Nodes (14): Configuration, Database schema, Dev login, Endpoints, Google Calendar sync, Headboard API (.NET 10), Morning digest, Push reminders about deadlines (+6 more)

### Community 40 - "scripts"
Cohesion: 0.14
Nodes (13): name, private, scripts, api, build, dev, mobile, test (+5 more)

### Community 41 - ".ComputeStats"
Cohesion: 0.21
Nodes (8): DigestStatsDto, CancellationToken, Guid, int, IReadOnlyList, long, TimeZoneInfo, DigestService

### Community 42 - "PushEndpoints.cs"
Cohesion: 0.14
Nodes (7): PushConfigDto, PushSubscriptionDto, SubscribeKeys, SubscribeRequest, UnsubscribeRequest, Headboard.Api.Push, Headboard.Api.Ai

### Community 43 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, expo-constants, expo-crypto, expo-device, react-native, react-native-safe-area-context, zustand, zustand (+5 more)

### Community 44 - "TaskDto"
Cohesion: 0.20
Nodes (9): FileRefDto, List, ProjectDto, List, CommentDto, HistoryEntryDto, TaskDto, Guid (+1 more)

### Community 45 - ".ParseExtractResponse"
Cohesion: 0.31
Nodes (6): IReadOnlyList, JsonElement, List, CaptureItemDto, ExtractProject, Prompts

### Community 46 - "cx"
Cohesion: 0.20
Nodes (14): NavItem(), Chip(), cx(), DayCell(), RowList(), ColorSwatches(), ChartCard(), DataTable() (+6 more)

### Community 47 - "Headboard — implementation design (web + mobile + API)"
Cohesion: 0.18
Nodes (10): API, Build order, Data model (packages/core), Decisions, Goal, Headboard — implementation design (web + mobile + API), Mobile screens, Repository layout (npm workspaces) (+2 more)

### Community 48 - "Headboard.Api.Data.Migrations"
Cohesion: 0.08
Nodes (14): ModelBuilder, DigestSchedule, ModelBuilder, GoogleCalendar, ModelBuilder, PushSubscriptions, ModelBuilder, DueReminders (+6 more)

### Community 49 - ".Apply"
Cohesion: 0.24
Nodes (7): HttpContext, IEndpointRouteBuilder, List, TagEndpoints, Func, GeneratedRegex, Regex

### Community 50 - "CalendarState"
Cohesion: 0.31
Nodes (4): Guid, TimeSpan, CalendarState, CalendarStatePayload

### Community 51 - "PushTests"
Cohesion: 0.27
Nodes (5): string, StaleMessage, Fact, object, PushTests

### Community 52 - "FakeAnthropicHandler"
Cohesion: 0.28
Nodes (5): CancellationToken, HttpRequestMessage, HttpResponseMessage, FakeAnthropicHandler, HttpStatusCode

### Community 53 - "mobile/package.json"
Cohesion: 0.20
Nodes (9): devDependencies, @types/react, typescript, @types/react, typescript, main, name, private (+1 more)

### Community 54 - "AnthropicClient"
Cohesion: 0.22
Nodes (7): CancellationToken, int, string, AnthropicClient, AnthropicException, GoogleApiException, Exception

### Community 55 - ".MapTemplates"
Cohesion: 0.36
Nodes (5): TemplateRow, IEndpointRouteBuilder, List, TemplateDto, TemplateEndpoints

### Community 56 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Headboard API Implementation Plan (.NET 10), Task 1: Solution, project, EF model, SQLite, Task 2: Auth (Google/Apple id-token → JWT, dev login), Task 3: Tasks, comments, projects, settings, Task 4: Files, Task 5: AI endpoints (Anthropic), Task 6: OpenAPI, README, run script

### Community 57 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Headboard Mobile Implementation Plan (Expo / React Native), Task 1: App scaffold, theme, fonts, store, Task 2: Header, title, tab bar, sign-in, Task 3: Board screen, Task 4: Task sheet, capture sheet, snooze sheet, profile sheet, Task 5: Review, Digest, Calendar screens, file preview, Task 6: Verify on iOS simulator (light/dark, EN/RU) and Android emulator if available; `npm run -w @headboard/mobile typecheck` green.

### Community 58 - ".MapAi"
Cohesion: 0.29
Nodes (5): IEndpointRouteBuilder, AiEndpoints, DigestRequest, ExtractRequest, IResult

### Community 59 - "due.ts"
Cohesion: 0.25
Nodes (7): DueGroup, DueGroupKey, dueReminderTargets(), REMIND_OPTIONS, RemindDays, mk(), now

### Community 60 - "ApiFactory"
Cohesion: 0.17
Nodes (9): Program, HttpMessageHandler, JsonSerializerOptions, ApiFactory, HttpMessageHandler, TestAnthropic, IServiceCollection, IWebHostBuilder (+1 more)

### Community 65 - "tokens.ts"
Cohesion: 0.39
Nodes (4): DARK, LIGHT, TokenName, Tokens

### Community 66 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, ios, start, typecheck, web

### Community 68 - "Migration"
Cohesion: 0.11
Nodes (9): MigrationBuilder, Initial, MigrationBuilder, GoogleCalendar, MigrationBuilder, TaskHistory, MigrationBuilder, SeriesId (+1 more)

### Community 77 - ".SendAsync"
Cohesion: 0.50
Nodes (3): CancellationToken, HttpRequestMessage, HttpResponseMessage

### Community 78 - "mobile/tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 79 - "projects.ts"
Cohesion: 0.80
Nodes (3): newProject(), nextProjectColor(), PROJECT_PALETTE

### Community 80 - "Headboard"
Cohesion: 0.40
Nodes (4): Design rules enforced in code, Headboard, Layout, Run

## Knowledge Gaps
- **320 isolated node(s):** `net10.0`, `coverlet.collector (6.0.4)`, `Microsoft.AspNetCore.Mvc.Testing (10.0.11)`, `Microsoft.NET.Test.Sdk (17.14.1)`, `xunit (2.9.3)` (+315 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Headboard.Api.Data` connect `Headboard.Api.Data` to `20260908183441_Initial.Designer.cs`, `20260910111015_SeriesId.Designer.cs`, `AppDb`, `20260910111625_Leases.Designer.cs`, `PushEndpoints.cs`, `Headboard.Api.Data.Migrations`, `.Login`, `20260909173924_ArchivedAt.Designer.cs`, `PushSubscriptionRow`, `20260910075741_Templates.Designer.cs`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `Headboard.Api.Data.Migrations` connect `Headboard.Api.Data.Migrations` to `20260908183441_Initial.Designer.cs`, `Migration`, `ArchivedAt`, `DigestSchedule`, `20260910111015_SeriesId.Designer.cs`, `PushSubscriptions`, `DueReminders`, `Templates`, `20260910111625_Leases.Designer.cs`, `20260909173924_ArchivedAt.Designer.cs`, `20260910075741_Templates.Designer.cs`, `Leases`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `plugins` connect `useTheme` to `expo`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `net10.0`, `coverlet.collector (6.0.4)`, `Microsoft.AspNetCore.Mvc.Testing (10.0.11)` to the rest of the system?**
  _320 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.05132543711223914 - nodes in this community are weakly interconnected._
- **Should `.InboundAsync` be split into smaller, more focused modules?**
  _Cohesion score 0.06693803708729082 - nodes in this community are weakly interconnected._
- **Should `support.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0673076923076923 - nodes in this community are weakly interconnected._