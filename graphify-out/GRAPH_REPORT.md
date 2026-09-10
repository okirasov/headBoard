# Graph Report - headboard  (2026-09-10)

## Corpus Check
- 233 files · ~148,688 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1628 nodes · 4722 edges · 112 communities (78 shown, 34 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `25cbb245`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTheme
- .InboundAsync
- support.js
- Headboard.Api.Data
- devDependencies
- model.ts
- mobile/src/lib/auth.ts
- cx
- ui/Icons.tsx
- .MapTasks
- AppDb
- src/index.ts
- live
- web/src/store/useStore.ts
- expo
- .Id
- useT
- .Login
- useStore
- normalizeTags
- PushSubscriptionRow
- .LoginAsync
- compilerOptions
- Global Constraints
- Headboard.Api.csproj
- newTask
- startOfDay
- TasksTests
- AiTests
- FakeGoogleCalendar
- Priority
- history.ts
- AppleVerifier
- .Build
- Handoff: Headboard — personal thinking board (Web + iOS)
- core/package.json
- calendar.ts
- compilerOptions
- GoogleAuthTests
- Headboard API (.NET 10)
- scripts
- .ComputeStats
- PushEndpoints.cs
- dependencies
- RecurringView.tsx
- .ParseExtractResponse
- StatsView.tsx
- Headboard — implementation design (web + mobile + API)
- Headboard.Api.Data.Migrations
- .IsDue
- .RunOnceAsync
- PushTests
- FakeAnthropicHandler
- mobile/package.json
- AnthropicClient
- HistoryView.tsx
- Global Constraints
- Global Constraints
- .MapAi
- DigestSchedule
- ApiFactory
- AuthTests
- SignIn.tsx
- templates.ts
- tokens.ts
- scripts
- providers.d.ts
- Migration
- ArchivedAt
- DigestSchedule
- GoogleCalendar
- PushSubscriptions
- DueReminders
- Templates
- TaskHistory
- AppDbModelSnapshot.cs
- .SendAsync
- mobile/tsconfig.json
- projects.ts
- Headboard
- 20260909173924_ArchivedAt.Designer.cs
- 20260909175553_DigestSchedule.Designer.cs
- 20260909192557_PushSubscriptions.Designer.cs
- 20260910060446_DueReminders.Designer.cs
- 20260910075741_Templates.Designer.cs
- 20260910092816_TaskHistory.Designer.cs
- tailwind.config.ts
- expo
- expo-apple-authentication
- expo-constants
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
8. `fmtDate()` - 47 edges
9. `Task` - 46 edges
10. `Headboard.Api.Data` - 36 edges

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

## Communities (112 total, 34 thin omitted)

### Community 0 - "useTheme"
Cohesion: 0.06
Nodes (132): Root(), useDevAutologin(), CalendarSyncCard(), DueButton(), RecurChips(), RemindChips(), AttachButtonM(), FileChipM() (+124 more)

### Community 1 - ".InboundAsync"
Cohesion: 0.05
Nodes (42): HttpContext, IConfiguration, IEndpointRouteBuilder, CalendarEndpoints, Guid, CalendarState, CalendarStatePayload, CancellationToken (+34 more)

### Community 2 - "support.js"
Cohesion: 0.07
Nodes (52): boot(), cdnScriptFor(), collectProps(), compileAttr(), compileTemplate(), contentKey(), createComponentFactory(), createExternalModules() (+44 more)

### Community 3 - "Headboard.Api.Data"
Cohesion: 0.10
Nodes (18): CalendarStatusDto, ConnectRequest, CommentEndpoints, CreateCommentRequest, ProjectPatch, Headboard.Api.Push, Headboard.Api.Files, Headboard.Api.Settings (+10 more)

### Community 4 - "devDependencies"
Cohesion: 0.04
Nodes (44): dependencies, @headboard/core, react, react-dom, zustand, devDependencies, autoprefixer, jsdom (+36 more)

### Community 5 - "model.ts"
Cohesion: 0.14
Nodes (29): Actions, PersistedSlice, Actions, PersistedSlice, RowItem, Api, ApiError, AuthResponse (+21 more)

### Community 6 - "mobile/src/lib/auth.ts"
Cohesion: 0.11
Nodes (32): plugins, appleOrDevSignIn(), appleSignIn(), devOrMockSignIn(), finish(), msg, ru(), useGoogleSignIn() (+24 more)

### Community 7 - "cx"
Cohesion: 0.14
Nodes (26): NavItem(), ProjectList(), RemindPicker(), ButtonProps, Chip(), Dot(), Empty(), HOVER (+18 more)

### Community 8 - "ui/Icons.tsx"
Cohesion: 0.13
Nodes (33): base(), IcArchive(), IcArrowUp(), IcBell(), IcBoard(), IcCalendar(), IcCheck(), IcChevronDown() (+25 more)

### Community 9 - ".MapTasks"
Cohesion: 0.13
Nodes (15): IEndpointRouteBuilder, int, List, string, CommentDto, HistoryEntryDto, TaskDto, Wire (+7 more)

### Community 10 - "AppDb"
Cohesion: 0.09
Nodes (21): ModelBuilder, AppDb, Guid, CommentRow, FileRow, ProjectRow, SettingsRow, TemplateRow (+13 more)

### Community 11 - "src/index.ts"
Cohesion: 0.17
Nodes (20): BAR, Sidebar(), TopBar(), IcSpark(), Button(), useNow(), ArchiveRow(), ArchiveView() (+12 more)

### Community 12 - "live"
Cohesion: 0.15
Nodes (25): StatsScreen(), StatsView(), addDays(), DueGroup, DueGroupKey, dueReminderTargets(), REMIND_OPTIONS, RemindDays (+17 more)

### Community 13 - "web/src/store/useStore.ts"
Cohesion: 0.12
Nodes (17): UiSlice, AttachButton(), FileChip(), TagEditor(), BAR, DrawerBody(), IcX(), filesToRefs() (+9 more)

### Community 14 - "expo"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, projectId (+17 more)

### Community 15 - ".Id"
Cohesion: 0.10
Nodes (14): Guid, HttpContext, CurrentUser, HashSet, IEndpointRouteBuilder, FileEndpoints, CancellationToken, Guid (+6 more)

### Community 16 - "useT"
Cohesion: 0.18
Nodes (19): PriorityDots(), StatusSelect(), useT(), BoardView(), SeedHint(), BAR, ResultRow(), SearchView() (+11 more)

### Community 17 - ".Login"
Cohesion: 0.13
Nodes (14): IEndpointRouteBuilder, string, AuthEndpoints, AuthResponse, DevLoginRequest, GoogleLoginRequest, IdTokenRequest, UserDto (+6 more)

### Community 18 - "useStore"
Cohesion: 0.19
Nodes (17): App(), CaptureModal(), FilePreviewModal(), Avatar(), ProfileBlock(), SyncStatus(), Shell(), SnoozePicker() (+9 more)

### Community 19 - "normalizeTags"
Cohesion: 0.17
Nodes (18): guessProject(), heuristicExtract(), parseExtractResponse(), PROJECT_KEYWORDS, cannedDigest(), digestStatsLine(), now, projects (+10 more)

### Community 20 - "PushSubscriptionRow"
Cohesion: 0.17
Nodes (14): PushSubscriptionRow, CancellationToken, string, ExpoPushSender, IPushSender, PushPayload, PushResult, WebPushSender (+6 more)

### Community 21 - ".LoginAsync"
Cohesion: 0.12
Nodes (14): HttpClient, Fact, InlineData, JsonSerializerOptions, Theory, FilesTests, Fact, RecurTests (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+13 more)

### Community 23 - "Global Constraints"
Cohesion: 0.10
Nodes (20): Global Constraints, Headboard Web + Core Implementation Plan, Task 10: Shell + TopBar + Board, Task 11: Task drawer, Task 12: Review view, Task 13: Calendar view, Task 14: Sign-in gate + profile, Task 15: Digest view (+12 more)

### Community 24 - "Headboard.Api.csproj"
Cohesion: 0.11
Nodes (18): net10.0, Headboard.Api.Tests, net10.0, coverlet.collector (6.0.4), Google.Apis.Auth (1.76.0), Microsoft.AspNetCore.Authentication.JwtBearer (10.0.11), Microsoft.AspNetCore.Mvc.Testing (10.0.11), Microsoft.AspNetCore.OpenApi (10.0.11) (+10 more)

### Community 25 - "newTask"
Cohesion: 0.18
Nodes (14): buildSeed(), buildSeed(), now, reset(), withHistory(), newTask(), nextDueAfterCompletion(), nextOccurrence() (+6 more)

### Community 26 - "startOfDay"
Cohesion: 0.23
Nodes (14): IdleBadge(), commentTime(), daysBetween(), sizeHuman(), startOfDay(), digestStats, archived(), dueDiff() (+6 more)

### Community 27 - "TasksTests"
Cohesion: 0.15
Nodes (7): Fact, InlineData, JsonSerializerOptions, Theory, ArchiveTests, HistoryTests, TasksTests

### Community 28 - "AiTests"
Cohesion: 0.19
Nodes (6): IEnumerable, Fact, JsonSerializerOptions, object, AiTests, HttpStatusCode

### Community 29 - "FakeGoogleCalendar"
Cohesion: 0.24
Nodes (7): Dictionary, Fact, Guid, HttpClient, List, CalendarTests, FakeGoogleCalendar

### Community 30 - "Priority"
Cohesion: 0.18
Nodes (15): Marked(), Priority, Status, excerpt(), hasAll(), highlight(), MatchField, SearchHit (+7 more)

### Community 31 - "history.ts"
Cohesion: 0.18
Nodes (12): diffTask(), entry(), historyByDay(), historyId(), base, now, projects, dict (+4 more)

### Community 32 - "AppleVerifier"
Cohesion: 0.14
Nodes (9): CancellationToken, string, AppleVerifier, CancellationToken, IEnumerable, string, ExternalIdentity, GoogleVerifier (+1 more)

### Community 33 - ".Build"
Cohesion: 0.20
Nodes (9): CancellationToken, IEnumerable, List, long, TimeZoneInfo, DueNotifier, Fact, long (+1 more)

### Community 34 - "Handoff: Headboard — personal thinking board (Web + iOS)"
Cohesion: 0.12
Nodes (15): About the Design Files, Assets, Design Tokens, Fidelity, Files, Handoff: Headboard — personal thinking board (Web + iOS), Interactions & Behavior, iOS (402×874, фрейм `ios-frame.jsx` — только презентация) (+7 more)

### Community 35 - "core/package.json"
Cohesion: 0.12
Nodes (15): devDependencies, typescript, vitest, exports, typescript, vitest, main, name (+7 more)

### Community 36 - "calendar.ts"
Cohesion: 0.19
Nodes (13): buildMonthGrid(), buildSnoozeGrid(), gridStart(), MonthDay, SnoozeDay, SnoozePreset, SnoozePresetKey, snoozePresetLabel() (+5 more)

### Community 37 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, lib, module, moduleResolution, noEmit, skipLibCheck, strict, target (+6 more)

### Community 38 - "GoogleAuthTests"
Cohesion: 0.18
Nodes (8): CancellationToken, Dictionary, Fact, HttpRequestMessage, HttpResponseMessage, FakeGoogleTokenHandler, GoogleAuthTests, HttpMessageHandler

### Community 39 - "Headboard API (.NET 10)"
Cohesion: 0.14
Nodes (13): Configuration, Database schema, Dev login, Endpoints, Google Calendar sync, Headboard API (.NET 10), Morning digest, Push reminders about deadlines (+5 more)

### Community 40 - "scripts"
Cohesion: 0.14
Nodes (13): name, private, scripts, api, build, dev, mobile, test (+5 more)

### Community 41 - ".ComputeStats"
Cohesion: 0.21
Nodes (8): DigestStatsDto, CancellationToken, Guid, int, IReadOnlyList, long, TimeZoneInfo, DigestService

### Community 42 - "PushEndpoints.cs"
Cohesion: 0.18
Nodes (9): IEndpointRouteBuilder, PushConfigDto, PushEndpoints, PushSubscriptionDto, SubscribeKeys, SubscribeRequest, UnsubscribeRequest, List (+1 more)

### Community 43 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, expo-auth-session, expo-crypto, expo-device, react-native, react-native-safe-area-context, zustand, zustand (+5 more)

### Community 44 - "RecurringView.tsx"
Cohesion: 0.26
Nodes (11): DueDateInput(), fromInput(), RecurPicker(), toInput(), TaskCard(), CalendarView(), BAR, RecurringView() (+3 more)

### Community 45 - ".ParseExtractResponse"
Cohesion: 0.31
Nodes (6): IReadOnlyList, JsonElement, List, CaptureItemDto, ExtractProject, Prompts

### Community 46 - "StatsView.tsx"
Cohesion: 0.29
Nodes (8): ChartCard(), DataTable(), GroupedBar, GroupedBars(), HBars(), StackedBar(), StatTile(), BAR_COLOR

### Community 47 - "Headboard — implementation design (web + mobile + API)"
Cohesion: 0.18
Nodes (10): API, Build order, Data model (packages/core), Decisions, Goal, Headboard — implementation design (web + mobile + API), Mobile screens, Repository layout (npm workspaces) (+2 more)

### Community 48 - "Headboard.Api.Data.Migrations"
Cohesion: 0.20
Nodes (5): ModelBuilder, Initial, ModelBuilder, GoogleCalendar, Headboard.Api.Data.Migrations

### Community 50 - ".RunOnceAsync"
Cohesion: 0.29
Nodes (6): CancellationToken, DigestScheduler, CancellationToken, int, StaleNotifier, BackgroundService

### Community 51 - "PushTests"
Cohesion: 0.27
Nodes (5): string, StaleMessage, Fact, object, PushTests

### Community 52 - "FakeAnthropicHandler"
Cohesion: 0.24
Nodes (7): CancellationToken, HttpMessageHandler, HttpRequestMessage, HttpResponseMessage, FakeAnthropicHandler, TestAnthropic, IServiceCollection

### Community 53 - "mobile/package.json"
Cohesion: 0.20
Nodes (9): devDependencies, @types/react, typescript, @types/react, typescript, main, name, private (+1 more)

### Community 54 - "AnthropicClient"
Cohesion: 0.22
Nodes (7): CancellationToken, int, string, AnthropicClient, AnthropicException, GoogleApiException, Exception

### Community 55 - "HistoryView.tsx"
Cohesion: 0.33
Nodes (8): HistoryPeek(), DOT, HistoryView(), lastEntry(), recentlyChanged(), TaskList(), Timeline(), historyText()

### Community 56 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Headboard API Implementation Plan (.NET 10), Task 1: Solution, project, EF model, SQLite, Task 2: Auth (Google/Apple id-token → JWT, dev login), Task 3: Tasks, comments, projects, settings, Task 4: Files, Task 5: AI endpoints (Anthropic), Task 6: OpenAPI, README, run script

### Community 57 - "Global Constraints"
Cohesion: 0.22
Nodes (8): Global Constraints, Headboard Mobile Implementation Plan (Expo / React Native), Task 1: App scaffold, theme, fonts, store, Task 2: Header, title, tab bar, sign-in, Task 3: Board screen, Task 4: Task sheet, capture sheet, snooze sheet, profile sheet, Task 5: Review, Digest, Calendar screens, file preview, Task 6: Verify on iOS simulator (light/dark, EN/RU) and Android emulator if available; `npm run -w @headboard/mobile typecheck` green.

### Community 58 - ".MapAi"
Cohesion: 0.29
Nodes (5): IEndpointRouteBuilder, AiEndpoints, DigestRequest, ExtractRequest, IResult

### Community 59 - "DigestSchedule"
Cohesion: 0.29
Nodes (4): int, TimeZoneInfo, DigestSchedule, DateOnly

### Community 60 - "ApiFactory"
Cohesion: 0.25
Nodes (6): Program, HttpMessageHandler, JsonSerializerOptions, ApiFactory, IWebHostBuilder, WebApplicationFactory

### Community 61 - "AuthTests"
Cohesion: 0.39
Nodes (3): Fact, AuthTests, IClassFixture

### Community 62 - "SignIn.tsx"
Cohesion: 0.29
Nodes (4): Logo(), Size, SIZES, SignIn()

### Community 64 - "templates.ts"
Cohesion: 0.50
Nodes (6): createdEntry(), applyTemplate(), fillPlaceholders(), newTemplate(), templateFromTask(), now

### Community 65 - "tokens.ts"
Cohesion: 0.39
Nodes (4): DARK, LIGHT, TokenName, Tokens

### Community 66 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, ios, start, typecheck, web

### Community 68 - "Migration"
Cohesion: 0.50
Nodes (3): MigrationBuilder, Initial, Migration

### Community 76 - "AppDbModelSnapshot.cs"
Cohesion: 0.40
Nodes (3): ModelBuilder, AppDbModelSnapshot, ModelSnapshot

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
- **315 isolated node(s):** `net10.0`, `coverlet.collector (6.0.4)`, `Microsoft.AspNetCore.Mvc.Testing (10.0.11)`, `Microsoft.NET.Test.Sdk (17.14.1)`, `xunit (2.9.3)` (+310 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Headboard.Api.Data` connect `Headboard.Api.Data` to `AppDb`, `PushEndpoints.cs`, `AppDbModelSnapshot.cs`, `Headboard.Api.Data.Migrations`, `.Login`, `20260909175553_DigestSchedule.Designer.cs`, `20260909173924_ArchivedAt.Designer.cs`, `20260909192557_PushSubscriptions.Designer.cs`, `20260910060446_DueReminders.Designer.cs`, `20260910075741_Templates.Designer.cs`, `20260910092816_TaskHistory.Designer.cs`, `PushSubscriptionRow`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `Headboard.Api.Tasks` connect `Headboard.Api.Data` to `.MapTasks`, `PushEndpoints.cs`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `Headboard.Api.Data.Migrations` connect `Headboard.Api.Data.Migrations` to `ArchivedAt`, `DigestSchedule`, `GoogleCalendar`, `PushSubscriptions`, `DueReminders`, `Templates`, `TaskHistory`, `AppDbModelSnapshot.cs`, `20260909173924_ArchivedAt.Designer.cs`, `20260909175553_DigestSchedule.Designer.cs`, `20260909192557_PushSubscriptions.Designer.cs`, `20260910060446_DueReminders.Designer.cs`, `20260910075741_Templates.Designer.cs`, `20260910092816_TaskHistory.Designer.cs`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `net10.0`, `coverlet.collector (6.0.4)`, `Microsoft.AspNetCore.Mvc.Testing (10.0.11)` to the rest of the system?**
  _315 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.05919276881551692 - nodes in this community are weakly interconnected._
- **Should `.InboundAsync` be split into smaller, more focused modules?**
  _Cohesion score 0.050980392156862744 - nodes in this community are weakly interconnected._
- **Should `support.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0673076923076923 - nodes in this community are weakly interconnected._