import { useEffect, useRef, useState } from 'react';
import { type Priority, type SearchHit, type Status, dueLabel, dueTone, highlight, idleDays, phrases, priorityLabel, searchTasks, statusLabel, tokenize, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { cx } from '../../lib/cx';
import { Chip, Dot, Empty } from '../../components/ui/primitives';
import { IcSearch, IcX } from '../../components/ui/Icons';

const STATUSES: Array<Status | null> = [null, 'inbox', 'focus', 'waiting', 'done', 'archived'];
const BAR = { hi: 'bg-hi', med: 'bg-med', lineStrong: 'bg-lineStrong' } as const;
const TONE = { hi: 'text-hi', acc: 'text-acc', mut2: 'text-mut2' } as const;

export function Marked({ text, words, className }: { text: string; words: string[]; className?: string }) {
  return (
    <span className={className}>
      {highlight(text, words).map((r, i) => (r.hit ? <mark key={i} className="rounded-2 bg-heat2b px-1 text-ink">{r.text}</mark> : <span key={i}>{r.text}</span>))}
    </span>
  );
}

function statusName(s: Status, T: ReturnType<typeof useT>['T'], lang: 'en' | 'ru') {
  return s === 'archived' ? T.sArchived : statusLabel(s, lang);
}

function ResultRow({ hit, words, now }: { hit: SearchHit; words: string[]; now: number }) {
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const t = hit.task;
  const p = projects.find(x => x.id === t.proj);
  const fieldLabel = { note: T.inNote, comment: T.inComment, tags: T.inTags, project: T.inProject, title: '' } as const;
  const due = dueLabel(t, lang, now);
  const idle = idleDays(t, now);
  const closed = t.status === 'done' || t.status === 'archived';
  return (
    <div onClick={() => set({ sel: t.id })} className="relative flex cursor-pointer flex-col gap-6 overflow-hidden rounded-12 border border-line bg-card py-11 pl-16 pr-14 hover:border-lineStrong hover:shadow-card-hover">
      <span className={cx('absolute bottom-0 left-0 top-0 w-4', BAR[PRIORITY_BAR_TOKEN[t.pr]])} />
      <div className="flex items-center gap-8">
        <span className={cx('rounded-7 px-6 py-1 font-mono text-9.5 uppercase tracking-kicker', t.status === 'archived' ? 'bg-heat2b text-goldInk' : t.status === 'done' ? 'bg-okBg text-ok' : 'bg-inset text-mut2')}>{statusName(t.status, T, lang)}</span>
        {p && <span className="flex items-center gap-5 text-11.5 leading-normal text-mut"><Dot color={p.color} />{hit.fields.includes('project') ? <Marked text={p.name} words={words} /> : p.name}</span>}
        <span className="flex-1" />
        {due && !closed && <span className={cx('font-mono text-10.5', TONE[dueTone(t, now)])}>{due}</span>}
        {!closed && idle >= 2 && <span className="font-mono text-10.5 text-mut2">{idle}{T.idleSuf}</span>}
        <span className="font-mono text-9.5 uppercase tracking-kicker text-faint">{priorityLabel(t.pr, lang, false)}</span>
      </div>
      <Marked text={t.title} words={words} className={cx('text-14.5 font-semibold leading-normal', closed && 'text-mut')} />
      {hit.snippet && (
        <div className="flex items-baseline gap-8 text-12.5 leading-[1.5] text-mut">
          <span className="shrink-0 font-mono text-9.5 uppercase tracking-kicker text-mut2">{fieldLabel[hit.snippet.field]}</span>
          <Marked text={hit.snippet.text} words={words} />
        </div>
      )}
    </div>
  );
}

export function SearchView() {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const projects = useStore(s => s.projects);
  const q = useStore(s => s.q);
  const set = useStore(s => s.set);
  const now = useNow();
  const [status, setStatus] = useState<Status | null>(null);
  const [pr, setPr] = useState<Priority | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);

  const words = tokenize(q);
  const hits = words.length ? searchTasks(tasks, projects, q, { statuses: status ? [status] : undefined, priority: pr }) : [];
  const prChips: Array<{ v: Priority | null; L: string }> = [{ v: null, L: T.all }, ...([0, 1, 2] as Priority[]).map(i => ({ v: i, L: priorityLabel(i, lang) }))];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <div className="flex items-baseline gap-14">
        <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.searchTitle}</h1>
        <div className="text-12 leading-normal text-mut2">{T.searchSub}</div>
      </div>
      <div className="relative mt-14 max-w-820">
        <IcSearch size={16} className="absolute left-14 top-1/2 -translate-y-1/2 text-mut2" />
        <input
          ref={input}
          value={q}
          onChange={e => set({ q: e.target.value })}
          placeholder={T.searchBigPh}
          className="w-full rounded-12 border border-line bg-card py-12 pl-40 pr-40 font-sans text-16 leading-normal text-ink placeholder:text-faint focus:border-lineStrong"
        />
        {q && <button type="button" onClick={() => { set({ q: '' }); input.current?.focus(); }} className="absolute right-12 top-1/2 flex h-24 w-24 -translate-y-1/2 cursor-pointer items-center justify-center rounded-7 text-mut2 hover:bg-sel hover:text-ink" aria-label="clear"><IcX size={11} /></button>}
      </div>
      <div className="mt-12 flex max-w-820 flex-wrap items-center gap-5">
        {STATUSES.map(s => <Chip key={String(s)} active={status === s} onClick={() => setStatus(s)}>{s === null ? T.allStatuses : statusName(s, T, lang)}</Chip>)}
        <span className="mx-3 w-px self-stretch bg-line" />
        {prChips.map(ch => <Chip key={String(ch.v)} active={pr === ch.v} onClick={() => setPr(ch.v)}>{ch.L}</Chip>)}
        <span className="flex-1" />
        {words.length > 0 && <span className="font-mono text-10.5 text-mut2">{phrases.resultsN(hits.length, lang)}</span>}
      </div>
      <div className="mt-14 flex max-w-820 flex-col gap-8">
        {!words.length && <Empty className="py-10 text-14">{T.typeToSearch}</Empty>}
        {words.length > 0 && hits.length === 0 && <Empty className="py-10 text-14">{T.noResults}«{q.trim()}»</Empty>}
        {hits.map(h => <ResultRow key={h.task.id} hit={h} words={words} now={now} />)}
      </div>
    </div>
  );
}
