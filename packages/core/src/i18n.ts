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
  gcalConnect: string; gcalConnected: string; gcalSyncing: string; gcalSyncNow: string; gcalDisconnect: string; gcalError: string; gcalReauth: string; gcalUnavailable: string; gcalDenied: string; gcalHint: string; gcalSynced: string;
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
  gcalConnect: 'Connect Google Calendar', gcalConnected: 'Google Calendar · two-way sync', gcalSyncing: 'syncing…', gcalSyncNow: 'Sync now', gcalDisconnect: 'Disconnect', gcalError: 'Google Calendar · sync error', gcalReauth: 'Google Calendar · reconnect needed', gcalUnavailable: 'Google Calendar · not configured', gcalDenied: 'Calendar access was not granted', gcalHint: 'Tasks with a due date appear as all-day events in a “Headboard” calendar. Moves, renames and new events sync back.', gcalSynced: 'synced ',
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
  gcalConnect: 'Подключить Google Calendar', gcalConnected: 'Google Calendar · двусторонняя синхронизация', gcalSyncing: 'синхронизация…', gcalSyncNow: 'Синхронизировать', gcalDisconnect: 'Отключить', gcalError: 'Google Calendar · ошибка синхронизации', gcalReauth: 'Google Calendar · нужно переподключить', gcalUnavailable: 'Google Calendar · не настроен', gcalDenied: 'Доступ к календарю не выдан', gcalHint: 'Задачи со сроком появляются событиями на весь день в календаре «Headboard». Переносы, переименования и новые события возвращаются на доску.', gcalSynced: 'синхронизировано ',
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
  archivedN(n: number, lang: Lang) { return lang === 'ru' ? 'в архиве: ' + n : n + ' archived'; },
  reviewIntro(n: number, lang: Lang) { return lang === 'ru' ? 'Забытых задач: ' + n + ' — решите: оставить, отложить или в архив.' : n + ' forgotten tasks — give each a verdict: keep, snooze, or drop.'; },
};
