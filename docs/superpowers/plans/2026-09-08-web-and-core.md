# Headboard Web + Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the Headboard web app (1440×900 reference) pixel-for-pixel in React + Tailwind on top of a shared, unit-tested domain package.

**Architecture:** npm-workspaces monorepo. `packages/core` holds types, EN/RU dictionaries and pure domain functions ported from the prototype logic. `apps/web` is Vite + React 18 + Tailwind 3 with a zustand store (persisted slice + UI slice); every colour is a CSS-variable token exposed through Tailwind `theme.colors`.

**Tech Stack:** Node 26, npm workspaces, TypeScript 5, Vite 5, React 18, Tailwind 3, zustand 4, vitest, @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-09-08-headboard-implementation-design.md` (+ `design_handoff_headboard/README.md`, `Headboard.dc.html`).

## Global Constraints
- Colours only via tokens from README "Design Tokens" plus `--wait #9A7B2D`, `--okHov #516F4A`, `--fabShadow rgba(188,86,54,.4)`, `--scrimDrawer rgba(32,29,23,.28)`. No literal hex in components.
- Fonts: Golos Text (UI, 400/500/600), IBM Plex Mono (labels, dates, counters). No serifs, no 700 headings.
- Radii: segments/chips 7px, cards 12–14px, buttons 9–12px, modals 16–22px, inputs 10–12px. No 99px pills.
- Logo: inline SVG per README "Logo"; wordmark "board" Golos 400, letter-spacing −.3px, "o" in `--acc`.
- Do not hard-code prototype demo data. Do not port `support.js` / `ios-frame.jsx`.
- localStorage key `headboard-v1`.
- Prototype wins over README where they conflict (spec §Decisions).

---

### Task 1: Monorepo + core package skeleton
**Files:** `package.json` (workspaces), `.gitignore`, `.editorconfig`, `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/vitest.config.ts`, `packages/core/src/index.ts`, `packages/core/src/model.ts`.
**Produces:** types `Priority`, `Status`, `Task`, `FileRef`, `Comment`, `Project`, `User`, `Lang`, `Theme`, `View`, `ColumnKey`; constants `DAY_MS = 864e5`, `STALE_DAYS_DEFAULT = 7`.
- [ ] Write `model.ts` with the spec types; `index.ts` re-exports.
- [ ] `npm install`, `npm run -w @headboard/core typecheck` passes.
- [ ] Commit `chore: scaffold monorepo and core package`.

### Task 2: i18n dictionaries
**Files:** `packages/core/src/i18n.ts`, test `packages/core/src/i18n.test.ts`.
**Produces:** `type Dict`, `EN: Dict`, `RU: Dict`, `dict(lang: Lang): Dict`.
- [ ] Test: every key of EN exists in RU and vice versa; `dict('ru').board === 'Доска'`.
- [ ] Port the `LNG.en` / `LNG.ru` objects from the prototype verbatim (including DOW/DOWS/MON/MONF arrays and priority labels `PR_LABELS`).
- [ ] Tests pass. Commit `feat(core): EN/RU dictionaries`.

### Task 3: Dates and task derivations
**Files:** `packages/core/src/dates.ts`, `packages/core/src/tasks.ts`, tests alongside.
**Produces:** `startOfDay(ts)`, `fmtDate(ts, lang)`, `idleDays(task, now)`, `isStale(task, now, staleDays)`, `dueDiff(task, now)`, `dueLabel(task, lang, now)`, `isSnoozed(task, now)`, `commentTime(at, lang, now)`, `sizeHuman(bytes)`, `PRIORITY_META[pr] = {barToken, labelKey}`, `sortAutoBump(tasks, now, staleDays)`, `sortByPriority`, `sortDone`.
- [ ] Tests with fixed `now`: idle 0/2/12 days, stale at ≥7 but not when snoozed in future or done, dueLabel → overdue/today/tomorrow/`Wed 11`/`Sep 20`, RU `20 сен`, sizeHuman 18400 → `18 KB`, 240000 → `240 KB`, 960000 → `1.0 MB`.
- [ ] Implement by porting `idleOf/isStale/sod/dueDiff/dueLabel/fmtD/cmTime/sizeHuman/sortA`.
- [ ] Tests pass. Commit `feat(core): date and task derivations`.

