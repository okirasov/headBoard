import type { DragEvent } from 'react';
import type { ColumnKey, Task } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { Dot, Empty } from '../../components/ui/primitives';
import { TaskCard } from './TaskCard';
import { cx } from '../../lib/cx';

export const COLUMN_DOT: Record<ColumnKey, string> = { inbox: 'var(--mut2)', focus: 'var(--acc)', waiting: 'var(--wait)', done: 'var(--ok)' };

export function Column({ col, label, cards, now }: { col: ColumnKey; label: string; cards: Task[]; now: number }) {
  const { T } = useT();
  const dragId = useStore(s => s.dragId);
  const dragCol = useStore(s => s.dragCol);
  const set = useStore(s => s.set);
  const moveTask = useStore(s => s.moveTask);
  const over = !!dragId && dragCol === col;

  const onDragOver = (e: DragEvent) => { e.preventDefault(); if (dragCol !== col) set({ dragCol: col }); };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer?.getData('text/plain') || dragId;
    set({ dragId: null, dragCol: null });
    if (id) moveTask(id, col);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-8 px-2 pb-10">
        <Dot color={COLUMN_DOT[col]} size={8} />
        <span className="text-11.5 font-semibold uppercase leading-normal tracking-[1px] text-mut">{label}</span>
        <span className="font-mono text-10.5 text-mut2">{cards.length}</span>
      </div>
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cx('flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto rounded-12 border-1.5 border-dashed px-4 pb-18 pt-6 transition-colors duration-150', over ? 'border-lineStrong bg-sel' : 'border-transparent bg-transparent')}
      >
        {cards.map(t => <TaskCard key={t.id} task={t} now={now} />)}
        {cards.length === 0 && <Empty className="px-4 py-10 text-13.5">{T.nothingHere}</Empty>}
      </div>
    </div>
  );
}
