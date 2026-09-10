import { type Task, daysUntil, fmtDate, phrases, recurLabel, recurringTasks, seriesHistory, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { cx } from '../../lib/cx';
import { Button, Dot, Empty } from '../../components/ui/primitives';
import { IcCheck, IcRepeat } from '../../components/ui/Icons';
import { DueDateInput, RecurPicker } from '../../components/task/DueControls';

const BAR = { hi: 'bg-hi', med: 'bg-med', lineStrong: 'bg-lineStrong' } as const;

function Row({ task, now }: { task: Task; now: number }) {
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const tasks = useStore(s => s.tasks);
  const set = useStore(s => s.set);
  const complete = useStore(s => s.complete);
  const p = projects.find(x => x.id === task.proj);
  const d = daysUntil(task, now);
  const history = seriesHistory(tasks, task);
  const tone = d === null ? 'text-mut2' : d < 0 ? 'text-hi' : d === 0 ? 'text-acc' : 'text-ink';
  return (
    <div className="relative flex flex-col gap-10 overflow-hidden rounded-12 border border-line bg-card py-12 pl-16 pr-14 hover:border-lineStrong">
      <span className={cx('absolute bottom-0 left-0 top-0 w-4', BAR[PRIORITY_BAR_TOKEN[task.pr]])} />
      <div className="flex items-center gap-12">
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => set({ sel: task.id })}>
          <div className="flex items-center gap-8">
            <IcRepeat size={12} className="shrink-0 text-mut2" />
            <div className="truncate text-14.5 font-semibold leading-normal">{task.title}</div>
          </div>
          <div className="mt-2 flex items-center gap-10 text-11.5 leading-normal text-mut">
            {p && <span className="flex items-center gap-5"><Dot color={p.color} />{p.name}</span>}
            <span className="font-mono text-10.5 text-mut2">{recurLabel(task.recur, lang)}</span>
            {history.length > 0 && <span className="font-mono text-10.5 text-mut2">{history.length} {T.historyLbl}</span>}
          </div>
        </div>
        <div className="w-110 shrink-0 text-right">
          <div className="font-mono text-9.5 uppercase tracking-kicker text-mut2">{T.nextLbl}</div>
          <div className={cx('font-mono text-12.5 font-semibold leading-normal', tone)}>{task.due !== null ? fmtDate(task.due, lang) : '—'}</div>
          {d !== null && d !== 0 && <div className="font-mono text-9.5 text-mut2">{phrases.daysRel(d, lang)}</div>}
        </div>
        <Button variant="ok" className="rounded-9 px-12 py-7 text-12" onClick={() => complete(task.id)}><IcCheck size={11} />{T.doneNext}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-12">
        <RecurPicker task={task} size="sm" />
        <span className="h-14 w-px bg-line" />
        <DueDateInput task={task} size="sm" />
      </div>
    </div>
  );
}

export function RecurringView() {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const now = useNow();
  const rows = recurringTasks(tasks);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <div className="flex items-baseline gap-14">
        <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.recurTitle}</h1>
        <div className="text-12 leading-normal text-mut2">{T.recurSub}</div>
        <span className="flex-1" />
        <span className="font-mono text-10.5 text-mut2">{phrases.tasksN(rows.length, lang)}</span>
      </div>
      <div className="mb-16 mt-4 max-w-820 text-12.5 leading-normal text-mut2">{T.recurHint}</div>
      <div className="flex max-w-820 flex-col gap-10">
        {rows.map(t => <Row key={t.id} task={t} now={now} />)}
        {rows.length === 0 && <Empty className="py-10 text-14">{T.noRecurring}</Empty>}
      </div>
    </div>
  );
}
