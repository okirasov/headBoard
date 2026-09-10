import { type DueGroupKey, type Task, daysUntil, dueGroups, fmtDate, phrases, undated, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { cx } from '../../lib/cx';
import { Dot, Empty, Kicker, Segmented } from '../../components/ui/primitives';
import { DueDateInput, RemindPicker } from '../../components/task/DueControls';

const BAR = { hi: 'bg-hi', med: 'bg-med', lineStrong: 'bg-lineStrong' } as const;

function Row({ task, now, tone }: { task: Task; now: number; tone: 'hi' | 'acc' | 'mut2' }) {
  const { lang } = useT();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const p = projects.find(x => x.id === task.proj);
  const d = daysUntil(task, now);
  return (
    <div className="relative flex items-center gap-14 overflow-hidden rounded-12 border border-line bg-card py-10 pl-16 pr-14 hover:border-lineStrong">
      <span className={cx('absolute bottom-0 left-0 top-0 w-4', BAR[PRIORITY_BAR_TOKEN[task.pr]])} />
      <div className="w-80 shrink-0">
        {task.due !== null && <div className={cx('font-mono text-11.5 font-semibold leading-normal', tone === 'hi' ? 'text-hi' : tone === 'acc' ? 'text-acc' : 'text-ink')}>{fmtDate(task.due, lang)}</div>}
        {d !== null && d !== 0 && <div className="font-mono text-9.5 text-mut2">{phrases.daysRel(d, lang)}</div>}
      </div>
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => set({ sel: task.id })}>
        <div className="truncate text-14 font-semibold leading-normal">{task.title}</div>
        {p && <div className="mt-2 flex items-center gap-5 text-11.5 leading-normal text-mut"><Dot color={p.color} />{p.name}</div>}
      </div>
      <DueDateInput task={task} size="sm" />
      <RemindPicker task={task} size="sm" />
    </div>
  );
}

export function DueView() {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const notifyDue = useStore(s => s.notifyDue);
  const set = useStore(s => s.set);
  const now = useNow();
  const groups = dueGroups(tasks, now);
  const later = undated(tasks).slice(0, 8);
  const total = groups.reduce((n, g) => n + g.tasks.length, 0);
  const label: Record<DueGroupKey, string> = { overdue: T.gOverdue, today: T.gToday, tomorrow: T.gTomorrow, week: T.gWeek, later: T.gLater };
  const tone = (k: DueGroupKey): 'hi' | 'acc' | 'mut2' => (k === 'overdue' ? 'hi' : k === 'today' ? 'acc' : 'mut2');

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <div className="flex items-baseline gap-14">
        <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.dueTitle}</h1>
        <div className="text-12 leading-normal text-mut2">{T.dueSub}</div>
      </div>
      <div className="mt-14 flex max-w-820 items-center gap-14 rounded-12 border border-line bg-panel px-14 py-10">
        <div className="min-w-0 flex-1">
          <div className="text-13 font-semibold leading-normal">{T.dueNotify}</div>
          <div className="mt-2 text-11.5 leading-normal text-mut2">{T.dueNotifyHint}</div>
        </div>
        <div className="w-150"><Segmented value={notifyDue ? 'on' : 'off'} onChange={v => set({ notifyDue: v === 'on' })} options={[{ v: 'on', label: T.notifyOn }, { v: 'off', label: T.notifyOff }]} /></div>
      </div>
      <div className="mt-16 flex max-w-820 flex-col gap-18">
        {total === 0 && <Empty className="py-6 text-14">{T.noDue}</Empty>}
        {groups.filter(g => g.tasks.length > 0).map(g => (
          <section key={g.key} className="flex flex-col gap-8">
            <div className="flex items-center gap-8"><Kicker size={10} className={cx(g.key === 'overdue' && '!text-hi', g.key === 'today' && '!text-acc')}>{label[g.key]}</Kicker><span className="font-mono text-10.5 text-mut2">{g.tasks.length}</span></div>
            {g.tasks.map(t => <Row key={t.id} task={t} now={now} tone={tone(g.key)} />)}
          </section>
        ))}
        {later.length > 0 && (
          <section className="flex flex-col gap-8">
            <div className="flex items-center gap-8"><Kicker size={10}>{label.later === T.gLater ? T.gUndated : T.gUndated}</Kicker><span className="font-mono text-10.5 text-mut2">{undated(tasks).length}</span></div>
            {later.map(t => <Row key={t.id} task={t} now={now} tone="mut2" />)}
          </section>
        )}
      </div>
      <div className="sr-only">{phrases.tasksN(total, lang)}</div>
    </div>
  );
}
