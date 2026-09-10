import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../lib/api';
import { type PushState, disablePush, enablePush, pushState } from '../../lib/push';
import { useT } from '../../lib/useT';
import { Kicker, Segmented } from '../ui/primitives';
import { IcChevronUp, IcTemplate } from '../ui/Icons';
import { cx } from '../../lib/cx';

export function Avatar({ initials, size = 30, textSize = 'text-10.5' }: { initials: string; size?: number; textSize?: string }) {
  return (
    <span className={cx('flex shrink-0 items-center justify-center rounded-full bg-chipBg font-mono font-semibold text-chipInk', textSize)} style={{ width: size, height: size }}>
      {initials}
    </span>
  );
}

export function ProfileBlock() {
  const { T, lang } = useT();
  const user = useStore(s => s.user);
  const profOpen = useStore(s => s.profOpen);
  const theme = useStore(s => s.theme);
  const set = useStore(s => s.set);
  const setLang = useStore(s => s.setLang);
  const setTheme = useStore(s => s.setTheme);
  const signOut = useStore(s => s.signOut);
  const notifyStale = useStore(s => s.notifyStale);
  const toast = useStore(s => s.toast);
  const [push, setPush] = useState<PushState>('off');
  useEffect(() => { if (profOpen) void pushState().then(setPush); }, [profOpen]);
  const setNotify = async (on: boolean) => {
    if (on) {
      const st = await enablePush();
      setPush(st);
      if (st === 'denied') toast(T.notifyDenied);
      else if (st === 'unavailable' || st === 'unsupported') toast(T.notifyUnavailable);
      set({ notifyStale: st === 'on' });
    } else {
      await disablePush();
      setPush('off');
      set({ notifyStale: false });
    }
  };
  const sendTest = async () => { try { const r = await api?.push.test(); toast(r && r.sent > 0 ? T.notifyTestSent : T.notifyUnavailable); } catch { toast(T.notifyUnavailable); } };
  if (!user) return null;
  return (
    <div className="relative border-t border-line pt-10">
      {profOpen && (
        <div className="absolute inset-x-0 z-[45] flex flex-col gap-11 rounded-14 border border-line bg-card p-13 shadow-menu animate-fadeUpFast" style={{ bottom: 'calc(100% + 6px)' }}>
          <div className="flex flex-col gap-2">
            <span className="text-13 font-semibold leading-normal">{user.name}</span>
            <span className="font-mono text-10 text-mut2">{user.email}</span>
          </div>
          <div className="h-px bg-line" />
          <div>
            <Kicker size={9} className="mb-6">{T.language}</Kicker>
            <Segmented value={lang} onChange={setLang} options={[{ v: 'en', label: 'EN' }, { v: 'ru', label: 'RU' }]} />
          </div>
          <div>
            <Kicker size={9} className="mb-6">{T.theme}</Kicker>
            <Segmented value={theme} onChange={setTheme} options={[{ v: 'light', label: T.light }, { v: 'dark', label: T.dark }]} />
          </div>
          <button type="button" onClick={() => set({ view: 'templates', profOpen: false })} className="flex cursor-pointer items-center gap-8 rounded-9 border border-line bg-card px-10 py-7 text-left text-12.5 font-semibold leading-normal hover:border-lineStrong"><IcTemplate size={13} className="text-mut2" /><span className="flex-1">{T.templatesTitle}</span><span className="font-mono text-10.5 font-normal text-mut2">{useStore.getState().templates.length}</span></button>
          {api && (
            <div>
              <div className="mb-6 flex items-center"><Kicker size={9}>{T.notifications}</Kicker><span className="flex-1" />{push === 'on' && <button type="button" onClick={() => void sendTest()} className="cursor-pointer font-mono text-9 uppercase tracking-kicker text-mut2 hover:text-acc">{T.notifyTest}</button>}</div>
              <Segmented value={push === 'on' && notifyStale ? 'on' : 'off'} onChange={v => void setNotify(v === 'on')} options={[{ v: 'on', label: T.notifyOn }, { v: 'off', label: T.notifyOff }]} />
              <div className="mt-5 font-mono text-9 text-mut2">{T.notifyHint}</div>
            </div>
          )}
          <div className="h-px bg-line" />
          <button type="button" onClick={signOut} className="cursor-pointer p-1 text-left text-12.5 font-semibold leading-normal text-hi">{T.signOut}</button>
        </div>
      )}
      <button
        type="button"
        onClick={() => set({ profOpen: !profOpen })}
        className={cx('flex w-full cursor-pointer items-center gap-9 rounded-11 px-8 py-7 text-left hover:bg-sel', profOpen && 'bg-sel')}
      >
        <Avatar initials={user.initials} />
        <div className="min-w-0 flex-1">
          <div className="ellipsis text-12.5 font-semibold leading-normal">{user.name}</div>
          <div className="font-mono text-9.5 text-mut2">{T.signedWith}{user.provider}</div>
        </div>
        <IcChevronUp size={11} className="shrink-0 text-mut2" />
      </button>
    </div>
  );
}

export function SyncStatus() {
  const { T } = useT();
  return (
    <div className="flex items-center gap-8 px-10 pt-10">
      <span className="h-7 w-7 shrink-0 rounded-full bg-ok animate-pulse" />
      <div className="flex-1">
        <div className="text-12 font-semibold leading-normal">{T.offline}</div>
        <div className="font-mono text-10 text-mut2">{T.synced}</div>
      </div>
    </div>
  );
}
