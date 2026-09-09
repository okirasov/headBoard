import type { ReactNode } from 'react';
import type { Task } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { Dot, Empty } from '../../components/ui/primitives';
import { cx } from '../../lib/cx';

export interface RowItem { task: Task; chip: string; chipClass: string }

/** Card with a kicker title and clickable task rows (dot · title · mono chip). */
export function RowList({ title, rows, gold, empty, leading, className }: { title: string; rows: RowItem[]; gold?: boolean; empty?: string; leading?: (t: Task) => ReactNode; className?: string }) {
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  return (
    <div className={cx('rounded-16 border bg-card px-18 py-16', gold ? 'border-goldBd' : 'border-line', className)}>
      <div className={cx('mb-10 text-11.5 font-semibold uppercase leading-normal tracking-[1px]', gold ? 'text-goldInk' : 'text-mut')}>{title}</div>
      <div className="flex flex-col">
        {rows.map(r => (
          <div key={r.task.id} onClick={() => set({ sel: r.task.id })} className={cx('flex cursor-pointer items-center border-b px-2', gold ? 'border-rowLineGold' : 'border-rowLine', leading ? 'gap-10 py-9' : 'gap-9 py-8')}>
            {leading?.(r.task)}
            <Dot color={projects.find(p => p.id === r.task.proj)?.color ?? 'var(--mut2)'} />
            <span className="flex-1 text-13.5 font-medium leading-normal">{r.task.title}</span>
            <span className={cx('font-mono', r.chipClass)}>{r.chip}</span>
          </div>
        ))}
        {rows.length === 0 && empty && <Empty className="px-2 py-4 text-13">{empty}</Empty>}
      </div>
    </div>
  );
}
