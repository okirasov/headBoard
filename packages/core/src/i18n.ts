import type { Lang, Priority } from './model';

export interface Dict {
  tagline: string; board: string; resurface: string; digest: string; calendar: string;
  projects: string; allProjects: string; offline: string; synced: string; offlineM: string;
  searchPh: string; capture: string; chat: string; nothingHere: string;
  daysIdle: string; daysShort: string; keep: string; snoozeLbl: string; snoozeDots: string; zTitle: string; zUntil: string; archive: string; bump: string;
  noDust: string; digTitle: string; digNote: string;
  dueToday: string; dustyPicks: string; recurring: string;
  nothingDue: string; nothingSched: string; gcal: string;
  dw1: string; dw2: string; dw3: string; dw4: string; dw5: string; dw6: string; dw7: string;
  status: string; priority: string; claudeChat: string; openChat: string; bumpTop: string;
  pvNA: string; pvNAsub: string; dl: string;
  authSub: string; google: string; apple: string; authNote: string; language: string; signOut: string; signedWith: string; theme: string; light: string; dark: string;
  attachments: string; comments: string; attach: string; cmPh: string; justNow: string; projFilesL: string;
  capSub: string; capPh: string; capPhM: string; addOne: string; discard: string;
  sInbox: string; sFocus: string; sWaiting: string; sWaitingOn: string; sDone: string;
  all: string; extract: string; extracting: string; regen: string; thinking: string;
  markDone: string; reopen: string;
  today: string; tomorrow: string; overdue: string; snoozed: string; idleSuf: string;
  created: string; lastTouched: string; due: string; repeats: string; everyWeek: string; weekly: string;
  daysAgo: string; noProject: string; lastT: string;
  sched: string; schedSel: string; bumpSort: string; prSort: string;
  tDone: string; tBump: string; tSnooze: string; tArch: string; tKeep: string; tMoved: string; tReopen: string; tDoneS: string;
  showDone: string; zTomorrow: string; z3d: string; zWeek: string; zMonth: string;
  digestUpdated: string;
  historyTitle: string; historySub: string; fullHistory: string; noHistory: string; historyN: string; hCreated: string; hDone: string; hReopened: string; hArchived: string; hRestored: string; hTitle: string; hNote: string; hProject: string; hTags: string; hEdited: string; hCleared: string; hBumped: string; hCommentRemoved: string; hCommentEdited: string; notePh: string; chatPh: string; cmEdit: string; cmDelete: string; cmConfirm: string; projectLbl: string; hRemoved: string; hSrcTemplate: string; hSrcCalendar: string; hSrcRecur: string; hSrcCapture: string; historyHint: string; hPick: string; hRecent: string; hOpenTask: string; hAllTasks: string;
  templatesTitle: string; templatesSub: string; templatesHint: string; noTemplates: string; newTemplate: string; templateName: string; templateTitle: string; templateNote: string; dueInDays: string; dueInDaysHint: string; useTemplate: string; saveAsTemplate: string; fillPlaceholders: string; createTask: string; usedN: string; tTemplateSaved: string; tTemplateApplied: string; tTemplateDeleted: string; confirmDeleteTemplate: string; fromTemplate: string;
  tagsTitle: string; tagsSub: string; tagsHint: string; noTags: string; unusedTags: string; clearUnused: string; renameTag: string; mergeInto: string; deleteTag: string; confirmDeleteTag: string; addTagPh: string; tagFilter: string; tTagRenamed: string; tTagMerged: string; tTagDeleted: string; lastUsed: string;
  recurTitle: string; recurSub: string; recurNone: string; recurDaily: string; recurWeekly: string; recurMonthly: string; everyDay: string; everyMonth: string; nextLbl: string; noRecurring: string; recurHint: string; tRolled: string; doneNext: string; historyLbl: string;
  dueTitle: string; dueSub: string; gOverdue: string; gToday: string; gTomorrow: string; gWeek: string; gLater: string; gUndated: string; remindLbl: string; remindNone: string; remindDay: string; remindDayBefore: string; dueDateLbl: string; clearDue: string; setDue: string; dueNotify: string; dueNotifyHint: string; noDue: string; dueIn: string; dueAgo: string;
  searchTitle: string; searchSub: string; searchBigPh: string; typeToSearch: string; noResults: string; inNote: string; inComment: string; inTags: string; inProject: string; allStatuses: string; sArchived: string;
  statsTitle: string; statsSub: string; closedThisWeek: string; vsLastWeek: string; openNow: string; forgottenNow: string; streakLbl: string; streakUnit: string; medianClose: string; daysUnit: string; closedPerWeek: string; createdSeries: string; closedSeries: string; priorityMixTitle: string; idleAgeTitle: string; openByProjectTitle: string; showTable: string; showChart: string; noStats: string; weekShort: string; nowLbl: string;
  idleFresh: string; idleWarm: string; idleStale: string; idleCold: string; openCol: string; doneCol: string;
  projectsTitle: string; manageProjects: string; newProject: string; projectNamePh: string; addProject: string; deleteProject: string; confirmDeleteProject: string; projectsHint: string; noProjects: string; tProjectAdded: string; tProjectDeleted: string; colorLabel: string;
  notifications: string; notifyOn: string; notifyOff: string; notifyDenied: string; notifyUnavailable: string; notifyTest: string; notifyTestSent: string; notifyHint: string;
  gcalConnect: string; gcalConnected: string; gcalSyncing: string; gcalSyncNow: string; gcalDisconnect: string; gcalError: string; gcalReauth: string; gcalUnavailable: string; gcalDenied: string; gcalHint: string; gcalSynced: string;
  undo: string; tUndone: string; staleAfter: string; staleAfterHint: string; dShort: string;
  archiveTitle: string; restore: string; deleteForever: string; confirmDelete: string; archiveEmpty: string; archivedOn: string; archivedBadge: string; tRestored: string; tDeleted: string;
  seedDemo: string;
  DOW: string[]; DOWS: string[]; MON: string[]; MONF: string[];
  prShort: [string, string, string]; prFull: [string, string, string];
}

