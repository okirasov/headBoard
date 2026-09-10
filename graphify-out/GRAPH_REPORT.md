# Graph Report - headboard  (2026-09-11)

## Corpus Check
- 256 files · ~165,616 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1773 nodes · 5240 edges · 118 communities (85 shown, 33 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a804b10d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useStore
- .InboundAsync
- support.js
- Headboard.Api.Data
- devDependencies
- src/api.ts
- web/src/lib/auth.ts
- src/index.ts
- ui/Icons.tsx
- TaskRow
- AppDb
- RecurringView.tsx
- startOfDay
- TaskDrawer.tsx
- expo
- .MapFiles
- useStore
- .Login
- ProfileMenu.tsx
- normalizeTags
- PushSubscriptionRow
- FilesTests
- compilerOptions
- Global Constraints
- Headboard.Api.csproj
- history.ts
- TaskCard.tsx
- .LoginAsync
- AiTests
- FakeGoogleCalendar
- search.ts
- Task
- .Now
- .IsDue
- Handoff: Headboard — personal thinking board (Web + iOS)
- core/package.json
- components/Icons.tsx
- compilerOptions
- web/src/store/useStore.ts
- Headboard API (.NET 10)
- scripts
- .ComputeStats
- PushEndpoints.cs
- dependencies
- txt
- .ParseExtractResponse
- mobile/App.tsx
- Headboard — implementation design (web + mobile + API)
- Headboard.Api.Data.Migrations
- .Apply
- CalendarState
- PushTests
- FakeAnthropicHandler
- mobile/package.json
- useTheme
- .MapTemplates
- Global Constraints
- Global Constraints
- .MapAi
- mobile/src/store/useStore.ts
- ApiFactory
- AuthTests
- mobile/src/lib/auth.ts
- 20260908183441_Initial.Designer.cs
- tokens.ts
- scripts
- providers.d.ts
- Migration
- newTask
- DigestSchedule
- .ReconcileAsync
- PushSubscriptions
- DueReminders
- Templates
- 20260910111625_Leases.Designer.cs
- AppleVerifier
- .Build
- mobile/tsconfig.json
- projects.ts
- Headboard
- 20260909173924_ArchivedAt.Designer.cs
- TagsScreen.tsx
- expo-auth-session
- .RunOnceAsync
- type.ts
- SignIn.tsx
- tailwind.config.ts
- expo
- expo-apple-authentication
- LeaseTests
- expo-document-picker
- expo-file-system
- expo-font
- @expo-google-fonts/golos-text
- @expo-google-fonts/ibm-plex-mono
- expo-image-picker
- expo-notifications
- GoogleCalendar
- expo-splash-screen
- expo-status-bar
- expo-web-browser
- @headboard/core
- react
- @react-native-async-storage/async-storage
- react-native-svg
- StaleDays
- TagEndpoints.cs
- 20260909175553_DigestSchedule.Designer.cs
- 20260910060446_DueReminders.Designer.cs
- 20260910092816_TaskHistory.Designer.cs
- expo-constants

## God Nodes (most connected - your core abstractions)
1. `useStore` - 106 edges
2. `useTheme()` - 101 edges
3. `txt()` - 94 edges
4. `useT()` - 94 edges
5. `useStore` - 93 edges
6. `useT()` - 87 edges
7. `cx()` - 81 edges
8. `Task` - 53 edges
9. `fmtDate()` - 47 edges
10. `Headboard.Api.Data` - 42 edges

## Surprising Connections (you probably didn't know these)
- `Root()` --calls--> `todayLabel()`  [EXTRACTED]
  apps/mobile/App.tsx → packages/core/src/dates.ts
- `Root()` --calls--> `digestStats`  [EXTRACTED]
  apps/mobile/App.tsx → packages/core/src/digest.ts
- `BulkBarM()` --calls--> `priorityLabel()`  [EXTRACTED]
  apps/mobile/src/components/BulkBarM.tsx → packages/core/src/i18n.ts
- `BulkBarM()` --calls--> `statusLabel()`  [EXTRACTED]
  apps/mobile/src/components/BulkBarM.tsx → packages/core/src/i18n.ts
- `RecurChips()` --calls--> `recurLabel()`  [EXTRACTED]
  apps/mobile/src/components/DueControls.tsx → packages/core/src/i18n.ts

## Import Cycles
- None detected.

## Communities (118 total, 33 thin omitted)

### Community 0 - "useStore"
Cohesion: 0.15
Nodes (35): DueButton(), RecurChips(), RemindChips(), FilePreviewM(), Snack(), EmptyLine(), useT(), ArchiveScreen() (+27 more)

### Community 1 - ".InboundAsync"
Cohesion: 0.06
Nodes (40): CancellationToken, int, string, AnthropicClient, AnthropicException, HttpContext, IConfiguration, IEndpointRouteBuilder (+32 more)

### Community 2 - "support.js"
Cohesion: 0.07
Nodes (52): boot(), cdnScriptFor(), collectProps(), compileAttr(), compileTemplate(), contentKey(), createComponentFactory(), createExternalModules() (+44 more)

### Community 3 - "Headboard.Api.Data"
Cohesion: 0.10
Nodes (18): CalendarStatusDto, ConnectRequest, CreateCommentRequest, ProjectPatch, Headboard.Api.Jobs, Headboard.Api.Push, Headboard.Api.Files, Headboard.Api.Settings (+10 more)

### Community 4 - "devDependencies"
Cohesion: 0.04
Nodes (44): dependencies, @headboard/core, react, react-dom, zustand, devDependencies, autoprefixer, jsdom (+36 more)

### Community 5 - "src/api.ts"
Cohesion: 0.14
Nodes (22): PersistedSlice, PersistedSlice, Api, ApiError, AuthResponse, CalendarStatus, createApi(), ProjectWithFiles (+14 more)

### Community 6 - "web/src/lib/auth.ts"
Cohesion: 0.42
Nodes (7): msg, providerConfigured(), signInWith(), appleIdToken(), googleAuthorizationCode(), loaded, loadScript()

### Community 7 - "src/index.ts"
Cohesion: 0.16
Nodes (24): BAR, NavItem(), Button(), ButtonProps, Chip(), Dot(), Empty(), HOVER (+16 more)

### Community 8 - "ui/Icons.tsx"
Cohesion: 0.12
Nodes (34): base(), IcArchive(), IcArrowUp(), IcBell(), IcBoard(), IcCalendar(), IcCheck(), IcChevronDown() (+26 more)

### Community 9 - "TaskRow"
Cohesion: 0.14
Nodes (16): TaskRow, List, CommentDto, HistoryEntryDto, TaskDto, Guid, IEndpointRouteBuilder, List (+8 more)

### Community 10 - "AppDb"
Cohesion: 0.14
Nodes (16): ModelBuilder, AppDb, Guid, CommentRow, FileRow, LeaseRow, ProjectRow, SettingsRow (+8 more)

### Community 11 - "RecurringView.tsx"
Cohesion: 0.25
Nodes (12): DueDateInput(), fromInput(), RecurPicker(), RemindPicker(), toInput(), BAR, Row(), BAR (+4 more)

### Community 12 - "startOfDay"
Cohesion: 0.07
Nodes (48): StatsScreen(), ChartCard(), DataTable(), GroupedBar, GroupedBars(), HBars(), StackedBar(), StatTile() (+40 more)

### Community 13 - "TaskDrawer.tsx"
Cohesion: 0.20
Nodes (14): AttachButton(), FileChip(), TagEditor(), BAR, DrawerBody(), TaskDrawer(), autoGrow(), EditableTitle() (+6 more)

### Community 14 - "expo"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, projectId (+17 more)

### Community 15 - ".MapFiles"
Cohesion: 0.21
Nodes (7): HashSet, IEndpointRouteBuilder, FileEndpoints, CancellationToken, Guid, LocalStorage, Stream

### Community 16 - "useStore"
Cohesion: 0.12
Nodes (39): CaptureModal(), FilePreviewModal(), SyncStatus(), ProjectList(), Shell(), TopBar(), SnoozePicker(), HistoryPeek() (+31 more)

### Community 17 - ".Login"
Cohesion: 0.13
Nodes (13): IEndpointRouteBuilder, string, AuthEndpoints, AuthResponse, DevLoginRequest, GoogleLoginRequest, IdTokenRequest, UserDto (+5 more)

### Community 18 - "ProfileMenu.tsx"
Cohesion: 0.16
Nodes (21): App(), Avatar(), ProfileBlock(), pickAndImportBackup(), disablePush(), enablePush(), pushState, registerServiceWorker() (+13 more)

### Community 19 - "normalizeTags"
Cohesion: 0.19
Nodes (16): guessProject(), heuristicExtract(), parseExtractResponse(), PROJECT_KEYWORDS, now, projects, clampPriority(), normalizeTag() (+8 more)

### Community 20 - "PushSubscriptionRow"
Cohesion: 0.16
Nodes (16): PushSubscriptionRow, CancellationToken, string, ExpoPushSender, IPushSender, PushPayload, PushResult, WebPushSender (+8 more)

### Community 21 - "FilesTests"
Cohesion: 0.24
Nodes (7): Fact, InlineData, JsonSerializerOptions, Theory, FilesTests, byte, MultipartFormDataContent

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
Cohesion: 0.17
Nodes (15): createdEntry(), diffTask(), entry(), historyByDay(), historyId(), base, now, projects (+7 more)

### Community 26 - "TaskCard.tsx"
Cohesion: 0.15
Nodes (29): DigestScreen(), Sidebar(), BoardView(), BAR, IdleBadge(), TaskCard(), TONE, CalendarView() (+21 more)

### Community 27 - ".LoginAsync"
Cohesion: 0.10
Nodes (16): HttpClient, Fact, RecurTests, Fact, InlineData, JsonSerializerOptions, Theory, AccountDeletionTests (+8 more)

### Community 28 - "AiTests"
Cohesion: 0.19
Nodes (6): IEnumerable, Fact, JsonSerializerOptions, object, AiTests, HttpStatusCode

### Community 29 - "FakeGoogleCalendar"
Cohesion: 0.09
Nodes (18): CancellationToken, Dictionary, Fact, Guid, HttpClient, HttpRequestMessage, HttpResponseMessage, List (+10 more)

### Community 30 - "search.ts"
Cohesion: 0.19
Nodes (14): Marked(), Status, excerpt(), hasAll(), highlight(), MatchField, SearchHit, SearchOptions (+6 more)

### Community 31 - "Task"
Cohesion: 0.13
Nodes (20): shareBackup(), downloadBackup(), RowItem, Backup, backupFilename(), exportBackup(), ImportResult, isObj() (+12 more)

### Community 32 - ".Now"
Cohesion: 0.11
Nodes (14): Guid, HttpContext, CurrentUser, IEndpointRouteBuilder, CommentEndpoints, IEndpointRouteBuilder, ProjectEndpoints, IEndpointRouteBuilder (+6 more)

### Community 33 - ".IsDue"
Cohesion: 0.23
Nodes (6): int, TimeZoneInfo, DigestSchedule, Fact, DigestScheduleTests, DateOnly

### Community 34 - "Handoff: Headboard — personal thinking board (Web + iOS)"
Cohesion: 0.12
Nodes (15): About the Design Files, Assets, Design Tokens, Fidelity, Files, Handoff: Headboard — personal thinking board (Web + iOS), Interactions & Behavior, iOS (402×874, фрейм `ios-frame.jsx` — только презентация) (+7 more)

### Community 35 - "core/package.json"
Cohesion: 0.12
Nodes (15): devDependencies, typescript, vitest, exports, typescript, vitest, main, name (+7 more)

### Community 36 - "components/Icons.tsx"
Cohesion: 0.09
Nodes (32): BulkBarM(), MOVE_TO, IcArchive(), IcBell(), IcBoard(), IcCalendar(), IcCheck(), IcChevronDown() (+24 more)

### Community 37 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, lib, module, moduleResolution, noEmit, skipLibCheck, strict, target (+6 more)

### Community 38 - "web/src/store/useStore.ts"
Cohesion: 0.12
Nodes (19): PriorityDots(), StatusSelect(), initialPersisted, initialUi, Preview, Store, BulkBar(), MOVE_TO (+11 more)

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
Cohesion: 0.33
Nodes (5): PushConfigDto, PushSubscriptionDto, SubscribeKeys, SubscribeRequest, UnsubscribeRequest

### Community 43 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, expo-crypto, expo-device, expo-sharing, react-native, react-native-safe-area-context, zustand, zustand (+5 more)

### Community 44 - "txt"
Cohesion: 0.19
Nodes (19): IcComment(), IcPaperclip(), IcSpark(), IcTemplate(), TaskCardM(), Btn(), Chip(), Dot() (+11 more)

### Community 45 - ".ParseExtractResponse"
Cohesion: 0.31
Nodes (6): IReadOnlyList, JsonElement, List, CaptureItemDto, ExtractProject, Prompts

### Community 46 - "mobile/App.tsx"
Cohesion: 0.19
Nodes (16): Root(), useDevAutologin(), IcChevronLeft(), IcChevronRight(), Sheet(), listenForNotificationTaps(), useNow(), CalendarScreen() (+8 more)

### Community 47 - "Headboard — implementation design (web + mobile + API)"
Cohesion: 0.18
Nodes (10): API, Build order, Data model (packages/core), Decisions, Goal, Headboard — implementation design (web + mobile + API), Mobile screens, Repository layout (npm workspaces) (+2 more)

### Community 48 - "Headboard.Api.Data.Migrations"
Cohesion: 0.08
Nodes (14): ModelBuilder, GoogleCalendar, ModelBuilder, PushSubscriptions, ModelBuilder, Templates, ModelBuilder, SeriesId (+6 more)

### Community 49 - ".Apply"
Cohesion: 0.24
Nodes (7): HttpContext, IEndpointRouteBuilder, List, TagEndpoints, Func, GeneratedRegex, Regex

### Community 50 - "CalendarState"
Cohesion: 0.31
Nodes (4): Guid, TimeSpan, CalendarState, CalendarStatePayload

### Community 51 - "PushTests"
Cohesion: 0.24
Nodes (5): Fact, object, PushTests, Fact, TemplatesTests

### Community 52 - "FakeAnthropicHandler"
Cohesion: 0.24
Nodes (7): CancellationToken, HttpMessageHandler, HttpRequestMessage, HttpResponseMessage, FakeAnthropicHandler, TestAnthropic, IServiceCollection

### Community 53 - "mobile/package.json"
Cohesion: 0.20
Nodes (9): devDependencies, @types/react, typescript, @types/react, typescript, main, name, private (+1 more)

### Community 54 - "useTheme"
Cohesion: 0.20
Nodes (18): AttachButtonM(), FileChipM(), IcX(), PriorityDots(), StatusPicker(), TagEditorM(), IdleBadge(), ChatLinkM() (+10 more)

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

### Community 59 - "mobile/src/store/useStore.ts"
Cohesion: 0.20
Nodes (17): Actions, initialPersisted, initialUi, Preview, Store, UiSlice, Actions, UiSlice (+9 more)

### Community 60 - "ApiFactory"
Cohesion: 0.25
Nodes (6): Program, HttpMessageHandler, JsonSerializerOptions, ApiFactory, IWebHostBuilder, WebApplicationFactory

### Community 61 - "AuthTests"
Cohesion: 0.39
Nodes (3): Fact, AuthTests, IClassFixture

### Community 62 - "mobile/src/lib/auth.ts"
Cohesion: 0.22
Nodes (16): plugins, appleOrDevSignIn(), appleSignIn(), devOrMockSignIn(), finish(), msg, ru(), useGoogleSignIn() (+8 more)

### Community 65 - "tokens.ts"
Cohesion: 0.39
Nodes (4): DARK, LIGHT, TokenName, Tokens

### Community 66 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, ios, start, typecheck, web

### Community 68 - "Migration"
Cohesion: 0.09
Nodes (11): MigrationBuilder, Initial, MigrationBuilder, ArchivedAt, MigrationBuilder, TaskHistory, MigrationBuilder, SeriesId (+3 more)

### Community 69 - "newTask"
Cohesion: 0.22
Nodes (12): buildSeed(), buildSeed(), now, reset(), withHistory(), newTask(), nextDueAfterCompletion(), nextOccurrence() (+4 more)

### Community 71 - ".ReconcileAsync"
Cohesion: 0.23
Nodes (9): CancellationToken, Guid, CalendarSyncScheduler, CancellationToken, string, TimeSpan, LeaderLease, Channel (+1 more)

### Community 76 - "AppleVerifier"
Cohesion: 0.14
Nodes (9): CancellationToken, string, AppleVerifier, CancellationToken, IEnumerable, string, ExternalIdentity, GoogleVerifier (+1 more)

### Community 77 - ".Build"
Cohesion: 0.20
Nodes (9): CancellationToken, IEnumerable, List, long, TimeZoneInfo, DueNotifier, Fact, long (+1 more)

### Community 78 - "mobile/tsconfig.json"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 79 - "projects.ts"
Cohesion: 0.80
Nodes (3): newProject(), nextProjectColor(), PROJECT_PALETTE

### Community 80 - "Headboard"
Cohesion: 0.40
Nodes (4): Design rules enforced in code, Headboard, Layout, Run

### Community 82 - "TagsScreen.tsx"
Cohesion: 0.25
Nodes (13): CalendarSyncCard(), Card(), Row(), TagsScreen(), deleteAccount(), getEngine(), mimeOf(), refreshSettings() (+5 more)

### Community 84 - ".RunOnceAsync"
Cohesion: 0.21
Nodes (8): CancellationToken, DigestScheduler, string, StaleMessage, CancellationToken, int, StaleNotifier, BackgroundService

### Community 85 - "type.ts"
Cohesion: 0.19
Nodes (10): Header(), IcSearch(), Logo(), Mark(), PulseDot(), MONO, SANS, TxtOpts (+2 more)

### Community 86 - "SignIn.tsx"
Cohesion: 0.29
Nodes (4): Logo(), Size, SIZES, SignIn()

### Community 113 - "TagEndpoints.cs"
Cohesion: 0.40
Nodes (4): RemoveTagRequest, RenameTagRequest, TagOpResult, Headboard.Api.Tags

## Knowledge Gaps
- **327 isolated node(s):** `net10.0`, `coverlet.collector (6.0.4)`, `Microsoft.AspNetCore.Mvc.Testing (10.0.11)`, `Microsoft.NET.Test.Sdk (17.14.1)`, `xunit (2.9.3)` (+322 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Headboard.Api.Data` connect `Headboard.Api.Data` to `20260908183441_Initial.Designer.cs`, `AppDb`, `20260910111625_Leases.Designer.cs`, `PushEndpoints.cs`, `Headboard.Api.Data.Migrations`, `.Login`, `20260909173924_ArchivedAt.Designer.cs`, `20260909175553_DigestSchedule.Designer.cs`, `20260910060446_DueReminders.Designer.cs`, `20260910092816_TaskHistory.Designer.cs`, `PushSubscriptionRow`, `TagEndpoints.cs`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `Headboard.Api.Data.Migrations` connect `Headboard.Api.Data.Migrations` to `20260908183441_Initial.Designer.cs`, `GoogleCalendar`, `Migration`, `DigestSchedule`, `PushSubscriptions`, `DueReminders`, `Templates`, `20260910111625_Leases.Designer.cs`, `StaleDays`, `20260909173924_ArchivedAt.Designer.cs`, `20260909175553_DigestSchedule.Designer.cs`, `20260910060446_DueReminders.Designer.cs`, `20260910092816_TaskHistory.Designer.cs`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Headboard.Api.Ai` connect `Headboard.Api.Data` to `.InboundAsync`, `.MapAi`, `.ParseExtractResponse`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `net10.0`, `coverlet.collector (6.0.4)`, `Microsoft.AspNetCore.Mvc.Testing (10.0.11)` to the rest of the system?**
  _327 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.InboundAsync` be split into smaller, more focused modules?**
  _Cohesion score 0.055087719298245616 - nodes in this community are weakly interconnected._
- **Should `support.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0673076923076923 - nodes in this community are weakly interconnected._
- **Should `Headboard.Api.Data` be split into smaller, more focused modules?**
  _Cohesion score 0.09551020408163265 - nodes in this community are weakly interconnected._