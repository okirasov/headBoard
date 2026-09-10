import { useState } from 'react';
import { type Task, normalizeTag, suggestTags } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { IcX } from '../ui/Icons';

/** Chips with remove buttons plus an input with suggestions from tags already in use. */
export function TagEditor({ task }: { task: Task }) {
  const { T } = useT();
  const tasks = useStore(s => s.tasks);
  const setTags = useStore(s => s.setTags);
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const suggestions = suggestTags(tasks, draft, task.tags);
  const add = (raw: string) => { const t = normalizeTag(raw); if (t && !task.tags.includes(t)) setTags(task.id, [...task.tags, t]); setDraft(''); };
  return (
    <div className="relative flex flex-wrap items-center gap-5">
      {task.tags.map(x => (
        <span key={x} className="flex items-center gap-4 rounded-7 border border-line bg-card px-7 py-3 font-mono text-10.5 text-mut">
          #{x}
          <button type="button" onClick={() => setTags(task.id, task.tags.filter(y => y !== x))} className="flex cursor-pointer text-mut2 hover:text-hi" aria-label="remove"><IcX size={8} /></button>
        </span>
      ))}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',' || e.key === ' ') { e.preventDefault(); add(draft); } if (e.key === 'Backspace' && !draft && task.tags.length) setTags(task.id, task.tags.slice(0, -1)); }}
        placeholder={T.addTagPh}
        className="min-w-90 flex-1 rounded-7 border border-dashed border-lineStrong bg-transparent px-7 py-3 font-mono text-10.5 text-ink placeholder:text-faint focus:border-acc"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 flex flex-wrap gap-4 rounded-10 border border-line bg-card p-6 shadow-menu">
          {suggestions.map(s => <button key={s} type="button" onMouseDown={e => e.preventDefault()} onClick={() => add(s)} className="cursor-pointer rounded-7 bg-inset px-7 py-3 font-mono text-10.5 text-mut hover:bg-sel hover:text-ink">#{s}</button>)}
        </div>
      )}
    </div>
  );
}