export const EN: Dict = {
  tagline: 'a board for thinking', board: 'Board', resurface: 'Review', digest: 'Digest', calendar: 'Calendar',
  projects: 'Projects', allProjects: 'All projects', offline: 'Offline-ready', synced: 'synced just now', offlineM: 'offline-ready',
  searchPh: 'Search tasks…', capture: 'Capture', chat: 'chat', nothingHere: 'nothing here — nice.',
  daysIdle: 'days idle', daysShort: 'days', keep: 'Still relevant', snoozeLbl: 'Snooze', snoozeDots: 'Snooze…', zTitle: 'Snooze until…', zUntil: 'Snoozed until ', archive: 'Archive', bump: 'Bump',
  noDust: 'Nothing forgotten. Check back in a few days.',
  digTitle: 'Daily digest', digNote: 'drafted by Claude · refreshes every morning at 8:00',
  dueToday: 'Due today', dustyPicks: 'Forgotten', recurring: 'Recurring',
  nothingDue: 'nothing due — clear runway.', nothingSched: 'nothing scheduled this day.',
  gcal: 'Google Calendar · two-way sync',
  dw1: 'Mo', dw2: 'Tu', dw3: 'We', dw4: 'Th', dw5: 'Fr', dw6: 'Sa', dw7: 'Su',
  status: 'Status', priority: 'Priority', claudeChat: 'Claude chat', openChat: 'Open linked chat', bumpTop: 'Bump to top',
  pvNA: 'No preview available', pvNAsub: 'This file is attached by reference — open it in the app it came from.', dl: 'Download',
  authSub: 'Your board, your thinking. Sign in to keep tasks, projects and Claude chats in sync.', google: 'Continue with Google', apple: 'Continue with Apple',
  authNote: 'No passwords. We only read your name and email.', language: 'Language', signOut: 'Sign out', signedWith: 'via ', theme: 'Theme', light: 'Light', dark: 'Dark',
  attachments: 'Attachments', comments: 'Comments', attach: 'Attach', cmPh: 'Write a comment… (Enter)', justNow: 'just now', projFilesL: 'Project files',
  capSub: 'Paste anything — a Claude chat, meeting notes, a braindump. It becomes tasks.',
  capPh: 'e.g. — figure out pricing page copy\n— urgent: renew domain\n— ask Claude about embeddings #research',
  capPhM: 'Paste thoughts, notes, a chat…',
  addOne: 'Add as one task', discard: 'Discard',
  sInbox: 'Inbox', sFocus: 'In focus', sWaiting: 'Waiting', sWaitingOn: 'Waiting on', sDone: 'Done',
  all: 'All', extract: 'Extract tasks', extracting: 'Extracting…', regen: 'Regenerate', thinking: 'Thinking…',
  markDone: 'Mark done', reopen: 'Reopen',
  today: 'today', tomorrow: 'tomorrow', overdue: 'overdue', snoozed: 'snoozed', idleSuf: 'd idle',
  created: 'Created', lastTouched: 'Last touched', due: 'Due', repeats: 'Repeats', everyWeek: 'every week', weekly: 'weekly',
  daysAgo: ' days ago', noProject: 'No project', lastT: 'last touched ',
  sched: 'Scheduled', schedSel: 'Scheduled · selected day',
  bumpSort: 'forgotten tasks first', prSort: 'sorted by priority',
  tDone: 'Done — moved to Done', tBump: 'Bumped — idle counter reset', tSnooze: 'Snoozed for 7 days', tArch: 'Archived',
  tKeep: 'Kept — bumped to top of its column', tMoved: 'Moved to ', tReopen: 'Reopened into In focus', tDoneS: 'Done ✓',
  showDone: 'Done', zTomorrow: 'Tomorrow', z3d: '+3 days', zWeek: 'Next week', zMonth: 'Next month',
  digestUpdated: 'updated ',
  historyTitle: 'History', historySub: 'every change to this task, newest first', fullHistory: 'Full history', noHistory: 'No changes recorded yet.', historyN: 'changes', hCreated: 'Created', hDone: 'Completed', hReopened: 'Reopened', hArchived: 'Archived', hRestored: 'Restored', hTitle: 'Title', hNote: 'Note', hProject: 'Project', hTags: 'Tags', hEdited: 'edited', hCleared: 'cleared', hBumped: 'idle counter reset', hCommentRemoved: 'comment removed', hCommentEdited: 'comment edited', notePh: 'Add a note…', chatPh: 'Paste a claude.ai chat link…', cmEdit: 'Click to edit', cmDelete: 'Delete comment', cmConfirm: 'Delete?', projectLbl: 'Project', hRemoved: 'removed: ', hSrcTemplate: 'from template', hSrcCalendar: 'via Google Calendar', hSrcRecur: 'next occurrence', hSrcCapture: 'from capture', historyHint: 'Changes are recorded on this device and synced with the task. Up to 200 entries are kept.', hPick: 'Pick a task on the left to see its timeline.', hRecent: 'Recently changed', hOpenTask: 'Open task', hAllTasks: 'All tasks',
  templatesTitle: 'Templates', templatesSub: 'blueprints for tasks you create by hand, again and again', templatesHint: 'A template fills a new task: title, project, priority, tags, note, a due date relative to today and a reminder. Write {placeholders} in the title or note and they are asked for on use.', noTemplates: 'No templates yet — save one from a task, or add one below.', newTemplate: 'New template', templateName: 'Template name', templateTitle: 'Task title, e.g. Prep call with {client}', templateNote: 'Note or checklist (optional)', dueInDays: 'Due in', dueInDaysHint: 'days after creating; empty = no date', useTemplate: 'Create task', saveAsTemplate: 'Save as template', fillPlaceholders: 'Fill in', createTask: 'Create', usedN: 'used ', tTemplateSaved: 'Template saved', tTemplateApplied: 'Task created from template', tTemplateDeleted: 'Template deleted', confirmDeleteTemplate: 'Delete template?', fromTemplate: 'From template',
  tagsTitle: 'Tags', tagsSub: 'every #tag, where it is used, and how to tidy it', tagsHint: 'Tags are free words on tasks. Renaming applies everywhere; renaming into an existing tag merges them. Deleting a tag never touches the tasks.', noTags: 'No tags yet — add #words in Capture or in a task.', unusedTags: 'Not used by open tasks', clearUnused: 'Remove all unused', renameTag: 'Rename', mergeInto: 'Merge into ', deleteTag: 'Delete', confirmDeleteTag: 'Remove from all tasks?', addTagPh: 'add tag…', tagFilter: 'tag', tTagRenamed: 'Tag renamed', tTagMerged: 'Tags merged', tTagDeleted: 'Tag removed', lastUsed: 'last used ',
  recurTitle: 'Recurring', recurSub: 'series that come back on schedule', recurNone: 'Off', recurDaily: 'Daily', recurWeekly: 'Weekly', recurMonthly: 'Monthly', everyDay: 'every day', everyMonth: 'every month', nextLbl: 'Next', noRecurring: 'No recurring tasks — set “Repeats” on a task to start a series.', recurHint: 'Completing a recurring task closes this instance and schedules the next one in the same column.', tRolled: 'Done — next on ', doneNext: 'Done → next', historyLbl: 'completed',
  dueTitle: 'Deadlines', dueSub: 'what is due, and when to be reminded', gOverdue: 'Overdue', gToday: 'Today', gTomorrow: 'Tomorrow', gWeek: 'This week', gLater: 'Later', gUndated: 'No date yet', remindLbl: 'Remind', remindNone: 'Off', remindDay: 'On the day', remindDayBefore: 'Day before', dueDateLbl: 'Due date', clearDue: 'Clear', setDue: 'Set date', dueNotify: 'Morning push about due tasks', dueNotifyHint: 'At 9:00 on the reminder day: tasks due today, or tomorrow when “Day before” is on.', noDue: 'No deadlines — set a date on a task to see it here.', dueIn: 'in ', dueAgo: ' ago',
  searchTitle: 'Search', searchSub: 'across every task, including done and archived', searchBigPh: 'Title, note, tags, comments, project…', typeToSearch: 'Type to search. Words can match in different fields; #tags work too.', noResults: 'Nothing found for ', inNote: 'in note', inComment: 'in comment', inTags: 'in tags', inProject: 'in project', allStatuses: 'All', sArchived: 'Archived',
  statsTitle: 'Statistics', statsSub: 'how the board moves', closedThisWeek: 'Closed this week', vsLastWeek: 'vs last week', openNow: 'Open now', forgottenNow: 'Forgotten', streakLbl: 'Streak', streakUnit: 'days in a row', medianClose: 'Median time to close', daysUnit: 'days', closedPerWeek: 'Closed and created per week', createdSeries: 'created', closedSeries: 'closed', priorityMixTitle: 'Open tasks by priority', idleAgeTitle: 'Open tasks by idle time', openByProjectTitle: 'Load by project', showTable: 'Table', showChart: 'Chart', noStats: 'Nothing to show yet — close a task or two.', weekShort: 'wk', nowLbl: 'now',
  idleFresh: '0–1 d', idleWarm: '2–6 d', idleStale: '7–13 d', idleCold: '14+ d', openCol: 'open', doneCol: 'done',
  projectsTitle: 'Projects', manageProjects: 'Manage projects', newProject: 'New project', projectNamePh: 'Project name', addProject: 'Add project', deleteProject: 'Delete', confirmDeleteProject: 'Delete? Tasks stay, without a project', projectsHint: 'Projects colour the dots on cards and filter the board. Deleting one keeps its tasks.', noProjects: 'No projects yet — add the first one below.', tProjectAdded: 'Project added', tProjectDeleted: 'Project deleted — tasks kept', colorLabel: 'Colour',
  notifications: 'Reminders', notifyOn: 'On', notifyOff: 'Off', notifyDenied: 'Notifications are blocked in the browser settings', notifyUnavailable: 'Push is not available here', notifyTest: 'Send test', notifyTestSent: 'Test notification sent', notifyHint: 'Once a day at 9:00: forgotten tasks, if any.',
  gcalConnect: 'Connect Google Calendar', gcalConnected: 'Google Calendar · two-way sync', gcalSyncing: 'syncing…', gcalSyncNow: 'Sync now', gcalDisconnect: 'Disconnect', gcalError: 'Google Calendar · sync error', gcalReauth: 'Google Calendar · reconnect needed', gcalUnavailable: 'Google Calendar · not configured', gcalDenied: 'Calendar access was not granted', gcalHint: 'Tasks with a due date appear as all-day events in a “Headboard” calendar. Moves, renames and new events sync back.', gcalSynced: 'synced ',
  undo: 'Undo', tUndone: 'Undone', staleAfter: 'Forgotten after', staleAfterHint: 'Days without a touch before a task counts as forgotten: card badge, Review, digest and the daily push.', dShort: 'd',
  archiveTitle: 'Archive', restore: 'Restore to Inbox', deleteForever: 'Delete', confirmDelete: 'Delete for good?', archiveEmpty: 'Archive is empty — nothing dropped yet.', archivedOn: 'archived ', archivedBadge: 'archived', tRestored: 'Restored to Inbox', tDeleted: 'Deleted',
  seedDemo: 'Load sample data',
  DOW: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  DOWS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  MON: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  MONF: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  prShort: ['HIGH', 'MED', 'LOW'], prFull: ['High', 'Medium', 'Low'],
};

