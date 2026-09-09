import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '../lib/api';
import { type PushState, disablePush, enablePush, pushState } from '../lib/push';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Sheet } from '../components/Sheet';
import { Segmented } from '../components/ui';
import { IcArchive, IcChevronRightSm, IcFolder } from '../components/Icons';
import { archived } from '@headboard/core';

export function ProfileSheet() {
  const { t } = useTheme();
  const { T, lang } = useT();
  const open = useStore(s => s.mProfOpen);
  const user = useStore(s => s.user);
  const theme = useStore(s => s.theme);
  const set = useStore(s => s.set);
  const setLang = useStore(s => s.setLang);
  const setTheme = useStore(s => s.setTheme);
  const signOut = useStore(s => s.signOut);
  const archivedN = useStore(s => archived(s.tasks).length);
  const projectsN = useStore(s => s.projects.length);
  const notifyStale = useStore(s => s.notifyStale);
  const toast = useStore(s => s.toast);
  const [push, setPush] = useState<PushState>('off');
  useEffect(() => { if (open) void pushState().then(setPush); }, [open]);
  const setNotify = async (on: boolean) => {
    if (on) {
      const st = await enablePush();
      setPush(st);
      if (st === 'denied') toast(T.notifyDenied); else if (st === 'unsupported') toast(T.notifyUnavailable);
    } else { await disablePush(); setPush('off'); }
  };
  const sendTest = async () => { try { const r = await api?.push.test(); toast(r && r.sent > 0 ? T.notifyTestSent : T.notifyUnavailable); } catch { toast(T.notifyUnavailable); } };
  return (
    <Sheet open={open && !!user} onClose={() => set({ mProfOpen: false })} gap={15}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: t.chipBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={txt(13, { mono: true, w: 600, color: t.chipInk })}>{user?.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={txt(15, { w: 600, color: t.ink })}>{user?.name}</Text>
          <Text style={txt(10.5, { mono: true, color: t.mut2 })}>{user?.email}</Text>
        </View>
      </View>
      <View>
        <Text style={[kicker(9.5, t.mut2), { marginBottom: 7 }]}>{T.language}</Text>
        <Segmented value={lang} onChange={setLang} options={[{ v: 'en', label: 'EN' }, { v: 'ru', label: 'RU' }]} />
      </View>
      <View>
        <Text style={[kicker(9.5, t.mut2), { marginBottom: 7 }]}>{T.theme}</Text>
        <Segmented value={theme} onChange={setTheme} options={[{ v: 'light', label: T.light }, { v: 'dark', label: T.dark }]} />
      </View>
      {api && (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
            <Text style={[kicker(9.5, t.mut2), { flex: 1 }]}>{T.notifications}</Text>
            {push === 'on' && <Pressable onPress={() => void sendTest()}><Text style={kicker(9.5, t.acc)}>{T.notifyTest}</Text></Pressable>}
          </View>
          <Segmented value={push === 'on' && notifyStale ? 'on' : 'off'} onChange={v => void setNotify(v === 'on')} options={[{ v: 'on', label: T.notifyOn }, { v: 'off', label: T.notifyOff }]} />
          <Text style={[txt(9.5, { mono: true, color: t.mut2 }), { marginTop: 5 }]}>{T.notifyHint}</Text>
        </View>
      )}
      <Pressable onPress={() => set({ mProfOpen: false, mView: 'projects' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <IcFolder size={15} color={t.mut} />
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1 }]}>{T.projectsTitle}</Text>
        <Text style={txt(10.5, { mono: true, color: t.mut2 })}>{projectsN}</Text>
        <IcChevronRightSm size={12} color={t.mut2} />
      </Pressable>
      <Pressable onPress={() => set({ mProfOpen: false, mView: 'archive' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <IcArchive size={15} color={t.mut} />
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1 }]}>{T.archiveTitle}</Text>
        <Text style={txt(10.5, { mono: true, color: t.mut2 })}>{archivedN}</Text>
        <IcChevronRightSm size={12} color={t.mut2} />
      </Pressable>
      <Pressable onPress={signOut} style={{ alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <Text style={txt(13.5, { w: 600, color: t.hi })}>{T.signOut}</Text>
      </Pressable>
    </Sheet>
  );
}