### Task 4: Calendar grids
**Files:** `packages/core/src/calendar.ts` + test.
**Produces:** `buildMonthGrid(tasks, {now, selected}) → Week[6] of Day{ts, n, inMonth, isToday, isSelected, count, isFuture, heavy}`, `buildSnoozeGrid({now, monthOffset}) → Week[6] of {ts, n, inMonth, isToday, disabled}`, `monthLabel(now, offset, lang)`, `snoozePresets(now) → [{key:'tomorrow'|'d3'|'week'|'month', ts}]`.
- [ ] Tests: grid starts on Monday, 42 cells, today flagged, counts exclude done and count only same-day due, heavy = count ≥ 3, snooze days ≤ today disabled, presets = +1, +3, +7, +1 month at start of day.
- [ ] Implement. Tests pass. Commit `feat(core): calendar grids`.

### Task 5: Digest stats, canned digest, capture heuristic
**Files:** `packages/core/src/digest.ts`, `packages/core/src/capture.ts` + tests.
**Produces:** `digestStats(tasks, now, staleDays) → {dueN, dueFirst, staleN, oldT, oldI, doneW, focusN, recN, due, stale}`, `cannedDigest(i, stats, lang)`, `digestStatsLine(stats, lang)`, `heuristicExtract(text, projects) → CaptureItem[]` where `CaptureItem = {title, pr, tags, proj}`, `PROJECT_KEYWORDS` heuristic keyed by project *name* regexes (not ids).
- [ ] Tests: stats over a fixture; heuristic splits lines, strips bullets, `urgent:`/`срочно:` → pr 0 and prefix removed, `#tag` extracted (max 2), capitalises, max 8 items, title ≤ 90 chars.
- [ ] Implement. Commit `feat(core): digest and capture heuristics`.

### Task 6: Web app scaffold, tokens, fonts, Tailwind theme
**Files:** `apps/web/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` (Google Fonts link for Golos Text 400;500;600 + IBM Plex Mono 400;500;600), `tailwind.config.ts`, `postcss.config.js`, `src/styles/tokens.css`, `src/styles/index.css`, `src/main.tsx`, `src/App.tsx` (placeholder).
**Produces:** Tailwind colour names = token names (`bg, panel, card, inset, sel, chipBg, chipInk, ink, inkHov, onInk, mut, mut2, faint, ghost, line, lineStrong, acc, accHov, hi, onAcc, med, goldInk, goldBd, goldFaint, heat1, heat2, heat2b, heat2bd, rowLine, rowLineGold, ok, okBg, okBd, okHov, wait, tabBg, scrim, scrimSoft, scrimDrawer`); `fontFamily.sans/mono`; `fontSize` scale `8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 16, 17, 18, 19, 20, 21, 22, 26, 28`; `borderRadius` 6…22; keyframes `fadeUp .2s`, `slideIn .22s`, `sheetUp .24s`, `pulse 2.4s`; shadows `card-hover`, `modal`, `drawer`, `menu`, `snack`, `fab`.
- [ ] `tokens.css`: `:root{…light…}` and `.dark{…dark…}` exactly from README + 4 extras; `*{box-sizing:border-box}`, scrollbar 8px thumb `--lineStrong` r7, `input:focus,textarea:focus{outline:none}`, body `bg-bg text-ink font-sans`.
- [ ] `npm run -w web dev` renders a token swatch page; toggle `.dark` on `<html>` flips colours.
- [ ] Commit `feat(web): scaffold with design tokens`.