export const RU: Dict = {
  tagline: 'доска для мыслей', board: 'Доска', resurface: 'Разбор', digest: 'Дайджест', calendar: 'Календарь',
  projects: 'Проекты', allProjects: 'Все проекты', offline: 'Офлайн-режим', synced: 'синхронизировано', offlineM: 'офлайн',
  searchPh: 'Поиск задач…', capture: 'Захват', chat: 'чат', nothingHere: 'здесь пусто — отлично.',
  daysIdle: 'дней простоя', daysShort: 'дней', keep: 'Актуально', snoozeLbl: 'Отложить', snoozeDots: 'Отложить…', zTitle: 'Отложить до…', zUntil: 'Отложено до ', archive: 'В архив', bump: 'Поднять',
  noDust: 'Забытых задач нет. Загляните через пару дней.',
  digTitle: 'Дневной дайджест', digNote: 'пишет Claude · обновляется каждое утро в 8:00',
  dueToday: 'На сегодня', dustyPicks: 'Забытые', recurring: 'Повторяющиеся',
  nothingDue: 'дедлайнов нет — чистый день.', nothingSched: 'на этот день ничего нет.',
  gcal: 'Google Calendar · двусторонняя синхронизация',
  dw1: 'Пн', dw2: 'Вт', dw3: 'Ср', dw4: 'Чт', dw5: 'Пт', dw6: 'Сб', dw7: 'Вс',
  status: 'Статус', priority: 'Приоритет', claudeChat: 'Чат Claude', openChat: 'Открыть чат', bumpTop: 'Поднять наверх',
  pvNA: 'Предпросмотр недоступен', pvNAsub: 'Файл приложен ссылкой — откройте его в исходном приложении.', dl: 'Скачать',
  authSub: 'Ваша доска, ваши мысли. Войдите, чтобы задачи, проекты и чаты с Claude были везде.', google: 'Продолжить с Google', apple: 'Продолжить с Apple',
  authNote: 'Без паролей. Читаем только имя и e-mail.', language: 'Язык', signOut: 'Выйти', signedWith: 'через ', theme: 'Тема', light: 'Светлая', dark: 'Тёмная',
  attachments: 'Вложения', comments: 'Комментарии', attach: 'Прикрепить', cmPh: 'Комментарий… (Enter)', justNow: 'только что', projFilesL: 'Файлы проекта',
  capSub: 'Вставьте что угодно — чат с Claude, заметки, поток мыслей. Это станет задачами.',
  capPh: 'напр. — продумать текст страницы тарифов\n— срочно: продлить домен\n— спросить Claude про эмбеддинги #research',
  capPhM: 'Вставьте мысли, заметки, чат…',
  addOne: 'Добавить как одну задачу', discard: 'Отмена',
  sInbox: 'Инбокс', sFocus: 'В фокусе', sWaiting: 'Ожидание', sWaitingOn: 'Ожидание', sDone: 'Готово',
  all: 'Все', extract: 'Извлечь задачи', extracting: 'Извлекаю…', regen: 'Обновить', thinking: 'Думаю…',
  markDone: 'Завершить', reopen: 'Вернуть',
  today: 'сегодня', tomorrow: 'завтра', overdue: 'просрочено', snoozed: 'отложено', idleSuf: 'д простоя',
  created: 'Создано', lastTouched: 'Активность', due: 'Срок', repeats: 'Повтор', everyWeek: 'каждую неделю', weekly: 'еженед.',
  daysAgo: ' дн. назад', noProject: 'Без проекта', lastT: 'активность: ',
  sched: 'Запланировано', schedSel: 'Запланировано · выбранный день',
  bumpSort: 'сначала забытые задачи', prSort: 'по приоритету',
  tDone: 'Готово — перенесено в «Готово»', tBump: 'Поднято — счётчик сброшен', tSnooze: 'Отложено на 7 дней', tArch: 'В архиве',
  tKeep: 'Оставлено — поднято наверх колонки', tMoved: 'Перемещено: ', tReopen: 'Возвращено в «В фокусе»', tDoneS: 'Готово ✓',
  showDone: 'Готово', zTomorrow: 'Завтра', z3d: '+3 дня', zWeek: 'Через неделю', zMonth: 'Через месяц',
  digestUpdated: 'обновлено ',
  historyTitle: 'История', historySub: 'все изменения этой задачи, новые сверху', fullHistory: 'Вся история', noHistory: 'Изменений пока нет.', historyN: 'изменений', hCreated: 'Создана', hDone: 'Завершена', hReopened: 'Возвращена', hArchived: 'В архив', hRestored: 'Из архива', hTitle: 'Название', hNote: 'Заметка', hProject: 'Проект', hTags: 'Теги', hEdited: 'изменена', hCleared: 'снято', hBumped: 'счётчик простоя сброшен', hCommentRemoved: 'комментарий удалён', hCommentEdited: 'комментарий изменён', notePh: 'Добавить заметку…', chatPh: 'Вставьте ссылку на чат claude.ai…', cmEdit: 'Нажмите, чтобы изменить', cmDelete: 'Удалить комментарий', cmConfirm: 'Удалить?', projectLbl: 'Проект', hRemoved: 'удалено: ', hSrcTemplate: 'из шаблона', hSrcCalendar: 'через Google Calendar', hSrcRecur: 'следующий повтор', hSrcCapture: 'из захвата', historyHint: 'Изменения записываются на этом устройстве и синхронизируются вместе с задачей. Хранится до 200 записей.', hPick: 'Выберите задачу слева, чтобы увидеть её ленту.', hRecent: 'Недавно менялись', hOpenTask: 'Открыть задачу', hAllTasks: 'Все задачи',
  templatesTitle: 'Шаблоны', templatesSub: 'заготовки для задач, которые вы создаёте руками снова и снова', templatesHint: 'Шаблон заполняет новую задачу: название, проект, приоритет, теги, заметку, срок относительно сегодня и напоминание. Напишите {плейсхолдеры} в названии или заметке, и их спросят при применении.', noTemplates: 'Шаблонов пока нет — сохраните из задачи или добавьте ниже.', newTemplate: 'Новый шаблон', templateName: 'Название шаблона', templateTitle: 'Название задачи, напр. Подготовить созвон с {клиент}', templateNote: 'Заметка или чеклист (необязательно)', dueInDays: 'Срок через', dueInDaysHint: 'дней после создания; пусто = без срока', useTemplate: 'Создать задачу', saveAsTemplate: 'Сохранить как шаблон', fillPlaceholders: 'Заполните', createTask: 'Создать', usedN: 'применён ', tTemplateSaved: 'Шаблон сохранён', tTemplateApplied: 'Задача создана из шаблона', tTemplateDeleted: 'Шаблон удалён', confirmDeleteTemplate: 'Удалить шаблон?', fromTemplate: 'Из шаблона',
  tagsTitle: 'Теги', tagsSub: 'все #теги, где они используются и как навести порядок', tagsHint: 'Теги это свободные слова на задачах. Переименование применяется везде; переименование в существующий тег объединяет их. Удаление тега не трогает задачи.', noTags: 'Тегов пока нет — добавьте #слова в захвате или на задаче.', unusedTags: 'Нет в открытых задачах', clearUnused: 'Убрать все неиспользуемые', renameTag: 'Переименовать', mergeInto: 'Объединить с ', deleteTag: 'Удалить', confirmDeleteTag: 'Снять со всех задач?', addTagPh: 'добавить тег…', tagFilter: 'тег', tTagRenamed: 'Тег переименован', tTagMerged: 'Теги объединены', tTagDeleted: 'Тег снят', lastUsed: 'использован ',
  recurTitle: 'Повторы', recurSub: 'серии, которые возвращаются по расписанию', recurNone: 'Нет', recurDaily: 'Ежедневно', recurWeekly: 'Еженедельно', recurMonthly: 'Ежемесячно', everyDay: 'каждый день', everyMonth: 'каждый месяц', nextLbl: 'Следующая', noRecurring: 'Повторяющихся задач нет — задайте «Повтор» на задаче, чтобы начать серию.', recurHint: 'Завершение повторяющейся задачи закрывает этот экземпляр и ставит следующий в ту же колонку.', tRolled: 'Готово — следующая ', doneNext: 'Готово → следующая', historyLbl: 'выполнено',
  dueTitle: 'Сроки', dueSub: 'что и когда пора, и когда напомнить', gOverdue: 'Просрочено', gToday: 'Сегодня', gTomorrow: 'Завтра', gWeek: 'На этой неделе', gLater: 'Позже', gUndated: 'Без срока', remindLbl: 'Напомнить', remindNone: 'Нет', remindDay: 'В день срока', remindDayBefore: 'За день', dueDateLbl: 'Срок', clearDue: 'Убрать', setDue: 'Задать срок', dueNotify: 'Утренний push о сроках', dueNotifyHint: 'В 9:00 в день напоминания: задачи на сегодня, а при «За день» и на завтра.', noDue: 'Сроков нет — задайте дату задаче, и она появится здесь.', dueIn: 'через ', dueAgo: ' назад',
  searchTitle: 'Поиск', searchSub: 'по всем задачам, включая готовые и архив', searchBigPh: 'Название, заметка, теги, комментарии, проект…', typeToSearch: 'Начните вводить. Слова могут совпасть в разных полях; #теги тоже работают.', noResults: 'Ничего не найдено по запросу ', inNote: 'в заметке', inComment: 'в комментарии', inTags: 'в тегах', inProject: 'в проекте', allStatuses: 'Все', sArchived: 'В архиве',
  statsTitle: 'Статистика', statsSub: 'как движется доска', closedThisWeek: 'Закрыто за неделю', vsLastWeek: 'к прошлой неделе', openNow: 'Открыто сейчас', forgottenNow: 'Забыто', streakLbl: 'Серия', streakUnit: 'дней подряд', medianClose: 'Медиана до закрытия', daysUnit: 'дней', closedPerWeek: 'Закрыто и создано по неделям', createdSeries: 'создано', closedSeries: 'закрыто', priorityMixTitle: 'Открытые задачи по приоритету', idleAgeTitle: 'Открытые задачи по простою', openByProjectTitle: 'Нагрузка по проектам', showTable: 'Таблица', showChart: 'График', noStats: 'Пока нечего показать — закройте пару задач.', weekShort: 'нед', nowLbl: 'сейчас',
  idleFresh: '0–1 д', idleWarm: '2–6 д', idleStale: '7–13 д', idleCold: '14+ д', openCol: 'открыто', doneCol: 'готово',
  projectsTitle: 'Проекты', manageProjects: 'Настроить проекты', newProject: 'Новый проект', projectNamePh: 'Название проекта', addProject: 'Добавить проект', deleteProject: 'Удалить', confirmDeleteProject: 'Удалить? Задачи останутся без проекта', projectsHint: 'Проекты задают цвет точек на карточках и фильтр доски. Удаление проекта не трогает задачи.', noProjects: 'Проектов пока нет — добавьте первый ниже.', tProjectAdded: 'Проект добавлен', tProjectDeleted: 'Проект удалён — задачи сохранены', colorLabel: 'Цвет',
  notifications: 'Напоминания', notifyOn: 'Вкл', notifyOff: 'Выкл', notifyDenied: 'Уведомления запрещены в настройках браузера', notifyUnavailable: 'Push здесь недоступен', notifyTest: 'Тест', notifyTestSent: 'Тестовое уведомление отправлено', notifyHint: 'Раз в день в 9:00: забытые задачи, если они есть.',
  gcalConnect: 'Подключить Google Calendar', gcalConnected: 'Google Calendar · двусторонняя синхронизация', gcalSyncing: 'синхронизация…', gcalSyncNow: 'Синхронизировать', gcalDisconnect: 'Отключить', gcalError: 'Google Calendar · ошибка синхронизации', gcalReauth: 'Google Calendar · нужно переподключить', gcalUnavailable: 'Google Calendar · не настроен', gcalDenied: 'Доступ к календарю не выдан', gcalHint: 'Задачи со сроком появляются событиями на весь день в календаре «Headboard». Переносы, переименования и новые события возвращаются на доску.', gcalSynced: 'синхронизировано ',
  undo: 'Отменить', tUndone: 'Отменено', staleAfter: 'Забытая через', staleAfterHint: 'Сколько дней без активности задача считается забытой: бейдж на карточке, «Разбор», дайджест и ежедневный push.', dShort: 'д',
  archiveTitle: 'Архив', restore: 'Вернуть в Инбокс', deleteForever: 'Удалить', confirmDelete: 'Удалить навсегда?', archiveEmpty: 'Архив пуст — ничего не отпущено.', archivedOn: 'в архиве с ', archivedBadge: 'в архиве', tRestored: 'Возвращено в Инбокс', tDeleted: 'Удалено',
  seedDemo: 'Загрузить пример',
  DOW: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  DOWS: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  MON: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  MONF: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  prShort: ['ВЫС', 'СРЕД', 'НИЗ'], prFull: ['Высокий', 'Средний', 'Низкий'],
};

