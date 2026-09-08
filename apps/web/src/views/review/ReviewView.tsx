import { type Task, digestStats, fmtDate, idleDays, phrases } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { Button, Empty } from '../../components/ui/primitives';

function ReviewRow({ task, now }: { task: Task; now: number }) {
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const keep = useStore(s => s.keep);
  const archive = useStore(s => s.archive);
  const openSnooze = useStore(s => s.openSnooze);
  const p = projects.find(x => x.id === task.proj);
  const sub = (p ? p.name : T.noProject) + (task.tags.length ? ' · ' + task.tags.map(x => '#' + x).join(' ') : '') + ' · ' + T.lastT + fmtDate(task.touched, lang);
  return (
    <div className="flex items-center gap-16 rounded-14 border border-goldBd bg-card px-16 py-14">
      <div className="w-64 shrink-0 text-center">
        <div className="font-mono text-22 font-semibold leading-none text-goldInk">{idleDays(task, now)}</div>
        <div className="mt-3 font-mono text-9 uppercase tracking-[1px] text-goldFaint">{T.daysIdle}</div>
      </div>
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => set({ sel: task.id })}>
        <div className="text-14.5 font-semibold leading-normal tracking-tightXs">{task.title}</div>
        <div className="mt-3 text-11.5 leading-normal text-mut2">{sub}</div>
      </div>
      <div className="flex shrink-0 gap-7">
        <Button className="rounded-9 px-12 py-7 text-12" onClick={() => keep(task.id)}>{T.keep}</Button>
        <Button variant="outlineGold" hoverTone="acc" className="rounded-9 px-12 py-7 text-12" onClick={() => openSnooze(task.id)}>{T.snoozeDots}</Button>
        <Button variant="outlineGold" tone="mut2" hoverTone="hi" className="rounded-9 px-12 py-7 text-12" onClick={() => archive(task.id)}>{T.archive}</Button>
      </div>
    </div>
  );
}

export function ReviewView() {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const now = useNow();
  const stale = digestStats(tasks, now).stale;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.resurface}</h1>
      <div className="mb-18 mt-4 text-12.5 leading-normal text-mut2">{phrases.reviewIntro(stale.length, lang)}</div>
      <div className="flex max-w-820 flex-col gap-10">
        {stale.map(t => <ReviewRow key={t.id} task={t} now={now} />)}
        {stale.length === 0 && <Empty className="py-20 text-16">{T.noDust}</Empty>}
      </div>
    </div>
  );
}