### Task 7: Store (persisted + UI slices)
**Files:** `apps/web/src/store/useStore.ts`, `apps/web/src/store/selectors.ts`, tests `useStore.test.ts`.
**Produces:** zustand store: persisted `{tasks, projects, projFiles, digestText, user, lang, theme, showDone}` under key `headboard-v1`; UI `{view, q, fPr, fProj, sel, capOpen, capText, capItems, capBusy, calSel, snack, pv, zTask, zMonth, profOpen, dragId, dragCol, cmText, digestBusy, digestSeed}`; actions `patchTask, moveTask, markDone, reopen, bump, snooze, archive, addComment, attachFiles(taskId, FileRef[]), removeFile, attachProjFiles, removeProjFile, addTasks(CaptureItem[]), setLang, setTheme, signIn(provider), signOut, toast(msg)`; `live()` selector filters `archived`.
- [ ] Tests: moveTask sets touched & doneAt; bump resets snoozedUntil; addTasks prepends inbox tasks; signOut clears sel.
- [ ] Implement. Theme effect: apply `dark` class to `<html>`; initial theme = persisted or `prefers-color-scheme`.
- [ ] Commit `feat(web): store`.

### Task 8: UI primitives + Logo + Icons
**Files:** `src/components/ui/{Button,Chip,Segmented,IconButton,Kicker,Dot,Scrim}.tsx`, `src/components/brand/Logo.tsx`, `src/components/ui/Icons.tsx`.
**Produces:** `Logo({size: 'sidebar'|'auth'|'title'|'mobile', surface: 'panel'|'bg'})` (mark 25/32/34/20 px, wordmark 21/26/28/20 px, gap 7–8px); `Icons.*` = every 16×16 stroke icon from the prototype (Board, Review, Digest, Calendar, Search, Spark, Check, ArrowUp, X, Chevron{Down,Up,Left,Right}, Comment, Paperclip, Repeat, Link, Send, Image, File, Plus).
- [ ] Storybook-free check: render all in a `/dev` route.
- [ ] Commit `feat(web): primitives, logo, icons`.

### Task 9: Sidebar
**Files:** `src/components/layout/Sidebar.tsx`, `NavItem.tsx`, `ProjectList.tsx`, `ProfileButton.tsx`, `ProfileMenu.tsx`, `SyncStatus.tsx`.
Pixel spec: width 234, `bg-panel border-r border-line`, padding `20px 12px 16px`; logo block padding `0 10px`, tagline mono 9.5px ls .1em uppercase mut2 mt 5; nav mt 22, gap 2, item `px-10 py-8 r10 text-13.5 font-500 gap-9` icon 15px, active `bg-sel text-ink` else `text-mut`; Review badge mono 10.5 600 `bg-heat2b text-goldInk r7 px-7 py-1`; "Projects" kicker `mono 9.5 ls .1em uppercase mut2 m 24px 10px 8px`; project rows `py-6 px-10 r10 text-13 gap-9`, dot 7px, count mono 10.5 mut2, active `bg-sel`; spacer; profile block `border-t border-line pt-10`; profile button `p 7px 8px r11 gap-9`, avatar 30px round `bg-chipBg text-chipInk mono 10.5 600`, name 12.5 600 ellipsis, provider mono 9.5 mut2, chevron-up 11px mut2; menu absolute `bottom: calc(100% + 6px)` `bg-card border-line r14 shadow-menu p-13 gap-11 fadeUp .18s`: name 13/600, email mono 10 mut2, divider, Language kicker mono 9 ls .08em, segmented `border-line r9` cells `py-7 mono 10.5 600` active `bg-ink text-onInk` else `bg-card text-mut2`; Theme same; divider; Sign out 12.5 600 `text-hi`; sync row `pt-10 px-10 gap-8`: dot 7px `bg-ok animate-pulse`, title 12/600, sub mono 10 mut2.
- [ ] Implement, wire to store. Commit `feat(web): sidebar`.

