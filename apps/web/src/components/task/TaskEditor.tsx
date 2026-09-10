import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { type Comment, type Task, commentTime } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { cx } from '../../lib/cx';
import { Dot } from '../ui/primitives';
import { IcChevronDown, IcX } from '../ui/Icons';

/** Size a textarea to its content; measured again on the next frame because the drawer mounts mid-animation. */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  const fit = () => { el.style.height = '0px'; el.style.height = el.scrollHeight + 'px'; };
  fit();
  requestAnimationFrame(fit);
}

/** Heading that turns into a textarea on click; Enter or blur commits, Esc reverts. */
export function EditableTitle({ task, readOnly }: { task: Task; readOnly?: boolean }) {
  const setTitle = useStore(s => s.setTitle);
  const [v, setV] = useState(task.title);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setV(task.title); }, [task.id, task.title]);
  useEffect(() => { autoGrow(ref.current); }, [v]);
  const commit = () => { const t = v.trim(); if (t && t !== task.title) setTitle(task.id, t); else setV(task.title); };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); ref.current?.blur(); }
    if (e.key === 'Escape') { setV(task.title); ref.current?.blur(); }
  };
  if (readOnly) return <div className="text-pretty font-sans text-22 font-medium leading-[1.25] tracking-tightSm">{task.title}</div>;
  return (
    <textarea
      ref={ref}
      rows={1}
      value={v}
      maxLength={90}
      onChange={e => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={onKey}
      aria-label="title"
      className="-mx-6 -my-3 w-[calc(100%+12px)] shrink-0 resize-none overflow-hidden rounded-8 border border-transparent bg-transparent px-6 py-3 font-sans text-22 font-medium leading-[1.25] tracking-tightSm text-ink outline-none hover:border-line focus:border-lineStrong focus:bg-card"
    />
  );
}

/** Project dropdown styled like the status select; "No project" clears it. */
export function ProjectSelect({ task, className }: { task: Task; className?: string }) {
  const { T } = useT();
  const projects = useStore(s => s.projects);
  const setProject = useStore(s => s.setProject);
  const p = projects.find(x => x.id === task.proj) ?? null;
  return (
    <div className={cx('relative inline-flex items-center', className)}>
      {p && <Dot color={p.color} size={8} className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2" />}
      <select
        value={task.proj ?? ''}
        onChange={e => setProject(task.id, e.target.value || null)}
        aria-label="project"
        className={cx('cursor-pointer appearance-none rounded-8 border border-transparent bg-transparent py-4 pr-24 font-sans text-12.5 leading-normal outline-none hover:border-line focus:border-lineStrong focus:bg-card', p ? 'pl-24 text-mut' : 'pl-8 text-mut2')}
      >
        <option value="">{T.noProject}</option>
        {projects.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      <span className="pointer-events-none absolute right-8 top-1/2 flex -translate-y-1/2 text-mut2"><IcChevronDown size={9} /></span>
    </div>
  );
}

/** Note as an inset textarea; commits on blur. Shows a quiet placeholder when empty. */
export function NoteEditor({ task, readOnly }: { task: Task; readOnly?: boolean }) {
  const { T } = useT();
  const setNote = useStore(s => s.setNote);
  const [v, setV] = useState(task.note);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setV(task.note); }, [task.id, task.note]);
  useEffect(() => { autoGrow(ref.current); }, [v]);
  if (readOnly) return task.note ? <div className="whitespace-pre-wrap rounded-10 bg-inset px-13 py-11 text-13 leading-[1.55] text-mut">{task.note}</div> : null;
  return (
    <textarea
      ref={ref}
      rows={1}
      value={v}
      onChange={e => setV(e.target.value)}
      onBlur={() => { if (v !== task.note) setNote(task.id, v); }}
      placeholder={T.notePh}
      aria-label="note"
      className={cx('w-full shrink-0 resize-none overflow-hidden rounded-10 border border-transparent px-13 py-11 font-sans text-13 leading-[1.55] outline-none placeholder:text-faint focus:border-lineStrong', v ? 'bg-inset text-mut' : 'bg-transparent text-mut hover:bg-inset')}
    />
  );
}

/** URL of the linked Claude chat, editable inline. */
export function ChatLinkEditor({ task }: { task: Task }) {
  const { T } = useT();
  const setChat = useStore(s => s.setChat);
  const [v, setV] = useState(task.chat ?? '');
  useEffect(() => { setV(task.chat ?? ''); }, [task.id, task.chat]);
  return (
    <input
      value={v}
      onChange={e => setV(e.target.value)}
      onBlur={() => { const u = v.trim(); if (u !== (task.chat ?? '')) setChat(task.id, u || null); }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      placeholder={T.chatPh}
      aria-label="chat link"
      className="w-full rounded-8 border border-transparent bg-transparent px-6 py-3 font-mono text-11 text-mut outline-none placeholder:text-faint hover:border-line focus:border-lineStrong focus:bg-card"
    />
  );
}

/** One comment: click the text to edit, × to delete (two clicks). */
export function CommentRow({ task, c, now }: { task: Task; c: Comment; now: number }) {
  const { T, lang } = useT();
  const editComment = useStore(s => s.editComment);
  const removeComment = useStore(s => s.removeComment);
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(c.text);
  const [confirm, setConfirm] = useState(false);
  const commit = () => { const t = v.trim(); if (t && t !== c.text) editComment(task.id, c.id, t); setEditing(false); setV(t || c.text); };
  return (
    <div className="group relative rounded-10 bg-inset px-11 py-8">
      {editing ? (
        <textarea
          autoFocus
          value={v}
          onChange={e => setV(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); } if (e.key === 'Escape') { setV(c.text); setEditing(false); } }}
          rows={2}
          className="w-full resize-none rounded-6 border border-lineStrong bg-card px-6 py-4 font-sans text-12.5 leading-[1.5] text-ink outline-none"
        />
      ) : (
        <div className="cursor-text whitespace-pre-wrap pr-16 text-12.5 leading-[1.5]" onClick={() => setEditing(true)} title={T.cmEdit}>{c.text}</div>
      )}
      <div className="mt-3 font-mono text-9.5 text-mut2">{commentTime(c.at, lang, now)}</div>
      <button
        type="button"
        onClick={() => { if (confirm) removeComment(task.id, c.id); else setConfirm(true); }}
        onBlur={() => setConfirm(false)}
        aria-label={T.cmDelete}
        className={cx('absolute right-6 top-6 flex h-18 cursor-pointer items-center justify-center rounded-6 border text-mut2 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100', confirm ? 'border-hi px-5 font-mono text-9 text-hi opacity-100' : 'w-18 border-transparent hover:border-line hover:text-hi')}
      >
        {confirm ? T.cmConfirm : <IcX size={9} />}
      </button>
    </div>
  );
}
