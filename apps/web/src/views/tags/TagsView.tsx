import { useState } from 'react';
import { type TagStat, fmtDate, phrases, tagStats, unusedTags } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { syncTagOp } from '../../store/sync';
import { useT } from '../../lib/useT';
import { cx } from '../../lib/cx';
import { Button, Empty, Kicker } from '../../components/ui/primitives';

function Row({ s, muted }: { s: TagStat; muted?: boolean }) {
  const { T, lang } = useT();
  const set = useStore(s2 => s2.set);
  const renameTag = useStore(s2 => s2.renameTag);
  const deleteTag = useStore(s2 => s2.deleteTag);
  const existing = useStore(s2 => tagStats(s2.tasks).map(x => x.tag));
  const [name, setName] = useState(s.tag);
  const [confirm, setConfirm] = useState(false);
  const target = name.trim().toLowerCase().replace(/^#/, '');
  const willMerge = target !== s.tag && existing.includes(target);
  const commit = () => { if (target && target !== s.tag) { renameTag(s.tag, name); void syncTagOp({ rename: [s.tag, name] }); } else setName(s.tag); };
  return (
    <div className={cx('flex items-center gap-12 rounded-12 border border-line bg-card py-9 pl-14 pr-12 hover:border-lineStrong', muted && 'opacity-80')}>
      <span className="font-mono text-12 text-mut2">#</span>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setName(s.tag); (e.target as HTMLInputElement).blur(); } }}
        className="min-w-0 flex-1 rounded-8 border border-transparent bg-transparent px-6 py-4 font-mono text-13 font-semibold leading-normal text-ink hover:border-line focus:border-lineStrong focus:bg-inset"
        aria-label={T.renameTag}
      />
      {willMerge && <span className="font-mono text-9.5 uppercase tracking-kicker text-goldInk">{T.mergeInto}#{target}</span>}
      <button type="button" onClick={() => set({ view: 'board', fTag: s.tag })} className="w-90 cursor-pointer text-right font-mono text-10.5 text-mut2 hover:text-acc">{phrases.tasksN(s.open, lang)}</button>
      <span className="w-150 whitespace-nowrap text-right font-mono text-9.5 text-faint">{s.done + s.archived > 0 ? `${s.done} ${T.doneCol} · ${s.archived} ${T.archivedBadge}` : ''}</span>
      <span className="w-130 text-right font-mono text-9.5 text-mut2">{s.lastUsed ? T.lastUsed + fmtDate(s.lastUsed, lang) : ''}</span>
      <Button variant="outline" tone="mut2" hoverTone="hi" className={cx('rounded-9 px-10 py-6 text-11.5', confirm && '!border-hi !text-hi')} onClick={() => { if (confirm) { deleteTag(s.tag); void syncTagOp({ remove: s.tag }); } else setConfirm(true); }} onBlur={() => setConfirm(false)}>
        {confirm ? T.confirmDeleteTag : T.deleteTag}
      </Button>
    </div>
  );
}

export function TagsView() {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const deleteTag = useStore(s => s.deleteTag);
  const stats = tagStats(tasks);
  const unused = unusedTags(stats);
  const used = stats.filter(s => s.open > 0);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <div className="flex items-baseline gap-14">
        <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.tagsTitle}</h1>
        <div className="text-12 leading-normal text-mut2">{T.tagsSub}</div>
        <span className="flex-1" />
        <span className="font-mono text-10.5 text-mut2">{phrases.tagsN(stats.length, lang)}</span>
      </div>
      <div className="mb-16 mt-4 max-w-1080 text-12.5 leading-normal text-mut2">{T.tagsHint}</div>
      <div className="flex max-w-1080 flex-col gap-8">
        {used.map(s => <Row key={s.tag} s={s} />)}
        {stats.length === 0 && <Empty className="py-10 text-14">{T.noTags}</Empty>}
        {unused.length > 0 && (
          <>
            <div className="mt-12 flex items-center gap-10">
              <Kicker size={10}>{T.unusedTags}</Kicker>
              <span className="font-mono text-10.5 text-mut2">{unused.length}</span>
              <span className="flex-1" />
              <Button variant="outline" tone="mut2" hoverTone="hi" className="rounded-9 px-10 py-5 text-11.5" onClick={() => unused.forEach(u => { deleteTag(u.tag); void syncTagOp({ remove: u.tag }); })}>{T.clearUnused}</Button>
            </div>
            {unused.map(s => <Row key={s.tag} s={s} muted />)}
          </>
        )}
      </div>
    </div>
  );
}