### Task 10: Shell + TopBar + Board
**Files:** `src/components/layout/Shell.tsx`, `TopBar.tsx`, `src/views/board/{BoardView,PriorityChips,ShowDoneChip,ProjectFilesBar,Column,TaskCard,FileChip}.tsx`.
Pixel spec: TopBar h62 `px-24 gap-12 border-b border-line`; date kicker mono 11 ls .08em uppercase mut2; search input w250 `bg-card border-line r10 p 8px 12px 8px 32px text-13` with 14px icon at left 10 top 9; Capture button `bg-acc text-onAcc r10 p 9px 16px text-13 600 gap-7` hover accHov. Board padding `18px 24px 0`; h1 26/500 ls −.3 lh 1.2 + sub 12 mut2 baseline gap 14; chips `mono 10.5 500 p 4px 9px r7 border` active `bg-chipBg text-chipInk border-lineStrong` else `bg-card text-mut border-line`; ShowDone chip same style. ProjectFilesBar `bg-panel border-line r12 p 9px 14px gap-10 mb-12 wrap`. Columns `gap-14`, header `gap-8 pb-10` dot 8px, label 11.5/600 ls 1px uppercase mut, count mono 10.5 mut2; body `gap-10 p 6px 4px 18px r12 border-1.5 dashed transparent`, drag-over `bg-sel border-lineStrong`. Card `bg-card border-line r12 p 12px 12px 12px 16px gap-8 cursor-grab` hover `shadow-card-hover border-lineStrong`, stale `border-goldBd`; bar 4px left `bg-{hi|med|lineStrong}`; top row: idle badge mono 10 `p 2px 6px r7` (`bg-inset text-mut2`, stale `bg-heat2b text-goldInk`, snoozed label), spacer, 22px action buttons `r6 border-line text-mut2 opacity-55` hover ok/acc; title 14/500 lh1.4; meta row gap 10 wrap: project (dot 7 + 11.5 mut), tags mono 10.5 mut2, spacer, comment/file counters mono 10.5 with 10px icons, due mono 10.5 (hi overdue / acc today / mut2), repeat, chat link. Empty column italic 13.5 mut2. Done column limited to 8 newest.
- [ ] HTML5 DnD: `draggable`, `onDragStart` sets `text/plain` id, column `onDragOver/onDrop`.
- [ ] Commit `feat(web): board view`.

### Task 11: Task drawer
**Files:** `src/components/task/{TaskDrawer,StatusSelect,PriorityDots,AttachmentChips,CommentList,MetaRows,DrawerActions}.tsx`.
Pixel spec: overlay `inset-0 z-40` scrim `bg-scrimDrawer`; panel right w392 `bg-panel border-l border-line shadow-drawer p 22px 22px 18px gap-14 slideIn`; header row: idle badge (r6) + close 26px `r8 border-line bg-card text-mut`; scroll area `gap-14 -mr-8 pr-8`; title 22/500 ls −.2 lh 1.25; project row 12.5 mut dot 8 + tags mono 10.5; note `text-13 lh1.55 text-mut bg-inset r10 p 11px 13px`; Status/Priority row `gap-14 items-end`: kicker mono 9.5 ls .08em uppercase mut2 mb-7; select `appearance-none bg-card border-line r10 p 10px 32px 10px 12px text-13 600` + 10px chevron at right 12; dots 20px round `bg-{bar}` border 2px (`ink` selected else transparent) shadow (`inset 0 0 0 2px var(--panel)` selected else `inset 0 0 0 1px rgba(32,29,23,.10)` → use token `scrimDrawer`-free: use `shadow-[inset_0_0_0_1px_var(--line)]`), row h39 gap-8, current label mono 10 ls .6px uppercase mut min-w 54; Attachments kicker `· N`, chips `bg-card border-line r9 p 5px 8px gap-6` (thumb 30px r6 / 14px icon, name 11.5/500 max-w 130 ellipsis, size mono 9.5, X 9px hover hi), attach label dashed `border-lineStrong r9 p 7px 10px 11.5/600 mut`; Comments list `max-h-186 overflow-y-auto -mr-6 pr-6 gap-6` items `bg-inset r10 p 8px 11px` text 12.5 lh1.5 + time mono 9.5 mut2; input `bg-card border-line r10 p 8px 11px text-12.5` + send 34px `bg-acc r10`; meta `border-t border-line pt-12 gap-8` rows text-12 label w130 mut2 + value mono 11 mut; Claude chat link 12/600 acc; footer `pt-4 gap-8`: row1 Done `bg-ok text-onInk` / Bump `bg-acc text-onAcc` (13/600 p10 r10), row2 Snooze… / Archive outline `border-line bg-card 12.5/600 p9 r10` hover acc / hi.
- [ ] Commit `feat(web): task drawer`.

