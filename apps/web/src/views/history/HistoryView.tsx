import { type HistoryEntry, type Task, fmtDate, historyByDay, historyText, historyTime, phrases, startOfDay } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { cx } from '../../lib/cx';
import { Button, Dot, Empty, Kicker } from '../../components/ui/primitives';
import { IcHistory } from '../../components/ui/Icons';

const DOT: Partial<Record<HistoryEntry['kind'], string>> = {
  created: 'bg-acc', done: 'bg-ok', reopened: 'bg-ok', archived: 'bg-hi', restored: 'bg-acc',
  file_removed: 'bg-hi', comment_removed: 'bg-hi',
};

function lastEntry(t: Task): HistoryEntry | null {
  const h = t.history ?? [];
  return h.length ? h.reduce((a, b) => (b.at > a.at ? b : a)) : null;
}

/** Tasks ordered by their latest change, newest first. */
function recentlyChanged(tasks: Task[]): Array<{ task: Task; last: HistoryEntry }> {
  return tasks
    .map(task => ({ task, last: lastEntry(task) }))
    .filter((x): x is { task: Task; last: HistoryEntry } => x.last !== null)
    .sort((a, b) => b.last.at - a.last.at);
}

function TaskList({ rows, active, onPick }: { rows: Array<{ task: Task; last: HistoryEntry }>; active: string | null; onPick: (id: string) => void }) {
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const now = useNow();
  return (
    <div className="flex w-300 shrink-0 flex-col overflow-y-auto border-r border-line bg-panel px-12 pb-16 pt-18">
      <Kicker className="mb-8 px-6">{T.hRecent}</Kicker>
      <div className="flex flex-col gap-2">
        {rows.map(({ task, last }) => {
          const { label } = historyText(last, lang, projects);
          const when = startOfDay(last.at) === startOfDay(now) ? historyTime(last) : fmtDate(last.at, lang);
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onPick(task.id)}
              className={cx('flex cursor-pointer flex-col gap-2 rounded-9 border px-10 py-8 text-left', active === task.id ? 'border-lineStrong bg-inset' : 'border-transparent hover:bg-inset')}
            >
              <div className={cx('truncate text-13 font-semibold leading-normal', task.status === 'archived' && 'text-mut')}>{task.title}</div>
              <div className="flex items-center gap-6 font-mono text-10.5 text-mut2"><span className="truncate">{label}</span><span>·</span><span className="shrink-0">{when}</span></div>
            </button>
          );
        })}
        {rows.length === 0 && <Empty className="py-10 text-13">{T.noHistory}</Empty>}
      </div>
    </div>
  );
}

function Timeline({ task }: { task: Task }) {
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const now = useNow();
  const p = projects.find(x => x.id === task.proj);
  const groups = historyByDay(task.history ?? []);
  return (
    <div className="max-w-720">
      <div className="mb-16 flex items-start gap-14 rounded-12 border border-line bg-card px-16 py-14">
        <div className="min-w-0 flex-1">
          <div className="text-pretty font-sans text-18 font-medium leading-[1.3] tracking-tightSm">{task.title}</div>
          <div className="mt-4 flex items-center gap-10 text-11.5 leading-normal text-mut">
            {p && <span className="flex items-center gap-5"><Dot color={p.color} />{p.name}</span>}
            <span className="font-mono text-10.5 text-mut2">{phrases.changesN((task.history ?? []).length, lang)}</span>
            <span className="font-mono text-10.5 text-mut2">{T.created} {fmtDate(task.created, lang)}</span>
          </div>
        </div>
        <Button variant="outline" hoverTone="acc" className="shrink-0 rounded-9 px-12 py-7 text-12" onClick={() => set({ sel: task.id })}>{T.hOpenTask}</Button>
      </div>
      {groups.map(g => (
        <div key={g.day} className="mb-14">
          <Kicker className="mb-6">{startOfDay(now) === g.day ? T.today : fmtDate(g.day, lang)}</Kicker>
          <div className="relative ml-56 border-l border-line pl-16">
            {g.entries.map(e => {
              const { label, detail } = historyText(e, lang, projects);
              return (
                <div key={e.id} className="relative flex items-baseline gap-10 py-5">
                  <span className={cx('absolute -left-[21px] top-[11px] h-8 w-8 rounded-full', DOT[e.kind] ?? 'bg-lineStrong')} />
                  <span className="absolute -left-72 w-48 text-right font-mono text-10.5 text-mut2">{historyTime(e)}</span>
                  <span className="shrink-0 text-13 font-semibold leading-normal">{label}</span>
                  {detail && <span className="min-w-0 text-12.5 leading-normal text-mut">{detail}</span>}
                  {e.source && e.kind !== 'created' && <span className="rounded-7 border border-line px-5 font-mono text-9 uppercase tracking-kicker text-mut2">{e.source}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {groups.length === 0 && <Empty className="py-10 text-14">{T.noHistory}</Empty>}
    </div>
  );
}

export function HistoryView() {
  const { T } = useT();
  const tasks = useStore(s => s.tasks);
  const histId = useStore(s => s.histId);
  const set = useStore(s => s.set);
  const rows = recentlyChanged(tasks);
  const task = tasks.find(t => t.id === histId) ?? null;
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <TaskList rows={rows} active={histId} onPick={id => set({ histId: id })} />
      <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
        <div className="flex items-baseline gap-14">
          <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.historyTitle}</h1>
          <div className="text-12 leading-normal text-mut2">{T.historySub}</div>
        </div>
        <div className="mb-16 mt-4 max-w-720 text-12.5 leading-normal text-mut2">{T.historyHint}</div>
        {task ? <Timeline task={task} /> : (
          <div className="flex max-w-720 items-center gap-10 rounded-12 border border-dashed border-line px-16 py-18 text-13 text-mut2"><IcHistory size={14} className="text-mut2" />{T.hPick}</div>
        )}
      </div>
    </div>
  );
}
