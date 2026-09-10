import { useState } from 'react';
import { type Priority, type Template, newTemplate, normalizeTags, phrases, priorityLabel, templatePlaceholders, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { cx } from '../../lib/cx';
import { Button, Dot, Empty, Kicker } from '../../components/ui/primitives';
import { IcPlus } from '../../components/ui/Icons';
import { UseTemplateButton } from './UseTemplate';

const BAR = { hi: 'bg-hi', med: 'bg-med', lineStrong: 'bg-lineStrong' } as const;

/** Editable fields of a template; used by both the row (in place) and the new-template form. */
function TemplateFields({ value, onChange }: { value: Template; onChange: (patch: Partial<Template>) => void }) {
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const field = 'rounded-9 border border-line bg-card px-10 py-7 font-sans text-12.5 leading-normal text-ink placeholder:text-faint focus:border-lineStrong';
  return (
    <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <input value={value.name} onChange={e => onChange({ name: e.target.value })} placeholder={T.templateName} className={cx(field, 'font-semibold')} aria-label={T.templateName} />
      <input value={value.title} onChange={e => onChange({ title: e.target.value })} placeholder={T.templateTitle} className={field} aria-label={T.templateTitle} />
      <textarea value={value.note} onChange={e => onChange({ note: e.target.value })} placeholder={T.templateNote} rows={2} className={cx(field, 'col-span-2 resize-none')} aria-label={T.templateNote} />
      <div className="col-span-2 flex flex-wrap items-center gap-10">
        <select value={value.proj ?? ''} onChange={e => onChange({ proj: e.target.value || null })} className="cursor-pointer appearance-none rounded-9 border border-line bg-card px-10 py-6 font-sans text-12 text-ink" aria-label={T.projects}>
          <option value="">{T.noProject}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex gap-4" role="radiogroup" aria-label={T.priority}>
          {([0, 1, 2] as Priority[]).map(p => (
            <button key={p} type="button" role="radio" aria-checked={value.pr === p} onClick={() => onChange({ pr: p })} className={cx('flex cursor-pointer items-center gap-5 rounded-7 border px-8 py-4 font-mono text-10.5', value.pr === p ? 'border-lineStrong bg-chipBg text-chipInk' : 'border-line bg-card text-mut')}>
              <span className={cx('h-8 w-8 rounded-full', BAR[PRIORITY_BAR_TOKEN[p]])} />{priorityLabel(p, lang)}
            </button>
          ))}
        </div>
        <input value={value.tags.join(' ')} onChange={e => onChange({ tags: normalizeTags(e.target.value.split(/[\s,]+/)) })} placeholder="#tags" className={cx(field, 'w-150 font-mono text-10.5')} aria-label={T.attachments} />
        <label className="flex items-center gap-6 font-mono text-10.5 text-mut">
          {T.dueInDays}
          <input type="number" min={0} max={3650} value={value.dueInDays ?? ''} onChange={e => onChange({ dueInDays: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })} className={cx(field, 'w-64 font-mono text-11')} aria-label={T.dueInDays} />
          <span className="text-faint">{T.dueInDaysHint}</span>
        </label>
        <div className={cx('flex gap-4', value.dueInDays === null && 'opacity-45')}>
          {([null, 0, 1] as Array<0 | 1 | null>).map(r => (
            <button key={String(r)} type="button" disabled={value.dueInDays === null} onClick={() => onChange({ remindDays: r })} className={cx('cursor-pointer rounded-7 border px-7 py-3 font-mono text-10 disabled:cursor-default', value.remindDays === r ? 'border-lineStrong bg-chipBg text-chipInk' : 'border-line bg-card text-mut')}>
              {r === null ? T.remindNone : r === 0 ? T.remindDay : T.remindDayBefore}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ t }: { t: Template }) {
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const updateTemplate = useStore(s => s.updateTemplate);
  const deleteTemplate = useStore(s => s.deleteTemplate);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const p = projects.find(x => x.id === t.proj);
  const keys = templatePlaceholders(t);
  return (
    <div className="relative flex flex-col gap-10 overflow-hidden rounded-12 border border-line bg-card py-12 pl-16 pr-14 hover:border-lineStrong">
      <span className={cx('absolute bottom-0 left-0 top-0 w-4', BAR[PRIORITY_BAR_TOKEN[t.pr]])} />
      <div className="flex items-center gap-12">
        <div className="min-w-0 flex-1">
          <div className="truncate text-14.5 font-semibold leading-normal">{t.name}</div>
          <div className="mt-2 flex flex-wrap items-center gap-10 text-11.5 leading-normal text-mut">
            {t.title !== t.name && <span className="truncate">{t.title}</span>}
            {p && <span className="flex items-center gap-5"><Dot color={p.color} />{p.name}</span>}
            {t.tags.length > 0 && <span className="font-mono text-10.5 text-mut2">{t.tags.map(x => '#' + x).join(' ')}</span>}
            {t.dueInDays !== null && <span className="font-mono text-10.5 text-mut2">{T.dueInDays} {t.dueInDays} {T.daysUnit}</span>}
            {keys.length > 0 && <span className="font-mono text-10.5 text-goldInk">{keys.map(k => '{' + k + '}').join(' ')}</span>}
            {t.usedCount > 0 && <span className="font-mono text-10.5 text-mut2">{T.usedN}{t.usedCount}×</span>}
          </div>
        </div>
        <UseTemplateButton template={t} />
        <Button variant="outline" hoverTone="acc" className="rounded-9 px-10 py-6 text-11.5" onClick={() => setEditing(e => !e)}>{editing ? T.discard : T.renameTag}</Button>
        <Button variant="outline" tone="mut2" hoverTone="hi" className={cx('rounded-9 px-10 py-6 text-11.5', confirm && '!border-hi !text-hi')} onClick={() => (confirm ? deleteTemplate(t.id) : setConfirm(true))} onBlur={() => setConfirm(false)}>
          {confirm ? T.confirmDeleteTemplate : T.deleteProject}
        </Button>
      </div>
      {editing && <TemplateFields value={t} onChange={patch => updateTemplate(t.id, patch)} />}
    </div>
  );
}

export function TemplatesView() {
  const { T, lang } = useT();
  const templates = useStore(s => s.templates);
  const addTemplate = useStore(s => s.addTemplate);
  const [draft, setDraft] = useState<Template>(() => newTemplate({ name: '' }));
  const add = () => { if (!draft.name.trim()) return; addTemplate(newTemplate({ ...draft, title: draft.title.trim() || draft.name })); setDraft(newTemplate({ name: '' })); };
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-24 pb-24 pt-18">
      <div className="flex items-baseline gap-14">
        <h1 className="m-0 font-sans text-26 font-medium leading-[1.2] tracking-tight">{T.templatesTitle}</h1>
        <div className="text-12 leading-normal text-mut2">{T.templatesSub}</div>
        <span className="flex-1" />
        <span className="font-mono text-10.5 text-mut2">{phrases.templatesN(templates.length, lang)}</span>
      </div>
      <div className="mb-16 mt-4 max-w-820 text-12.5 leading-normal text-mut2">{T.templatesHint}</div>
      <div className="flex max-w-820 flex-col gap-10">
        {templates.map(t => <Row key={t.id} t={t} />)}
        {templates.length === 0 && <Empty className="py-6 text-14">{T.noTemplates}</Empty>}
        <div className="mt-8 flex flex-col gap-12 rounded-14 border border-dashed border-lineStrong bg-panel px-16 py-14">
          <Kicker>{T.newTemplate}</Kicker>
          <TemplateFields value={draft} onChange={patch => setDraft(d => ({ ...d, ...patch }))} />
          <div><Button className="rounded-10 px-14 py-8 text-13" onClick={add} disabled={!draft.name.trim()}><IcPlus size={12} />{T.addProject.replace(/project|проект/i, m => (/^п/i.test(m) ? 'шаблон' : 'template'))}</Button></div>
        </div>
      </div>
    </div>
  );
}