### Task 12: Review view
**Files:** `src/views/review/{ReviewView,ReviewRow}.tsx`.
Pixel spec: padding `18px 24px 24px`; h1 26/500; intro 12.5 mut2 `m 4px 0 18px`; list `gap-10 max-w 820`; row `bg-card border-goldBd r14 p 14px 16px gap-16 items-center`; days block w64 center: number mono 22/600 goldInk lh1, label mono 9 ls 1px uppercase goldFaint mt3; title 14.5/600 ls −.1 + sub 11.5 mut2 mt3; buttons gap-7: Keep `bg-acc text-onAcc 12/600 p 7px 12px r9`, Snooze… / Archive `border-goldBd bg-card` text mut / mut2; empty italic 16 mut2 py-20.
- [ ] Commit `feat(web): review view`.

### Task 13: Calendar view
**Files:** `src/views/calendar/{CalendarView,MonthGrid,DayCell,ScheduleList}.tsx`.
Pixel spec: h1 + sync chip (mono 10.5 ok `bg-okBg border-okBd r7 p 3px 10px` dot 6); layout `flex gap-20 mt-16 items-start`; grid card `bg-card border-line r16 p-20`; month label italic 18 mb-12; weekday row `grid-cols-[repeat(7,46px)] gap-4 mono 9.5 ls 1px uppercase mut2 mb-6`; day 46×46 r10 col center gap-3 border 1px: number 12.5/500; colours per prototype `buildCal` (today `bg-acc text-onAcc`, selected `bg-sel border-lineStrong`, future 1–2 `bg-heat1`, 3+ `bg-heat2 border-heat2bd`, out of month text ghost); count badge mono 9.5/600 `p 2.5px 5px r7` (today `bg-onAcc/20`… use `bg-[color:var(--onAcc)]/20`; past `bg-inset text-faint`; heavy `bg-heat2b text-goldInk`; else `bg-card text-mut`). Schedule card `flex-1 max-w 520 bg-card border-line r16 p 16px 18px`, title 11.5/600 ls1 uppercase mut mb-10, rows `gap-10 p 9px 2px border-b border-rowLine`: date mono 10.5 w80, dot 7, title 13.5/500, `↻ weekly` mono 10 mut2; empty italic 13.
- [ ] Commit `feat(web): calendar view`.

### Task 14: Sign-in gate + profile
**Files:** `src/views/auth/SignIn.tsx`, wire `ProfileMenu` actions.
Pixel spec: full overlay `z-70 bg-bg p-40 center`; card w432 `bg-panel border-line r20 shadow-modal p-34 gap-22`; Logo auth (32/26) + tagline mono 10 ls .1em uppercase mut2 mt6; lead 19 lh1.5 mut; buttons gap-9 h46 r12 14/600: Google `bg-card border-lineStrong` hover acc; Apple `bg-ink text-onInk` hover inkHov; note mono 10.5 lh1.7 ls .4px mut2. Mock sign-in creates user `{name, email, provider, initials}` from provider; real OAuth arrives with the API plan.
- [ ] Commit `feat(web): sign-in and profile`.

