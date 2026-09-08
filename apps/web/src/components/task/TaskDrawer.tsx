import { type Priority, type Task, type ColumnKey, COLUMN_KEYS, dueLabel, fmtDate, commentTime, priorityLabel, statusLabel, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore, selectSelectedTask } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { filesToRefs } from '../../lib/files';
import { cx } from '../../lib/cx';
import { Button, Dot, IconButton, Kicker, Scrim } from '../ui/primitives';
import { IcChevronDown, IcLink, IcSend, IcX } from '../ui/Icons';
import { AttachButton, FileChip } from '../files/FileChip';
import { IdleBadge } from '../../views/board/TaskCard';

const BAR = { hi: 'bg-hi', med: 'bg-med', lineStrong: 'bg-lineStrong' } as const;

export function StatusSelect({ value, onChange, className }: { value: ColumnKey; onChange: (v: ColumnKey) => void; className?: string }) {
  const { lang } = useT();
  return (
    <div className={cx('relative', className)}>
      <select
        value={value}
        onChange={e => onChange(e.target.value as ColumnKey)}
        className="w-full cursor-pointer appearance-none rounded-10 border border-line bg-card py-10 pl-12 pr-32 font-sans text-13 font-semibold leading-normal text-ink outline-none"
      >
        {COLUMN_KEYS.map(k => <option key={k} value={k}>{statusLabel(k, lang)}</option>)}
      </select>
      <span className="pointer-events-none absolute right-12 top-1/2 flex -translate-y-1/2 text-mut2"><IcChevronDown size={10} /></span>
    </div>
  );
}

export function PriorityDots({ value, onChange, size = 20, showLabel = true }: { value: Priority; onChange: (p: Priority) => void; size?: 20 | 22; showLabel?: boolean }) {
  const { lang } = useT();
  return (
    <div className={cx('flex items-center', size === 20 ? 'h-39 gap-8' : 'gap-9')}>
      {([0, 1, 2] as Priority[]).map(i => {
        const sel = value === i;
        return (
          <button
            key={i}
            type="button"
            title={priorityLabel(i, lang)}
            onClick={() => onChange(i)}
            className={cx('shrink-0 cursor-pointer rounded-full border-2', BAR[PRIORITY_BAR_TOKEN[i]], sel ? 'border-ink shadow-pr-ring-sel' : 'border-transparent shadow-pr-ring')}
            style={{ width: size, height: size }}
          />
        );
      })}
      {showLabel && <span className="min-w-54 font-mono text-10 uppercase tracking-[.6px] text-mut">{priorityLabel(value, lang)}</span>}
    </div>
  );
}

