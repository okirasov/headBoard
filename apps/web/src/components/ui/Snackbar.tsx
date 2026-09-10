import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';

export function Snackbar() {
  const { T } = useT();
  const snack = useStore(s => s.snack);
  const snackUndo = useStore(s => s.snackUndo);
  const undo = useStore(s => s.undo);
  if (!snack) return null;
  return (
    <div className="absolute bottom-22 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-14 rounded-7 bg-ink py-9 pl-18 pr-12 text-12.5 font-medium leading-normal text-onInk shadow-snack animate-fadeUp">
      <span>{snack}</span>
      {snackUndo && (
        <button type="button" onClick={undo} className="cursor-pointer rounded-6 border border-onInk/30 px-8 py-3 font-mono text-10.5 uppercase tracking-kicker text-onInk hover:border-onInk">{T.undo}</button>
      )}
    </div>
  );
}
