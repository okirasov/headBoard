import { useState } from 'react';
import { type Priority, fmtDate, idleBuckets, openByProject, priorityLabel, priorityMix, statsSummary, weeklyActivity, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { Chip, Dot } from '../../components/ui/primitives';
import { ChartCard, DataTable, GroupedBars, HBars, StackedBar, StatTile } from './charts';

const BAR_COLOR: Record<Priority, string> = { 0: `var(--${PRIORITY_BAR_TOKEN[0]})`, 1: `var(--${PRIORITY_BAR_TOKEN[1]})`, 2: `var(--${PRIORITY_BAR_TOKEN[2]})` };

export function StatsView() {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const projects = useStore(s => s.projects);
  const now = useNow();
  const [table, setTable] = useState(false);

  const staleDays = useStore(s => s.staleDays);
  const sum = statsSummary(tasks, now, staleDays);
  const weeks = weeklyActivity(tasks, now, 8);
  const mix = priorityMix(tasks);
  const idle = idleBuckets(tasks, now);
  const load = openByProject(tasks, projects);
  const delta = sum.closedWeek - sum.closedPrevWeek;
  const idleLabel = { fresh: T.idleFresh, warm: T.idleWarm, stale: T.idleStale, cold: T.idleCold } as const;
  const weekLabel = (start: number, isCurrent: boolean) => (isCurrent ? T.nowLbl : fmtDate(start, lang));

  const groups = weeks.map(w => ({
    label: weekLabel(w.start, w.isCurrent), emphasis: w.isCurrent,
    series: [
      { key: 'closed', name: T.closedSeries, value: w.closed, color: 'var(--acc)' },
      { key: 'created', name: T.createdSeries, value: w.created, color: 'var(--mut2)' },
    ],
  }));
  const legend = [{ name: T.closedSeries, color: 'var(--acc)' }, { name: T.createdSeries, color: 'var(--mut2)' }];
  const empty = tasks.length === 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <div className="flex items-baseline gap-14">
        <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.statsTitle}</h1>
        <div className="text-12 leading-normal text-mut2">{T.statsSub}</div>
        <span className="flex-1" />
        <div className="flex gap-5">
          <Chip active={!table} onClick={() => setTable(false)}>{T.showChart}</Chip>
          <Chip active={table} onClick={() => setTable(true)}>{T.showTable}</Chip>
        </div>
      </div>
      <div className="mt-16 grid max-w-1080 gap-12" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <StatTile label={T.closedThisWeek} value={sum.closedWeek} delta={(delta > 0 ? '+' : '') + delta + ' ' + T.vsLastWeek} tone={delta > 0 ? 'ok' : delta < 0 ? 'hi' : 'mut'} />
        <StatTile label={T.openNow} value={sum.openN} delta={'+' + sum.createdWeek + ' ' + T.createdSeries} tone="mut" />
        <StatTile label={T.forgottenNow} value={sum.staleN} delta={'≥ 7 ' + T.daysUnit} tone={sum.staleN > 0 ? 'hi' : 'mut'} />
        <StatTile label={T.streakLbl} value={sum.streak} unit={T.streakUnit} />
        <StatTile label={T.medianClose} value={sum.medianClose ?? '—'} unit={sum.medianClose !== null ? T.daysUnit : undefined} />
      </div>
      {empty ? (
        <div className="mt-16 font-sans text-14 italic text-mut2">{T.noStats}</div>
      ) : (
        <div className="mt-12 grid max-w-1080 gap-12" style={{ gridTemplateColumns: '1.35fr 1fr' }}>
          <ChartCard
            title={T.closedPerWeek}
            showTable={table}
            table={<DataTable head={[T.weekShort, T.closedSeries, T.createdSeries]} rows={weeks.map(w => [weekLabel(w.start, w.isCurrent), w.closed, w.created])} />}
          >
            <GroupedBars groups={groups} legend={legend} />
          </ChartCard>
          <ChartCard
            title={T.priorityMixTitle}
            showTable={table}
            table={<DataTable head={[T.priority, T.openCol]} rows={([0, 1, 2] as Priority[]).map(p => [priorityLabel(p, lang), mix.counts[p]])} />}
          >
            <StackedBar
              total={mix.total}
              parts={([0, 1, 2] as Priority[]).map(p => ({ key: String(p), value: mix.counts[p], color: BAR_COLOR[p], name: priorityLabel(p, lang), ...(p === 1 ? { inkClass: 'text-goldInk dark:text-onInk' } : { ink: p === 2 ? 'var(--ink)' : 'var(--onAcc)' }) }))}
            />
            <div className="mt-14 text-11.5 font-semibold uppercase leading-normal tracking-[1px] text-mut">{T.idleAgeTitle}</div>
            <HBars rows={idle.map(b => ({ key: b.key, label: idleLabel[b.key], value: b.count, color: b.key === 'stale' || b.key === 'cold' ? 'var(--goldInk)' : 'var(--ink)' }))} />
          </ChartCard>
          <ChartCard
            title={T.openByProjectTitle}
            showTable={table}
            className="col-span-2"
            table={<DataTable head={[T.projects, T.openCol, T.doneCol]} rows={load.map(r => [r.name ?? T.noProject, r.open, r.done])} />}
          >
            <HBars rows={load.map(r => ({
              key: r.id ?? 'none',
              label: <span className="flex items-center gap-7"><Dot color={r.color ?? 'var(--mut2)'} />{r.name ?? T.noProject}</span>,
              value: r.open,
              color: r.color ?? 'var(--mut2)',
              hint: `${T.openCol}: ${r.open} · ${T.doneCol}: ${r.done}`,
            }))} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
