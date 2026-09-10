import type { Task } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { cx } from '../../lib/cx';
import { IcX } from '../ui/Icons';

function toInput(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fromInput(v: string): number | null {
  if (!v) return null;
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d, 12).getTime(); // noon local: robust across DST
}

/** Native date input styled like the drawer select, with a clear button. */
export function DueDateInput({ task, size = 'md' }: { task: Task; size?: 'sm' | 'md' }) {
  const { T } = useT();
  const setDue = useStore(s => s.setDue);
  return (
    <div className="flex items-center gap-6">
      <input
        type="date"
        value={task.due === null ? '' : toInput(task.due)}
        onChange={e => setDue(task.id, fromInput(e.target.value))}
        aria-label={T.dueDateLbl}
        className={cx('rounded-9 border border-line bg-card font-mono text-ink [color-scheme:inherit]', size === 'md' ? 'px-10 py-7 text-11.5' : 'px-8 py-5 text-10.5')}
      />
      {task.due !== null && (
        <button type="button" onClick={() => setDue(task.id, null)} title={T.clearDue} className="flex h-22 w-22 cursor-pointer items-center justify-center rounded-6 text-mut2 hover:bg-sel hover:text-hi"><IcX size={9} /></button>
      )}
    </div>
  );
}

/** Off / On the day / Day before, chips r7 in the priority-chip style. */
export function RemindPicker({ task, size = 'md' }: { task: Task; size?: 'sm' | 'md' }) {
  const { T } = useT();
  const setRemind = useStore(s => s.setRemind);
  const opts: Array<{ v: 0 | 1 | null; L: string }> = [{ v: null, L: T.remindNone }, { v: 0, L: T.remindDay }, { v: 1, L: T.remindDayBefore }];
  const disabled = task.due === null;
  return (
    <div className={cx('flex gap-4', disabled && 'opacity-45')} role="radiogroup" aria-label={T.remindLbl}>
      {opts.map(o => (
        <button
          key={String(o.v)}
          type="button"
          role="radio"
          aria-checked={task.remindDays === o.v}
          disabled={disabled}
          onClick={() => setRemind(task.id, o.v)}
          className={cx('cursor-pointer rounded-7 border font-mono font-medium leading-normal disabled:cursor-default', size === 'md' ? 'px-8 py-4 text-10.5' : 'px-7 py-3 text-10', task.remindDays === o.v ? 'border-lineStrong bg-chipBg text-chipInk' : 'border-line bg-card text-mut')}
        >
          {o.L}
        </button>
      ))}
    </div>
  );
}
