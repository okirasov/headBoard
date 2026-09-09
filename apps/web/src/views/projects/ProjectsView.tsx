import { useState } from 'react';
import { type Project, PROJECT_PALETTE, live, nextProjectColor, phrases } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { cx } from '../../lib/cx';
import { Button, Dot, Empty } from '../../components/ui/primitives';
import { IcCheck, IcPlus } from '../../components/ui/Icons';

/** Row of palette swatches; the current colour shows a check mark. */
export function ColorSwatches({ value, onChange, size = 20 }: { value: string; onChange: (c: string) => void; size?: number }) {
  const { T } = useT();
  return (
    <div className="flex items-center gap-6" role="radiogroup" aria-label={T.colorLabel}>
      {PROJECT_PALETTE.map(s => (
        <button
          key={s.key}
          type="button"
          role="radio"
          aria-checked={s.color === value}
          title={s.key}
          onClick={() => onChange(s.color)}
          className={cx('flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-onAcc', s.color === value ? 'border-ink shadow-pr-ring-sel' : 'border-transparent shadow-pr-ring')}
          style={{ width: size, height: size, background: s.color }}
        >
          {s.color === value && <IcCheck size={10} />}
        </button>
      ))}
    </div>
  );
}

function ProjectRow({ p }: { p: Project }) {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const updateProject = useStore(s => s.updateProject);
  const deleteProject = useStore(s => s.deleteProject);
  const set = useStore(s => s.set);
  const [name, setName] = useState(p.name);
  const [confirm, setConfirm] = useState(false);
  const open = live(tasks).filter(t => t.proj === p.id && t.status !== 'done').length;
  const commit = () => { if (name.trim() && name.trim() !== p.name) updateProject(p.id, { name }); else setName(p.name); };
  return (
    <div className="flex items-center gap-14 rounded-14 border border-line bg-card px-16 py-12 hover:border-lineStrong">
      <Dot color={p.color} size={12} />
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setName(p.name); (e.target as HTMLInputElement).blur(); } }}
        className="min-w-0 flex-1 rounded-9 border border-transparent bg-transparent px-8 py-6 text-14.5 font-semibold leading-normal text-ink hover:border-line focus:border-lineStrong focus:bg-inset"
        aria-label={T.projectNamePh}
      />
      <button type="button" onClick={() => set({ view: 'board', fProj: p.id })} className="cursor-pointer font-mono text-10.5 text-mut2 hover:text-acc">{phrases.tasksN(open, lang)}</button>
      <ColorSwatches value={p.color} onChange={c => updateProject(p.id, { color: c })} />
      <Button
        variant="outline"
        tone="mut2"
        hoverTone="hi"
        className={cx('rounded-9 px-12 py-7 text-12', confirm && '!border-hi !text-hi')}
        onClick={() => (confirm ? deleteProject(p.id) : setConfirm(true))}
        onBlur={() => setConfirm(false)}
      >
        {confirm ? T.confirmDeleteProject : T.deleteProject}
      </Button>
    </div>
  );
}

export function ProjectsView() {
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const addProject = useStore(s => s.addProject);
  const [name, setName] = useState('');
  const [color, setColor] = useState(() => nextProjectColor(projects));
  const add = () => {
    if (!name.trim()) return;
    addProject(name, color);
    setName('');
    setColor(nextProjectColor([...projects, { id: '_', name: '', color }]));
  };
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <div className="flex items-baseline gap-14">
        <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.projectsTitle}</h1>
        <div className="text-12 leading-normal text-mut2">{phrases.projectsN(projects.length, lang)}</div>
      </div>
      <div className="mb-18 mt-4 max-w-820 text-12.5 leading-normal text-mut2">{T.projectsHint}</div>
      <div className="flex max-w-820 flex-col gap-10">
        {projects.map(p => <ProjectRow key={p.id} p={p} />)}
        {projects.length === 0 && <Empty className="py-10 text-14">{T.noProjects}</Empty>}
        <div className="mt-8 flex flex-col gap-12 rounded-14 border border-dashed border-lineStrong bg-panel px-16 py-14">
          <div className="font-mono text-9.5 uppercase tracking-kicker text-mut2">{T.newProject}</div>
          <div className="flex items-center gap-14">
            <Dot color={color} size={12} />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add(); }}
              placeholder={T.projectNamePh}
              className="min-w-0 flex-1 rounded-10 border border-line bg-card px-12 py-8 font-sans text-13.5 leading-normal text-ink placeholder:text-faint"
            />
            <ColorSwatches value={color} onChange={setColor} />
            <Button className="rounded-10 px-14 py-8 text-13" onClick={add} disabled={!name.trim()}><IcPlus size={12} />{T.addProject}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
