import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { Kicker, Scrim } from './primitives';
import { IcX } from './Icons';

function Key({ k }: { k: string }) {
  return <kbd className="inline-flex h-20 min-w-20 items-center justify-center rounded-6 border border-lineStrong bg-card px-5 font-mono text-10.5 text-ink">{k}</kbd>;
}

/** Overlay listing keyboard shortcuts; toggled with ? */
export function ShortcutsHelp() {
  const { T } = useT();
  const open = useStore(s => s.helpOpen);
  const set = useStore(s => s.set);
  if (!open) return null;
  const rows: Array<[string[], string]> = [
    [['c', 'n'], T.kCapture],
    [['/'], T.kSearch],
    [['1', '…', '9'], T.kViews],
    [['d'], T.kDone],
    [['a'], T.kArchive],
    [['s'], T.kSnooze],
    [['b'], T.kBump],
    [['⌘', 'click'], T.kSelect],
    [['Esc'], T.kEsc],
    [['?'], T.kHelp],
  ];
  return (
    <>
      <Scrim onClick={() => set({ helpOpen: false })} />
      <div className="absolute left-1/2 top-1/2 z-[70] w-380 -translate-x-1/2 -translate-y-1/2 rounded-14 border border-line bg-panel p-20 shadow-drawer animate-fadeUp">
        <div className="mb-12 flex items-center">
          <div className="font-sans text-18 font-medium leading-[1.2] tracking-tightSm">{T.shortcutsTitle}</div>
          <span className="flex-1" />
          <button type="button" onClick={() => set({ helpOpen: false })} className="flex h-26 w-26 cursor-pointer items-center justify-center rounded-8 text-mut2 hover:bg-inset hover:text-ink" aria-label="close"><IcX size={11} /></button>
        </div>
        <Kicker className="mb-8">{T.shortcutsSub}</Kicker>
        <div className="flex flex-col gap-7">
          {rows.map(([keys, label]) => (
            <div key={label} className="flex items-center gap-10 text-12.5 leading-normal">
              <span className="flex w-110 shrink-0 items-center gap-4">{keys.map(k => <Key key={k} k={k} />)}</span>
              <span className="text-mut">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