### Task 15: Digest view
**Files:** `src/views/digest/{DigestView,RowList}.tsx`.
Pixel spec: header h1 + date mono 11 mut2; grid `1.25fr 1fr gap-16 mt-16 max-w 1080`; main card `bg-card border-line r16 p-22 gap-14`: stats kicker mono 10.5 ls1 uppercase mut2, paragraph 19 lh1.55, footer `mt-auto gap-10`: Regenerate outline `border-line text-acc 12.5/600 p 7px 13px r9` + note mono 10 mut2. Right column gap-12 cards `p 16px 18px`: Due today (mut title), Forgotten (`border-goldBd`, title goldInk, rows `border-rowLineGold`), Recurring. Row: dot 7, title 13.5/500, chip mono 10.5.
- [ ] Digest text: `digestText ?? cannedDigest(0, stats)`; Regenerate → `cannedDigest(seed+1)` now, API later.
- [ ] Commit `feat(web): digest view`.

### Task 16: Capture modal
**Files:** `src/components/capture/{CaptureModal,CaptureItem}.tsx`.
Pixel spec: `z-50 center` scrim `bg-scrimSoft`; panel w600 `bg-panel r18 shadow-modal p-24 gap-14 fadeUp`; title 22/500 ls −.2 + sub 12.5 mut2 mt3; textarea h132 `bg-inset border-line r12 p 13px 14px text-13.5 lh1.55 resize-none`; items list `gap-6 max-h-200` item `bg-card border-line r10 p 9px 11px 9px 14px gap-9` + 4px bar, title 13/500, project (dot 6 + 11 mut), X 20px; actions row gap-8: Extract `bg-acc` 13/600 p 9px 15px r10 + spark icon; Add as one outline; spacer; Add N `bg-ink text-onInk`; Discard ghost mut2.
- [ ] Extract = `heuristicExtract` (API later). Commit `feat(web): capture modal`.

### Task 17: Snooze picker + file preview + snackbar
**Files:** `src/components/snooze/SnoozePicker.tsx`, `src/components/files/FilePreviewModal.tsx`, `src/components/ui/Snackbar.tsx`.
Pixel spec: Snooze `z-55` panel w322 `bg-panel r16 p-18 gap-12 fadeUp`, title 18/500 + close 24px r7; presets row chips r7 (new); month nav 26px r7 hover sel + label 13/600; weekday mono 9 ls .8px; days h36 r8 12.5/500 (disabled ghost, today bg-sel, hover heat2b). Preview `z-60 p-40` scrim `bg-scrim`; panel max-w 760 `bg-panel r16 shadow-modal p-14 gap-11`: name 13.5/600 max-w 380 ellipsis, size mono 10.5, Download outline 12/600 p 6px 11px r8, close 26px; image `max 730×470 r10 bg-inset object-contain`; no-preview 460×280 `r12 dashed border-lineStrong bg-inset gap-10`: EXT badge mono 11/600 ls 1.4px `bg-sel text-goldInk r7 p 5px 10px`, italic 17, sub 12 lh1.55 mut2 max-w 290. Snackbar `bottom-22 center bg-ink text-onInk 12.5/500 p 9px 18px r7 shadow-snack fadeUp`, 2.4s.
- [ ] File attach: `<input type=file multiple>`; images < 1.5MB read to dataURL.
- [ ] Commit `feat(web): snooze, preview, snackbar`.

### Task 18: Visual verification against prototype
- [ ] Run web at 1440×900 in the in-app browser, light and dark, EN and RU; compare each screen with `Headboard.dc.html`; fix deviations.
- [ ] `npm test`, `npm run typecheck`, `npm run build` pass. Commit.
