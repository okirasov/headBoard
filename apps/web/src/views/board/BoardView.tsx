import { type ColumnKey, type Priority, live, matchesFilter, sortAutoBump, sortDone, statusLabel, priorityLabel } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { Chip } from '../../components/ui/primitives';
import { IcHash, IcX } from '../../components/ui/Icons';
import { Column } from './Column';
import { ProjectFilesBar } from './ProjectFilesBar';
import { SeedHint } from './SeedHint';

export function BoardView() {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const staleDays = useStore(s => s.staleDays);
  const q = useStore(s => s.q);
  const fPr = useStore(s => s.fPr);
  const fProj = useStore(s => s.fProj);
  const fTag = useStore(s => s.fTag);
  const showDone = useStore(s => s.showDone);
  const set = useStore(s => s.set);
  const now = useNow();

  const lv = live(tasks).filter(t => matchesFilter(t, q, fPr, fProj, fTag));
  const cols: ColumnKey[] = showDone ? ['inbox', 'focus', 'waiting', 'done'] : ['inbox', 'focus', 'waiting'];
  const cardsFor = (c: ColumnKey) => {
    const group = lv.filter(t => t.status === c);
    return c === 'done' ? sortDone(group) : sortAutoBump(group, now, staleDays);
  };
  const prChips: Array<{ v: Priority | null; L: string }> = [{ v: null, L: T.all }, ...([0, 1, 2] as Priority[]).map(i => ({ v: i, L: priorityLabel(i, lang) }))];

  return (
    <div className="flex min-h-0 flex-1 flex-col px-24 pt-18">
      <div className="mb-14 flex items-baseline gap-14">
        <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.board}</h1>
        <div className="text-12 leading-normal text-mut2">{T.bumpSort}</div>
        <div className="flex-1" />
        <div className="flex gap-5">
          {prChips.map(ch => (
            <Chip key={String(ch.v)} active={fPr === ch.v} onClick={() => set({ fPr: ch.v })}>{ch.L}</Chip>
          ))}
          <span className="mx-3 w-px self-stretch bg-line" />
          <Chip active={showDone} onClick={() => set({ showDone: !showDone })}>{T.showDone}</Chip>
          <span className="mx-3 w-px self-stretch bg-line" />
          {fTag ? (
            <button type="button" onClick={() => set({ fTag: null })} className="flex cursor-pointer items-center gap-5 rounded-7 border border-lineStrong bg-chipBg px-9 py-4 font-mono text-10.5 font-medium leading-normal text-chipInk">#{fTag}<IcX size={9} /></button>
          ) : (
            <button type="button" title={T.tagsTitle} onClick={() => set({ view: 'tags' })} className="flex cursor-pointer items-center gap-4 rounded-7 border border-line bg-card px-8 py-4 font-mono text-10.5 font-medium leading-normal text-mut hover:border-lineStrong hover:text-ink"><IcHash size={11} />{T.tagsTitle}</button>
          )}
        </div>
      </div>
      {fProj && <ProjectFilesBar />}
      {tasks.length === 0 && <SeedHint />}
      <div className="flex min-h-0 flex-1 gap-14">
        {cols.map(c => <Column key={c} col={c} label={statusLabel(c, lang, true)} cards={cardsFor(c)} now={now} />)}
      </div>
    </div>
  );
}
