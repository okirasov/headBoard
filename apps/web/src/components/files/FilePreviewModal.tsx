import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { IconButton, Scrim } from '../ui/primitives';
import { IcX } from '../ui/Icons';

export function FilePreviewModal() {
  const { T } = useT();
  const pv = useStore(s => s.pv);
  const set = useStore(s => s.set);
  if (!pv) return null;
  const close = () => set({ pv: null });
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-40">
      <Scrim tone="strong" onClick={close} />
      <div className="relative flex max-w-760 flex-col gap-11 rounded-16 bg-panel p-14 shadow-modal-strong animate-fadeUp">
        <div className="flex items-center gap-10">
          <span className="ellipsis max-w-380 text-13.5 font-semibold leading-normal">{pv.name}</span>
          <span className="font-mono text-10.5 text-mut2">{pv.sizeL}</span>
          <span className="flex-1" />
          {pv.src && (
            <a href={pv.src} download={pv.name} className="rounded-8 border border-line bg-card px-11 py-6 text-12 font-semibold leading-normal text-mut no-underline hover:border-acc hover:text-acc">{T.dl}</a>
          )}
          <IconButton onClick={close} aria-label="close"><IcX size={11} /></IconButton>
        </div>
        {pv.src ? (
          <div className="flex justify-center"><img src={pv.src} alt={pv.name} className="block max-h-470 max-w-730 rounded-10 bg-inset object-contain" /></div>
        ) : (
          <div className="flex h-280 w-460 flex-col items-center justify-center gap-10 rounded-12 border border-dashed border-lineStrong bg-inset p-24">
            <span className="rounded-7 bg-sel px-10 py-5 font-mono text-11 font-semibold tracking-[1.4px] text-goldInk">{pv.extL}</span>
            <span className="font-sans text-17 italic leading-normal">{T.pvNA}</span>
            <span className="text-pretty max-w-290 text-center text-12 leading-[1.55] text-mut2">{T.pvNAsub}</span>
          </div>
        )}
      </div>
    </div>
  );
}
