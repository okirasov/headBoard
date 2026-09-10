import { type ColumnKey, type Priority, phrases, priorityLabel, statusLabel, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { cx } from '../../lib/cx';
import { IcArchive, IcCheck, IcX } from '../../components/ui/Icons';

const PR_BG = { hi: 'bg-hi', med: 'bg-med', lineStrong: 'bg-lineStrong' } as const;
const MOVE_TO: ColumnKey[] = ['inbox', 'focus', 'waiting'];

/** Floating action bar for multi-selected cards (⌘/Ctrl-click or the checkbox on a card). */
export function BulkBar() {
  const { T, lang } = useT();
  const selected = useStore(s => s.selected);
  const clearSelection = useStore(s => s.clearSelection);
  const bulkMove = useStore(s => s.bulkMove);
  const bulkDone = useStore(s => s.bulkDone);
  const bulkArchive = useStore(s => s.bulkArchive);
  const bulkPriority = useStore(s => s.bulkPriority);
  if (selected.length === 0) return null;
  const btn = 'flex cursor-pointer items-center gap-6 whitespace-nowrap rounded-8 border border-onInk/25 px-10 py-6 text-12 font-semibold leading-normal text-onInk hover:border-onInk';
  return (
    <div className="absolute bottom-22 left-1/2 z-50 flex -translate-x-1/2 items-center gap-10 rounded-10 bg-ink py-8 pl-16 pr-10 text-onInk shadow-snack animate-fadeUp">
      <span className="font-mono text-11 uppercase tracking-kicker">{phrases.selectedN(selected.length, lang)}</span>
      <span className="h-16 w-px bg-onInk/25" />
      <button type="button" className={btn} onClick={bulkDone}><IcCheck size={11} />{T.markDone}</button>
      <span className="flex items-center gap-4">
        <span className="font-mono text-10 uppercase tracking-kicker text-onInk/70">{T.bulkMove}</span>
        {MOVE_TO.map(c => <button key={c} type="button" className={cx(btn, 'px-8')} onClick={() => bulkMove(c)}>{statusLabel(c, lang)}</button>)}
      </span>
      <span className="flex items-center gap-4">
        <span className="font-mono text-10 uppercase tracking-kicker text-onInk/70">{T.priority}</span>
        {([0, 1, 2] as Priority[]).map(pr => (
          <button key={pr} type="button" title={priorityLabel(pr, lang)} aria-label={priorityLabel(pr, lang)} onClick={() => bulkPriority(pr)} className="flex h-22 w-22 cursor-pointer items-center justify-center rounded-full border border-onInk/25 hover:border-onInk">
            <span className={cx('h-10 w-10 rounded-full', PR_BG[PRIORITY_BAR_TOKEN[pr]])} />
          </button>
        ))}
      </span>
      <button type="button" className={btn} onClick={bulkArchive}><IcArchive size={11} />{T.archive}</button>
      <button type="button" className="flex h-26 w-26 cursor-pointer items-center justify-center rounded-8 text-onInk/70 hover:text-onInk" onClick={clearSelection} aria-label={T.clearSelection} title={T.clearSelection + ' (Esc)'}><IcX size={11} /></button>
    </div>
  );
}
