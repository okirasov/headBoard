import { type CaptureItem, heuristicExtract, phrases, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { api } from '../../lib/api';
import { Button, Dot, Kicker, Scrim } from '../ui/primitives';
import { UseTemplateButton } from '../../views/templates/UseTemplate';
import { IcSpark, IcX } from '../ui/Icons';
import { cx } from '../../lib/cx';

const BAR = { hi: 'bg-hi', med: 'bg-med', lineStrong: 'bg-lineStrong' } as const;

export function CaptureModal() {
  const { T, lang } = useT();
  const capOpen = useStore(s => s.capOpen);
  const capText = useStore(s => s.capText);
  const capItems = useStore(s => s.capItems);
  const capBusy = useStore(s => s.capBusy);
  const projects = useStore(s => s.projects);
  const templates = useStore(s => s.templates);
  const set = useStore(s => s.set);
  const addTasks = useStore(s => s.addTasks);
  if (!capOpen) return null;
  const close = () => set({ capOpen: false, capItems: null });
  const hasItems = !!capItems?.length;

  const extract = async () => {
    const text = capText.trim();
    if (!text || capBusy) return;
    set({ capBusy: true });
    let items: CaptureItem[] = [];
    if (api) { try { items = await api.ai.extract(text, projects); } catch { items = []; } }
    if (!items.length) items = heuristicExtract(text, projects);
    set({ capItems: items, capBusy: false });
  };
  const addSingle = () => { const t = capText.trim(); if (t) addTasks([{ title: t.slice(0, 90), pr: 1, tags: [], proj: null }]); };
  const remove = (i: number) => set({ capItems: (capItems ?? []).filter((_, j) => j !== i) });

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <Scrim onClick={close} />
      <div className="relative flex w-600 flex-col gap-14 rounded-18 bg-panel p-24 shadow-modal animate-fadeUpSlow">
        <div>
          <div className="font-sans text-22 font-medium leading-normal tracking-tightSm">{T.capture}</div>
          <div className="mt-3 text-12.5 leading-normal text-mut2">{T.capSub}</div>
        </div>
        {templates.length > 0 && (
          <div className="flex flex-wrap items-center gap-6">
            <Kicker size={9}>{T.fromTemplate}</Kicker>
            {templates.slice(0, 6).map(t => <UseTemplateButton key={t.id} template={t} compact />)}
          </div>
        )}
        <textarea
          value={capText}
          onChange={e => set({ capText: e.target.value })}
          placeholder={T.capPh}
          className="h-132 resize-none rounded-12 border border-line bg-inset px-14 py-13 font-sans text-13.5 leading-[1.55] text-ink placeholder:text-faint"
        />
        {hasItems && (
          <div className="flex max-h-200 flex-col gap-6 overflow-y-auto">
            {(capItems as CaptureItem[]).map((ci, i) => {
              const p = projects.find(pp => pp.id === ci.proj);
              return (
                <div key={i} className="relative flex items-center gap-9 overflow-hidden rounded-10 border border-line bg-card py-9 pl-14 pr-11">
                  <span className={cx('absolute bottom-0 left-0 top-0 w-4', BAR[PRIORITY_BAR_TOKEN[ci.pr]])} />
                  <span className="flex-1 text-13 font-medium leading-normal">{ci.title}</span>
                  {p && <span className="flex items-center gap-4 text-11 leading-normal text-mut"><Dot color={p.color} size={6} />{p.name}</span>}
                  <button type="button" onClick={() => remove(i)} className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-6 text-mut2 hover:text-hi" aria-label="remove"><IcX size={10} /></button>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-8">
          <Button className="rounded-10 px-15 py-9 text-13" onClick={() => void extract()}><IcSpark size={12} />{capBusy ? T.extracting : T.extract}</Button>
          <Button variant="outline" hoverTone="acc" className="rounded-10 px-15 py-9 text-13" onClick={addSingle}>{T.addOne}</Button>
          <div className="flex-1" />
          {hasItems && <Button variant="ink" className="rounded-10 px-15 py-9 text-13" onClick={() => addTasks(capItems as CaptureItem[])}>{phrases.addN(capItems!.length, lang)}</Button>}
          <Button variant="ghost" className="rounded-10 px-13 py-9 text-13" onClick={close}>{T.discard}</Button>
        </div>
      </div>
    </div>
  );
}
