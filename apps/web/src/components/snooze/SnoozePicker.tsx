import { buildSnoozeGrid, monthLabel, snoozePresets, snoozePresetLabel, weekdayLabels } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { Chip, IconButton, Scrim } from '../ui/primitives';
import { IcChevronLeft, IcChevronRight, IcX } from '../ui/Icons';
import { cx } from '../../lib/cx';

export function SnoozePicker() {
  const { T, lang } = useT();
  const zTask = useStore(s => s.zTask);
  const zMonth = useStore(s => s.zMonth);
  const set = useStore(s => s.set);
  const snooze = useStore(s => s.snooze);
  const closeSnooze = useStore(s => s.closeSnooze);
  const now = useNow();
  if (!zTask) return null;
  const weeks = buildSnoozeGrid({ now, monthOffset: zMonth });
  const pick = (ts: number) => snooze(zTask, ts);

  return (
    <div className="absolute inset-0 z-[55] flex items-center justify-center">
      <Scrim onClick={closeSnooze} />
      <div className="relative flex w-322 flex-col gap-12 rounded-16 bg-panel p-18 shadow-snooze animate-fadeUp">
        <div className="flex items-center gap-8">
          <div className="flex-1 font-sans text-18 font-medium leading-normal tracking-tightSm">{T.zTitle}</div>
          <IconButton size={24} radius={7} onClick={closeSnooze} aria-label="close"><IcX size={10} /></IconButton>
        </div>
        <div className="flex flex-wrap gap-5">
          {snoozePresets(now).map(p => <Chip key={p.key} onClick={() => pick(p.ts)}>{snoozePresetLabel(p.key, lang)}</Chip>)}
        </div>
        <div className="flex items-center">
          <button type="button" onClick={() => set({ zMonth: Math.max(0, zMonth - 1) })} className="flex h-26 w-26 cursor-pointer items-center justify-center rounded-7 text-mut hover:bg-sel" aria-label="prev"><IcChevronLeft size={11} /></button>
          <span className="flex-1 text-center text-13 font-semibold leading-normal">{monthLabel(now, zMonth, lang)}</span>
          <button type="button" onClick={() => set({ zMonth: Math.min(11, zMonth + 1) })} className="flex h-26 w-26 cursor-pointer items-center justify-center rounded-7 text-mut hover:bg-sel" aria-label="next"><IcChevronRight size={11} /></button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center font-mono text-9 uppercase tracking-[.8px] text-mut2">
          {weekdayLabels(lang).map(w => <span key={w}>{w}</span>)}
        </div>
        <div className="flex flex-col gap-2">
          {weeks.map(w => (
            <div key={w.key} className="grid grid-cols-7 gap-2">
              {w.days.map(d => (
                <div
                  key={d.ts}
                  onClick={d.disabled ? undefined : () => pick(d.ts)}
                  className={cx(
                    'flex h-36 items-center justify-center rounded-8 text-12.5 font-medium leading-normal',
                    d.disabled ? 'cursor-default text-ghost' : 'cursor-pointer hover:bg-heat2b',
                    !d.disabled && (d.inMonth ? 'text-ink' : 'text-faint'),
                    d.isToday && 'bg-sel',
                  )}
                >
                  {d.n}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
