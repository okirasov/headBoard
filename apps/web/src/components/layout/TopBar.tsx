import { todayLabel } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { IcSearch, IcSpark } from '../ui/Icons';
import { Button } from '../ui/primitives';

export function TopBar() {
  const { T, lang } = useT();
  const q = useStore(s => s.q);
  const set = useStore(s => s.set);
  const now = useNow();
  return (
    <header className="flex h-62 shrink-0 items-center gap-12 border-b border-line px-24">
      <div className="font-mono text-11 uppercase tracking-kicker text-mut2">{todayLabel(now, lang)}</div>
      <div className="flex-1" />
      <div className="relative">
        <IcSearch size={14} className="absolute left-10 top-9 text-mut2" />
        <input
          value={q}
          onChange={e => set({ q: e.target.value })}
          onKeyDown={e => { if (e.key === 'Enter' && q.trim()) set({ view: 'search' }); }}
          placeholder={T.searchPh}
          className="w-250 rounded-10 border border-line bg-card py-8 pl-32 pr-12 font-sans text-13 leading-normal text-ink placeholder:text-faint"
        />
      </div>
      <Button onClick={() => set({ capOpen: true, capItems: null })} className="rounded-10 px-16 py-9 text-13">
        <IcSpark size={13} />
        {T.capture}
      </Button>
    </header>
  );
}
