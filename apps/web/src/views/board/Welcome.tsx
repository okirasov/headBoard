import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { Button, Kicker } from '../../components/ui/primitives';
import { IcBoard, IcReview, IcSpark, IcTemplate } from '../../components/ui/Icons';
import { SeedHint } from './SeedHint';

/** First-run card on an empty board: what the app does in three steps, and the two ways to start. */
export function Welcome() {
  const { T } = useT();
  const set = useStore(s => s.set);
  const steps = [
    { icon: <IcSpark size={14} />, title: T.welcome1, text: T.welcome1Sub },
    { icon: <IcBoard size={14} />, title: T.welcome2, text: T.welcome2Sub },
    { icon: <IcReview size={14} />, title: T.welcome3, text: T.welcome3Sub },
  ];
  return (
    <div className="mb-16 max-w-820 rounded-14 border border-line bg-card px-22 py-20">
      <Kicker className="mb-6">{T.welcomeKicker}</Kicker>
      <div className="font-sans text-22 font-medium leading-[1.25] tracking-tightSm">{T.welcomeTitle}</div>
      <div className="mt-6 max-w-600 text-13 leading-[1.55] text-mut">{T.welcomeSub}</div>
      <div className="mt-16 grid grid-cols-3 gap-12">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-12 bg-inset px-14 py-12">
            <div className="flex items-center gap-8 text-acc"><span className="font-mono text-10.5 text-mut2">{i + 1}</span>{s.icon}</div>
            <div className="mt-6 text-13 font-semibold leading-normal">{s.title}</div>
            <div className="mt-3 text-12 leading-[1.5] text-mut">{s.text}</div>
          </div>
        ))}
      </div>
      <div className="mt-16 flex items-center gap-8">
        <Button className="rounded-10 px-16 py-9 text-13" onClick={() => set({ capOpen: true, capItems: null })}><IcSpark size={12} />{T.welcomeCapture}</Button>
        <Button variant="outline" hoverTone="acc" className="rounded-10 px-14 py-9 text-13" onClick={() => set({ view: 'templates' })}><IcTemplate size={12} />{T.welcomeTemplates}</Button>
        <span className="flex-1" />
        <span className="font-mono text-10.5 text-mut2">{T.welcomeShortcut}</span>
      </div>
      <SeedHint />
    </div>
  );
}
