import { live } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { Dot, Kicker } from '../ui/primitives';
import { IcGear } from '../ui/Icons';
import { cx } from '../../lib/cx';

export function ProjectList() {
  const { T } = useT();
  const projects = useStore(s => s.projects);
  const tasks = useStore(s => s.tasks);
  const fProj = useStore(s => s.fProj);
  const set = useStore(s => s.set);
  const view = useStore(s => s.view);
  const open = live(tasks).filter(t => t.status !== 'done');
  const row = 'flex w-full cursor-pointer items-center gap-9 rounded-10 px-10 py-6 text-left text-13 leading-normal';
  return (
    <>
      <div className="mx-10 mb-8 mt-24 flex items-center">
        <Kicker spacing="kickerWide">{T.projects}</Kicker>
        <span className="flex-1" />
        <button type="button" title={T.manageProjects} aria-label={T.manageProjects} onClick={() => set({ view: 'projects' })} className={cx('flex h-18 w-18 cursor-pointer items-center justify-center rounded-6 hover:text-ink', view === 'projects' ? 'bg-sel text-ink' : 'text-mut2')}><IcGear size={12} /></button>
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => set({ fProj: null })} className={cx(row, fProj === null && 'bg-sel')}>
          <Dot color="var(--ink)" />
          <span className="flex-1">{T.allProjects}</span>
          <span className="font-mono text-10.5 text-mut2">{open.length}</span>
        </button>
        {projects.map(p => (
          <button key={p.id} type="button" onClick={() => set({ fProj: fProj === p.id ? null : p.id, view: 'board' })} className={cx(row, fProj === p.id && 'bg-sel')}>
            <Dot color={p.color} />
            <span className="flex-1">{p.name}</span>
            <span className="font-mono text-10.5 text-mut2">{open.filter(t => t.proj === p.id).length}</span>
          </button>
        ))}
      </div>
    </>
  );
}
