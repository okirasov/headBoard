import { DAY_MS, STALE_DAYS_DEFAULT, type Lang, type Task } from './model';
import { dueDiff, idleDays, isStale, live } from './tasks';

export interface DigestStats {
  dueN: number; dueFirst: string;
  staleN: number; oldT: string; oldI: number;
  doneW: number; focusN: number; recN: number;
  due: Task[]; stale: Task[];
}

export function digestStats(tasks: Task[], now: number, staleDays = STALE_DAYS_DEFAULT): DigestStats {
  const lv = live(tasks);
  const due = lv.filter(t => t.status !== 'done' && dueDiff(t, now) !== null && (dueDiff(t, now) as number) <= 0);
  const stale = lv.filter(t => isStale(t, now, staleDays)).sort((a, b) => idleDays(b, now) - idleDays(a, now));
  const doneW = lv.filter(t => t.status === 'done' && t.doneAt && now - t.doneAt < 7 * DAY_MS).length;
  return {
    dueN: due.length, dueFirst: due[0] ? due[0].title : '—',
    staleN: stale.length, oldT: stale[0] ? stale[0].title : '—', oldI: stale[0] ? idleDays(stale[0], now) : 0,
    doneW, focusN: lv.filter(t => t.status === 'focus').length,
    recN: lv.filter(t => t.recur).length, due, stale,
  };
}

export function cannedDigest(i: number, s: DigestStats, lang: Lang): string {
  const arr = lang === 'ru' ? [
    'На сегодня: ' + s.dueN + ' — начните с «' + s.dueFirst + '». Забытых задач: ' + s.staleN + '; «' + s.oldT + '» ждёт уже ' + s.oldI + ' дн. — пора решить: сделать, делегировать или отпустить. За неделю закрыто ' + s.doneW + ' — держите темп.',
    'В фокусе ' + s.focusN + ' задач — ещё одна, и станет тесно. «' + s.oldT + '» (' + s.oldI + ' дн. простоя) — ваш самый старый открытый вопрос: закройте его или отпустите. За 7 дней завершено: ' + s.doneW + '.',
    'Спокойный день: на сегодня ' + s.dueN + ', повторяющихся ' + s.recN + '. Забытых задач: ' + s.staleN + ' — откройте «Разбор» и отправьте в архив то, что уже не актуально.',
  ] : [
    s.dueN + ' due today — start with “' + s.dueFirst + '”. ' + s.staleN + ' tasks are forgotten; “' + s.oldT + '” has waited ' + s.oldI + ' days and deserves a verdict: do it, delegate it, or drop it. You closed ' + s.doneW + ' this week — keep the streak.',
    'Focus is holding ' + s.focusN + ' tasks, which is one decision away from too many. “' + s.oldT + '” (' + s.oldI + ' days idle) is your oldest open loop — close it or let it go. ' + s.doneW + ' finished in the last 7 days.',
    'A calm day: ' + s.dueN + ' due, ' + s.recN + ' recurring. ' + s.staleN + ' tasks are forgotten — open Review and archive what no longer matters.',
  ];
  return arr[i % arr.length];
}

export function digestStatsLine(s: DigestStats, lang: Lang): string {
  return lang === 'ru'
    ? 'на сегодня: ' + s.dueN + ' · забытых: ' + s.staleN + ' · закрыто за неделю: ' + s.doneW
    : s.dueN + ' due today · ' + s.staleN + ' forgotten · ' + s.doneW + ' closed this week';
}

/** Prompt used by the AI digest endpoint (kept here so web/mobile/api agree). */
export function digestPrompt(s: DigestStats, lang: Lang): string {
  const langReq = lang === 'ru' ? ' Answer in Russian.' : '';
  return 'You write a terse daily digest for a personal task board. Stats: ' + s.dueN + ' due today (' + s.dueFirst + '); ' + s.staleN + ' forgotten tasks, oldest "' + s.oldT + '" idle ' + s.oldI + ' days; ' + s.doneW + ' completed in the last week; ' + s.focusN + ' in focus. Write 2-3 plain sentences, direct, second person, no emoji, no markdown, no preamble.' + langReq;
}
