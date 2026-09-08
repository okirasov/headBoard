import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { Logo } from '../../components/brand/Logo';
import { Kicker } from '../../components/ui/primitives';

export function SignIn() {
  const { T } = useT();
  const signIn = useStore(s => s.signIn);
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-bg p-40">
      <div className="flex w-432 flex-col gap-22 rounded-20 border border-line bg-panel p-34 shadow-auth">
        <div>
          <Logo size="auth" surface="panel" />
          <Kicker size={10} spacing="kickerWide" className="mt-6">{T.tagline}</Kicker>
        </div>
        <div className="text-pretty font-sans text-19 leading-[1.5] text-mut">{T.authSub}</div>
        <div className="flex flex-col gap-9">
          <button type="button" onClick={() => signIn('Google')} className="flex h-46 cursor-pointer items-center justify-center rounded-12 border border-lineStrong bg-card text-14 font-semibold hover:border-acc hover:text-acc">{T.google}</button>
          <button type="button" onClick={() => signIn('Apple')} className="flex h-46 cursor-pointer items-center justify-center rounded-12 bg-ink text-14 font-semibold text-onInk hover:bg-inkHov">{T.apple}</button>
        </div>
        <div className="font-mono text-10.5 leading-[1.7] tracking-[.4px] text-mut2">{T.authNote}</div>
      </div>
    </div>
  );
}
