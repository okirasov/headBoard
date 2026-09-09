import { useState } from 'react';
import { type Task, archived, fmtDate, matchesFilter, phrases } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { cx } from '../../lib/cx';
import { Button, Dot, Empty } from '../../components/ui/primitives';
import { IcRestore } from '../../components/ui/Icons';

function ArchiveRow({ task, now }: { task: Task; now: number }) {
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const restore = useStore(s => s.restore);
  const deleteTask = useStore(s => s.deleteTask);
  const [confirm, setConfirm] = useState(false);
  const p = projects.find(x => x.id === task.proj);
  const when = task.archivedAt ?? task.touched;
  const sub = (p ? p.name : T.noProject) + (task.tags.length ? ' · ' + task.tags.map(x => '#' + x).join(' ') : '') + ' · ' + T.archivedOn + fmtDate(when, lang);
  return (
    <div className="flex items-center gap-16 rounded-14 border border-line bg-card px-16 py-14 hover:border-lineStrong">
      <div className="w-64 shrink-0 text-center">
        <div className="font-mono text-12.5 font-semibold leading-none text-mut">{fmtDate(when, lang)}</div>
        <div className="mt-3 font-mono text-9 uppercase tracking-[1px] text-mut2">{Math.max(0, Math.floor((now - when) / 864e5))} {T.daysShort}</div>
      </div>
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => set({ sel: task.id })}>
        <div className="text-14.5 font-semibold leading-normal tracking-tightXs text-mut">{task.title}</div>
        <div className="mt-3 flex items-center gap-6 text-11.5 leading-normal text-mut2">{p && <Dot color={p.color} />}{sub}</div>
      </div>
      <div className="flex shrink-0 gap-7">
        <Button variant="outline" hoverTone="acc" className="rounded-9 px-12 py-7 text-12" onClick={() => restore(task.id)}><IcRestore size={11} />{T.restore}</Button>
        <Button variant="outline" tone="mut2" hoverTone="hi" className={cx('rounded-9 px-12 py-7 text-12', confirm && '!border-hi !text-hi')} onClick={() => (confirm ? deleteTask(task.id) : setConfirm(true))} onBlur={() => setConfirm(false)}>
          {confirm ? T.confirmDelete : T.deleteForever}
        </Button>
      </div>
    </div>
  );
}

export function ArchiveView() {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const q = useStore(s => s.q);
  const fPr = useStore(s => s.fPr);
  const fProj = useStore(s => s.fProj);
  const now = useNow();
  const rows = archived(tasks).filter(t => matchesFilter(t, q, fPr, fProj));
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.archiveTitle}</h1>
      <div className="mb-18 mt-4 text-12.5 leading-normal text-mut2">{phrases.archivedN(rows.length, lang)}</div>
      <div className="flex max-w-820 flex-col gap-10">
        {rows.map(t => <ArchiveRow key={t.id} task={t} now={now} />)}
        {rows.length === 0 && <Empty className="py-20 text-16">{T.archiveEmpty}</Empty>}
      </div>
    </div>
  );
}
