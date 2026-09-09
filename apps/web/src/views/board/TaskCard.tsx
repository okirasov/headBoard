import type { DragEvent } from 'react';
import { type Task, dueLabel, dueTone, idleDays, isSnoozed, isStale, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { Dot } from '../../components/ui/primitives';
import { IcArrowUp, IcCheck, IcComment, IcLink, IcPaperclip, IcRepeat } from '../../components/ui/Icons';
import { cx } from '../../lib/cx';

const TONE = { hi: 'text-hi', acc: 'text-acc', mut2: 'text-mut2' } as const;
const BAR = { hi: 'bg-hi', med: 'bg-med', lineStrong: 'bg-lineStrong' } as const;

export function IdleBadge({ task, now, radius = 7 }: { task: Task; now: number; radius?: 6 | 7 }) {
  const { T } = useT();
  const idle = idleDays(task, now);
  const snz = isSnoozed(task, now);
  if (task.status === 'done' || (idle < 2 && !snz)) return null;
  const stale = isStale(task, now);
  return (
    <span className={cx('font-mono text-10 leading-normal', radius === 7 ? 'rounded-7 px-6 py-2' : 'rounded-6 px-7 py-2 text-10.5', stale ? 'bg-heat2b text-goldInk' : 'bg-inset text-mut2')}>
      {snz ? T.snoozed : idle + T.idleSuf}
    </span>
  );
}

export function TaskCard({ task, now }: { task: Task; now: number }) {
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const dragId = useStore(s => s.dragId);
  const set = useStore(s => s.set);
  const markDone = useStore(s => s.markDone);
  const bump = useStore(s => s.bump);
  const p = projects.find(x => x.id === task.proj) ?? null;
  const stale = isStale(task, now);
  const open = task.status !== 'done';
  const due = dueLabel(task, lang, now);

  const onDragStart = (e: DragEvent) => {
    try { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move'; } catch { /* noop */ }
    set({ dragId: task.id });
  };

  return (
    <div
      onClick={() => set({ sel: task.id })}
      draggable
      onDragStart={onDragStart}
      onDragEnd={() => set({ dragId: null, dragCol: null })}
      className={cx(
        'relative flex cursor-grab flex-col gap-8 overflow-hidden rounded-12 border bg-card py-12 pl-16 pr-12 transition-[box-shadow,border-color] duration-150 hover:border-lineStrong hover:shadow-card-hover',
        stale ? 'border-goldBd' : 'border-line',
        dragId === task.id && 'opacity-35',
      )}
    >
      <span className={cx('absolute bottom-0 left-0 top-0 w-4', BAR[PRIORITY_BAR_TOKEN[task.pr]])} />
      {open && (
        <div className="flex items-center gap-6">
          <IdleBadge task={task} now={now} />
          <span className="flex-1" />
          <button
            type="button"
            onClick={e => { e.stopPropagation(); markDone(task.id); }}
            className="flex h-22 w-22 cursor-pointer items-center justify-center rounded-6 border border-line bg-card text-mut2 opacity-55 hover:border-ok hover:text-ok hover:opacity-100"
            aria-label={T.markDone}
          >
            <IcCheck size={11} />
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); bump(task.id); }}
            className="flex h-22 w-22 cursor-pointer items-center justify-center rounded-6 border border-line bg-card text-mut2 opacity-55 hover:border-acc hover:text-acc hover:opacity-100"
            aria-label={T.bump}
          >
            <IcArrowUp size={11} />
          </button>
        </div>
      )}
      <div className="text-pretty text-14 font-medium leading-[1.4]">{task.title}</div>
      <div className="flex flex-wrap items-center gap-10">
        {p && (
          <span className="flex items-center gap-5 text-11.5 leading-normal text-mut"><Dot color={p.color} />{p.name}</span>
        )}
        {task.tags.length > 0 && <span className="font-mono text-10.5 text-mut2">{task.tags.map(x => '#' + x).join(' ')}</span>}
        <span className="flex-1" />
        {task.comments.length > 0 && (
          <span className="flex items-center gap-3 font-mono text-10.5 text-mut2"><IcComment size={10} />{task.comments.length}</span>
        )}
        {task.files.length > 0 && (
          <span className="flex items-center gap-3 font-mono text-10.5 text-mut2"><IcPaperclip size={10} />{task.files.length}</span>
        )}
        {due && open && <span className={cx('font-mono text-10.5', TONE[dueTone(task, now)])}>{due}</span>}
        {task.recur && <span className="flex items-center gap-3 font-mono text-10.5 text-mut2"><IcRepeat size={10} />{T.weekly}</span>}
        {task.chat && (
          <a href={task.chat} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-3 font-mono text-10.5 text-mut2 no-underline hover:text-acc">
            <IcLink size={10} />{T.chat}
          </a>
        )}
      </div>
    </div>
  );
}