export function dict(lang: Lang): Dict {
  return lang === 'ru' ? RU : EN;
}

export function priorityLabel(pr: Priority, lang: Lang, full = true): string {
  const d = dict(lang);
  return (full ? d.prFull : d.prShort)[pr];
}

export function recurLabel(recur: string | null, lang: Lang, short = false): string {
  const d = dict(lang);
  if (recur === 'daily') return short ? d.recurDaily : d.everyDay;
  if (recur === 'monthly') return short ? d.recurMonthly : d.everyMonth;
  if (recur === 'weekly') return short ? d.recurWeekly : d.everyWeek;
  return short ? d.recurNone : '—';
}

export function statusLabel(status: string, lang: Lang, waitingOn = false): string {
  const d = dict(lang);
  switch (status) {
    case 'inbox': return d.sInbox;
    case 'focus': return d.sFocus;
    case 'waiting': return waitingOn ? d.sWaitingOn : d.sWaiting;
    case 'done': return d.sDone;
    default: return status;
  }
}

/** Toasts and captions that the prototype formats inline per language. */
export const phrases = {
  attached(n: number, lang: Lang) { return lang === 'ru' ? 'Прикреплено: ' + n : n === 1 ? '1 file attached' : n + ' files attached'; },
  addedToInbox(n: number, lang: Lang) { return lang === 'ru' ? 'Добавлено в Инбокс: ' + n : n + (n === 1 ? ' task' : ' tasks') + ' added to Inbox'; },
  addN(n: number, lang: Lang) { return lang === 'ru' ? 'Добавить (' + n + ')' : 'Add ' + n + (n === 1 ? ' task' : ' tasks'); },
  openTasks(n: number, lang: Lang) { return lang === 'ru' ? 'открытых задач: ' + n : n + ' open tasks'; },
  forgottenN(n: number, lang: Lang) { return lang === 'ru' ? 'забытых: ' + n : n + ' forgotten'; },
  daysRel(n: number, lang: Lang) { const a = Math.abs(n); const w = lang === 'ru' ? (a % 10 === 1 && a % 100 !== 11 ? 'день' : a % 10 >= 2 && a % 10 <= 4 && (a % 100 < 10 || a % 100 >= 20) ? 'дня' : 'дней') : a === 1 ? 'day' : 'days'; return n < 0 ? (lang === 'ru' ? a + ' ' + w + ' назад' : a + ' ' + w + ' ago') : (lang === 'ru' ? 'через ' + a + ' ' + w : 'in ' + a + ' ' + w); },
  templatesN(n: number, lang: Lang) { return lang === 'ru' ? 'шаблонов: ' + n : n + (n === 1 ? ' template' : ' templates'); },
  tagsN(n: number, lang: Lang) { return lang === 'ru' ? 'тегов: ' + n : n + (n === 1 ? ' tag' : ' tags'); },
  resultsN(n: number, lang: Lang) { return lang === 'ru' ? 'найдено: ' + n : n + (n === 1 ? ' result' : ' results'); },
  projectsN(n: number, lang: Lang) { return lang === 'ru' ? 'проектов: ' + n : n + (n === 1 ? ' project' : ' projects'); },
  changesN(n: number, lang: Lang) { return lang === 'ru' ? 'изменений: ' + n : n + (n === 1 ? ' change' : ' changes'); },
  tasksN(n: number, lang: Lang) { return lang === 'ru' ? 'задач: ' + n : n + (n === 1 ? ' task' : ' tasks'); },
  archivedN(n: number, lang: Lang) { return lang === 'ru' ? 'в архиве: ' + n : n + ' archived'; },
  reviewIntro(n: number, lang: Lang) { return lang === 'ru' ? 'Забытых задач: ' + n + ' — решите: оставить, отложить или в архив.' : n + ' forgotten tasks — give each a verdict: keep, snooze, or drop.'; },
};
