// Development-only sample data (mirrors the handoff prototype). Never imported in production builds.
import { DAY_MS, newTask, withHistory, type FileRef, type Project, type Task } from '@headboard/core';

export function buildSeed(now = Date.now()): { tasks: Task[]; projects: Project[]; projFiles: Record<string, FileRef[]> } {
  const d = DAY_MS;
  const projects: Project[] = [
    { id: 'p1', name: 'AI Research', color: 'var(--acc)' },
    { id: 'p2', name: 'Headboard Build', color: 'var(--ok)' },
    { id: 'p3', name: 'Writing', color: '#6B7FA3' },
    { id: 'p4', name: 'Home Ops', color: '#9A7B2D' },
    { id: 'p5', name: 'Health', color: '#97658C' },
  ];
  const T = (id: string, title: string, proj: string, pr: 0 | 1 | 2, status: Task['status'], idle: number, extra: Partial<Task> = {}) =>
    seedHistory(newTask({ id, title, proj, pr, status, touched: now - idle * d, created: now - (idle + 4) * d, ...extra }, now), now);
  // Replay a plausible past for the change log: created → (priority) → column move → comments / done.
  const seedHistory = (t: Task, at: number): Task => {
    const base: Task = { ...t, status: 'inbox', pr: 1, comments: [], files: [], doneAt: null, due: t.due === null ? null : t.due + 2 * d, tags: t.tags.slice(0, 1), history: t.history };
    let cur = base;
    const step = (next: Partial<Task>, when: number) => { cur = withHistory(cur, { ...cur, ...next }, when); };
    const c = t.created;
    if (t.tags.length > 1) step({ tags: t.tags }, c + 0.2 * d);
    if (t.pr !== 1) step({ pr: t.pr }, c + 0.5 * d);
    if (t.due !== null) step({ due: t.due }, c + 1 * d);
    if (t.status !== 'inbox' && t.status !== 'done') step({ status: t.status }, c + 1.5 * d);
    if (t.files.length) step({ files: t.files }, c + 2 * d);
    for (const cm of t.comments) step({ comments: [...cur.comments, cm] }, cm.at);
    if (t.status === 'done') { step({ status: 'focus' }, c + 1.5 * d); step({ status: 'done', doneAt: t.doneAt }, t.doneAt ?? at); }
    return { ...t, history: cur.history };
  };
  const tasks = [
    T('t1', 'Compare vector DBs for the memory feature', 'p2', 0, 'inbox', 0, { tags: ['infra', 'claude'], chat: 'https://claude.ai/', note: 'Pinecone vs pgvector vs sqlite-vss. Need a call before the sync spike lands.', files: [{ id: 'sf1', name: 'benchmarks.csv', kind: 'file', size: 18400 }] }),
    T('t2', 'Is spaced repetition the right resurfacing model?', 'p1', 1, 'inbox', 2, { tags: ['ux'], chat: 'https://claude.ai/' }),
    T('t3', 'Book dentist appointment', 'p5', 1, 'inbox', 1, { due: now + 3 * d }),
    T('t4', 'Outline essay: why personal boards fail', 'p3', 2, 'inbox', 4, { tags: ['essay'] }),
    T('t16', 'Water the plants', 'p4', 2, 'inbox', 1, { recur: 'weekly', due: now + 1 * d }),
    T('t5', 'Draft Headboard data model with Claude', 'p2', 0, 'focus', 0, { tags: ['claude'], due: now, chat: 'https://claude.ai/', note: 'Tasks, projects, activity log. Decide: single table + views, or separate entities.', comments: [{ id: 'sc1', text: 'Claude suggested a single-table design with views — reviewing tonight.', at: now - 0.1 * d }, { id: 'sc2', text: 'Compare with how Linear models issues before deciding.', at: now - 0.04 * d }], files: [{ id: 'sf2', name: 'data-model-v2.png', kind: 'img' }, { id: 'sf3', name: 'schema-notes.md', kind: 'file', size: 4200 }] }),
    T('t6', 'Prompt library for task extraction', 'p1', 0, 'focus', 1, { tags: ['prompts'], chat: 'https://claude.ai/' }),
    T('t7', 'Design the weekly review ritual', 'p2', 1, 'focus', 12, { tags: ['ux'], note: 'Sunday evening, 20 min. What does the board show first?', comments: [{ id: 'sc3', text: 'Maybe the digest IS the review — merge them?', at: now - 5 * d }] }),
    T('t8', 'Rebuild morning routine', 'p5', 2, 'focus', 9),
    T('t15', 'Weekly digest review', 'p2', 1, 'focus', 3, { recur: 'weekly', due: now }),
    T('t9', 'Accountant reply on LLC structure', 'p4', 1, 'waiting', 6, { due: now + 2 * d }),
    T('t10', 'Calendar API beta invite', 'p2', 1, 'waiting', 15, { chat: 'https://claude.ai/', note: 'Waitlisted 2 weeks ago. Ping them or build ICS export instead?', files: [{ id: 'sf4', name: 'waitlist-confirmation.pdf', kind: 'file', size: 96000 }] }),
    T('t11', "N.'s feedback on essay draft", 'p3', 2, 'waiting', 8),
    T('t12', 'Offline sync spike: CRDT vs op-log', 'p2', 1, 'done', 1, { chat: 'https://claude.ai/', doneAt: now - 1 * d }),
    T('t13', 'Migrate notes out of Apple Notes', 'p4', 2, 'done', 2, { doneAt: now - 2 * d }),
    T('t14', 'Interview notes → summary prompt', 'p1', 0, 'done', 0, { chat: 'https://claude.ai/', doneAt: now - 0.3 * d }),
    T('t17', 'Try the Obsidian plugin for weekly notes', 'p3', 2, 'archived', 20, { tags: ['tools'], archivedAt: now - 6 * d }),
    T('t18', 'Read paper on memory consolidation', 'p1', 1, 'archived', 30, { chat: 'https://claude.ai/', archivedAt: now - 14 * d }),
  ];
  const projFiles: Record<string, FileRef[]> = { p2: [{ id: 'pf1', name: 'headboard-moodboard.png', kind: 'img' }, { id: 'pf2', name: 'prd-v1.pdf', kind: 'file', size: 240000 }] };
  return { tasks, projects, projFiles };
}
