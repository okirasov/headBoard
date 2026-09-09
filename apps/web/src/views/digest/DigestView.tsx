import { cannedDigest, digestStats, digestStatsLine, dueDiff, fmtDateTimeShort, idleDays, live, todayLabel } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/primitives';
import { IcSpark } from '../../components/ui/Icons';
import { RowList } from './RowList';

export function DigestView() {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const digestText = useStore(s => s.digestText);
  const digestAt = useStore(s => s.digestAt);
  const digestBusy = useStore(s => s.digestBusy);
  const digestSeed = useStore(s => s.digestSeed);
  const set = useStore(s => s.set);
  const now = useNow();
  const stats = digestStats(tasks, now);

  const regen = async () => {
    if (digestBusy) return;
    set({ digestBusy: true });
    let text: string | null = null;
    if (api) { try { text = (await api.ai.digest(stats, lang)).text.trim() || null; } catch { text = null; } }
    if (!text) text = cannedDigest(digestSeed + 1, stats, lang);
    set({ digestText: text, digestAt: Date.now(), digestSeed: digestSeed + 1, digestBusy: false });
  };

  const dueRows = stats.due.map(t => ({ task: t, chip: (dueDiff(t, now) as number) < 0 ? T.overdue : T.today, chipClass: 'text-10.5 ' + ((dueDiff(t, now) as number) < 0 ? 'text-hi' : 'text-acc') }));
  const pickRows = stats.stale.slice(0, 3).map(t => ({ task: t, chip: idleDays(t, now) + T.idleSuf, chipClass: 'text-10.5 text-goldInk' }));
  const recurRows = live(tasks).filter(t => t.recur).map(t => ({ task: t, chip: T.everyWeek, chipClass: 'text-10.5 text-mut2' }));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <div className="flex items-baseline gap-14">
        <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.digTitle}</h1>
        <div className="font-mono text-11 text-mut2">{todayLabel(now, lang)}</div>
      </div>
      <div className="mt-16 grid max-w-1080 gap-16" style={{ gridTemplateColumns: '1.25fr 1fr' }}>
        <div className="flex flex-col gap-14 rounded-16 border border-line bg-card p-22">
          <div className="font-mono text-10.5 uppercase tracking-[1px] text-mut2">{digestStatsLine(stats, lang)}</div>
          <div className="text-pretty font-sans text-19 leading-[1.55]">{digestText ?? cannedDigest(0, stats, lang)}</div>
          <div className="mt-auto flex items-center gap-10">
            <Button variant="outline" className="rounded-9 px-13 py-7 text-12.5 !text-acc hover:border-acc" onClick={() => void regen()}><IcSpark size={11} />{digestBusy ? T.thinking : T.regen}</Button>
            <div className="font-mono text-10 text-mut2">{T.digNote}{digestAt ? ' · ' + T.digestUpdated + fmtDateTimeShort(digestAt, lang, now) : ''}</div>
          </div>
        </div>
        <div className="flex flex-col gap-12">
          <RowList title={T.dueToday} rows={dueRows} empty={T.nothingDue} />
          <RowList title={T.dustyPicks} rows={pickRows} gold />
          <RowList title={T.recurring} rows={recurRows} />
        </div>
      </div>
    </div>
  );
}