function DrawerBody({ task }: { task: Task }) {
  const { T, lang } = useT();
  const now = useNow();
  const projects = useStore(s => s.projects);
  const cmText = useStore(s => s.cmText);
  const set = useStore(s => s.set);
  const moveTask = useStore(s => s.moveTask);
  const setPriority = useStore(s => s.setPriority);
  const addComment = useStore(s => s.addComment);
  const attachFiles = useStore(s => s.attachFiles);
  const removeFile = useStore(s => s.removeFile);
  const toggleDone = useStore(s => s.toggleDone);
  const bump = useStore(s => s.bump);
  const archive = useStore(s => s.archive);
  const openSnooze = useStore(s => s.openSnooze);
  const close = () => set({ sel: null });
  const p = projects.find(x => x.id === task.proj) ?? null;
  const status = (task.status === 'archived' ? 'inbox' : task.status) as ColumnKey;

  const onStatus = (v: ColumnKey) => moveTask(task.id, v);

  const meta: Array<[string, string]> = [
    [T.created, fmtDate(task.created, lang)],
    [T.due, dueLabel(task, lang, now) || '—'],
    [T.repeats, task.recur ? T.everyWeek : '—'],
  ];

  return (
    <div className="absolute bottom-0 right-0 top-0 flex w-392 flex-col gap-14 overflow-hidden border-l border-line bg-panel px-22 pb-18 pt-22 shadow-drawer animate-slideIn">
      <div className="flex items-center gap-8">
        <IdleBadge task={task} now={now} radius={6} />
        <span className="flex-1" />
        <IconButton onClick={close} aria-label="close"><IcX size={11} /></IconButton>
      </div>
      <div className="-mr-8 flex min-h-0 flex-1 flex-col gap-14 overflow-y-auto pr-8">
        <div className="text-pretty font-sans text-22 font-medium leading-[1.25] tracking-tightSm">{task.title}</div>
        {p && (
          <div className="flex items-center gap-6 text-12.5 leading-normal text-mut">
            <Dot color={p.color} size={8} />{p.name}
            {task.tags.length > 0 && <span className="ml-6 font-mono text-10.5 text-mut2">{task.tags.map(x => '#' + x).join(' ')}</span>}
          </div>
        )}
        {task.note && <div className="rounded-10 bg-inset px-13 py-11 text-13 leading-[1.55] text-mut">{task.note}</div>}
        <div className="flex items-end gap-14">
          <div className="min-w-0 flex-1">
            <Kicker className="mb-7">{T.status}</Kicker>
            <StatusSelect value={status} onChange={onStatus} />
          </div>
          <div>
            <Kicker className="mb-7">{T.priority}</Kicker>
            <PriorityDots value={task.pr} onChange={pr => setPriority(task.id, pr)} />
          </div>
        </div>
        <div>
          <Kicker className="mb-7">{T.attachments} · {task.files.length}</Kicker>
          <div className="flex flex-wrap gap-6">
            {task.files.map(f => <FileChip key={f.id} file={f} onRemove={() => removeFile(task.id, f.id)} />)}
            <AttachButton label={T.attach} className="px-10 py-7" onFiles={async fl => attachFiles(task.id, await filesToRefs(fl))} />
          </div>
        </div>
        <div>
          <Kicker className="mb-7">{T.comments} · {task.comments.length}</Kicker>
          <div className="flex flex-col gap-6">
            <div className="-mr-6 flex max-h-186 flex-col gap-6 overflow-y-auto pr-6">
              {task.comments.map(c => (
                <div key={c.id} className="rounded-10 bg-inset px-11 py-8">
                  <div className="text-12.5 leading-[1.5]">{c.text}</div>
                  <div className="mt-3 font-mono text-9.5 text-mut2">{commentTime(c.at, lang, now)}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-6">
              <input
                value={cmText}
                onChange={e => set({ cmText: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') addComment(task.id, cmText); }}
                placeholder={T.cmPh}
                className="flex-1 rounded-10 border border-line bg-card px-11 py-8 font-sans text-12.5 leading-normal text-ink placeholder:text-faint"
              />
              <button type="button" onClick={() => addComment(task.id, cmText)} className="flex h-34 w-34 shrink-0 cursor-pointer items-center justify-center rounded-10 bg-acc text-onAcc hover:bg-accHov" aria-label="send">
                <IcSend size={13} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-8 border-t border-line pt-12">
          {meta.map(([l, v]) => (
            <div key={l} className="flex text-12 leading-normal"><span className="w-130 shrink-0 text-mut2">{l}</span><span className="font-mono text-11 text-mut">{v}</span></div>
          ))}
          {task.chat && (
            <div className="flex items-center text-12 leading-normal">
              <span className="w-130 shrink-0 text-mut2">{T.claudeChat}</span>
              <a href={task.chat} target="_blank" rel="noreferrer" className="flex items-center gap-5 text-12 font-semibold"><IcLink size={11} />{T.openChat}</a>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-8 pt-4">
        <div className="flex gap-8">
          <Button variant="ok" className="flex-1 rounded-10 p-10 text-13" onClick={() => { toggleDone(task.id); close(); }}>{task.status === 'done' ? T.reopen : T.markDone}</Button>
          <Button className="flex-1 rounded-10 p-10 text-13" onClick={() => { bump(task.id); close(); }}>{T.bumpTop}</Button>
        </div>
        <div className="flex gap-8">
          <Button variant="outline" hoverTone="acc" className="flex-1 rounded-10 p-9 text-12.5" onClick={() => openSnooze(task.id)}>{T.snoozeDots}</Button>
          <Button variant="outline" tone="mut2" hoverTone="hi" className="flex-1 rounded-10 p-9 text-12.5" onClick={() => archive(task.id)}>{T.archive}</Button>
        </div>
      </div>
    </div>
  );
}

export function TaskDrawer() {
  const task = useStore(selectSelectedTask);
  const set = useStore(s => s.set);
  if (!task) return null;
  return (
    <div className="absolute inset-0 z-40">
      <Scrim tone="drawer" onClick={() => set({ sel: null })} />
      <DrawerBody task={task} />
    </div>
  );
}
