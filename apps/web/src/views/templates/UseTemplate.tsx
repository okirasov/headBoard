import { useState } from 'react';
import { type Template, templatePlaceholders } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { cx } from '../../lib/cx';
import { Button } from '../../components/ui/primitives';
import { IcTemplate } from '../../components/ui/Icons';

/** "Create task" from a template; asks for {placeholders} in a small inline form when the template has any. */
export function UseTemplateButton({ template, compact }: { template: Template; compact?: boolean }) {
  const { T } = useT();
  const useTemplate = useStore(s => s.useTemplate);
  const keys = templatePlaceholders(template);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const run = () => { useTemplate(template.id, values); setOpen(false); setValues({}); };
  const trigger = compact
    ? <button type="button" onClick={() => (keys.length ? setOpen(o => !o) : run())} className="flex cursor-pointer items-center gap-5 rounded-7 border border-line bg-card px-8 py-4 font-mono text-10.5 text-mut hover:border-acc hover:text-acc"><IcTemplate size={11} />{template.name}</button>
    : <Button className="rounded-9 px-12 py-7 text-12" onClick={() => (keys.length ? setOpen(o => !o) : run())}><IcTemplate size={12} />{T.useTemplate}</Button>;
  return (
    <div className="relative">
      {trigger}
      {open && (
        <div className={cx('absolute z-30 flex w-290 flex-col gap-8 rounded-12 border border-line bg-card p-12 shadow-menu animate-fadeUpFast', compact ? 'left-0 top-[calc(100%+6px)]' : 'right-0 top-[calc(100%+6px)]')}>
          <div className="font-mono text-9.5 uppercase tracking-kicker text-mut2">{T.fillPlaceholders}</div>
          {keys.map(k => (
            <label key={k} className="flex flex-col gap-3 text-11.5 text-mut">
              {k}
              <input autoFocus={k === keys[0]} value={values[k] ?? ''} onChange={e => setValues(v => ({ ...v, [k]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') run(); }} className="rounded-9 border border-line bg-card px-9 py-6 font-sans text-12.5 text-ink focus:border-lineStrong" />
            </label>
          ))}
          <div className="flex gap-6">
            <Button className="flex-1 rounded-9 px-10 py-6 text-12" onClick={run}>{T.createTask}</Button>
            <Button variant="ghost" className="rounded-9 px-10 py-6 text-12" onClick={() => setOpen(false)}>{T.discard}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
