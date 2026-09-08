import { type MonthDay, buildMonthGrid, dueLabel, dueTone, live, monthLabel, startOfDay, weekdayLabels } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { Dot, Empty } from '../../components/ui/primitives';
import { cx } from '../../lib/cx';

const TONE = { hi: 'text-hi', acc: 'text-acc', mut2: 'text-mut2' } as const;

function DayCell({ d, onClick }: { d: MonthDay; onClick: () => void }) {
  const heat = d.inMonth && !d.isToday && !d.isSelected && d.count > 0 && d.isFuture;
  const bg = d.isToday ? 'bg-acc' : d.isSelected ? 'bg-sel' : heat ? (d.heavy ? 'bg-heat2' : 'bg-heat1') : 'bg-transparent';
  const bd = d.isSelected ? 'border-lineStrong' : heat && d.heavy ? 'border-heat2bd' : 'border-transparent';
  const num = d.isToday ? 'text-onAcc' : d.inMonth ? 'text-ink' : 'text-ghost';
  const badge = d.isToday ? 'bg-[color:var(--onAcc)]/20 text-onAcc' : !d.isFuture ? 'bg-inset text-faint' : d.heavy ? 'bg-heat2b text-goldInk' : 'bg-card text-mut';
  return (
    <div onClick={onClick} className={cx('flex h-46 cursor-pointer flex-col items-center justify-center gap-3 rounded-10 border', bg, bd)}>
      <span className={cx('text-12.5 font-medium leading-normal', num)}>{d.n}</span>
      <span className="flex h-14 items-center justify-center">
        {d.count > 0 && <span className={cx('rounded-7 px-5 py-2.5 font-mono text-9.5 font-semibold leading-none', badge)}>{d.count}</span>}
      </span>
    </div>
  );
}

export function CalendarView() {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const calSel = useStore(s => s.calSel);
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const now = useNow();
  const weeks = buildMonthGrid(tasks, { now, selected: calSel });
  const sched = live(tasks).filter(t => t.due !== null && t.status !== 'done').sort((a, b) => (a.due as number) - (b.due as number));
  const rows = calSel ? sched.filter(t => startOfDay(t.due as number) === calSel) : sched;
  const cols = { gridTemplateColumns: 'repeat(7, 46px)' };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <div className="flex items-baseline gap-14">
        <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.calendar}</h1>
        <div className="flex items-center gap-6 rounded-7 border border-okBd bg-okBg px-10 py-3 font-mono text-10.5 text-ok"><Dot color="var(--ok)" size={6} />{T.gcal}</div>
      </div>
      <div className="mt-16 flex items-start gap-20">
        <div className="shrink-0 rounded-16 border border-line bg-card p-20">
          <div className="mb-12 font-sans text-18 italic leading-normal">{monthLabel(now, 0, lang)}</div>
          <div className="mb-6 grid gap-4 text-center font-mono text-9.5 uppercase tracking-[1px] text-mut2" style={cols}>
            {weekdayLabels(lang).map(w => <span key={w}>{w}</span>)}
          </div>
          <div className="flex flex-col gap-4">
            {weeks.map(w => (
              <div key={w.key} className="grid gap-4" style={cols}>
                {w.days.map(d => <DayCell key={d.ts} d={d} onClick={() => set({ calSel: d.isSelected ? null : d.ts })} />)}
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 max-w-520 flex-1 rounded-16 border border-line bg-card px-18 py-16">
          <div className="mb-10 text-11.5 font-semibold uppercase leading-normal tracking-[1px] text-mut">{calSel ? T.schedSel : T.sched}</div>
          <div className="flex flex-col">
            {rows.map(t => (
              <div key={t.id} onClick={() => set({ sel: t.id })} className="flex cursor-pointer items-center gap-10 border-b border-rowLine px-2 py-9">
                <span className={cx('w-80 shrink-0 font-mono text-10.5', TONE[dueTone(t, now)])}>{dueLabel(t, lang, now)}</span>
                <Dot color={projects.find(p => p.id === t.proj)?.color ?? 'var(--mut2)'} />
                <span className="flex-1 text-13.5 font-medium leading-normal">{t.title}</span>
                {t.recur && <span className="font-mono text-10 text-mut2">↻ {T.weekly}</span>}
              </div>
            ))}
            {rows.length === 0 && <Empty className="px-2 py-6 text-13">{T.nothingSched}</Empty>}
          </div>
        </div>
      </div>
    </div>
  );
}
