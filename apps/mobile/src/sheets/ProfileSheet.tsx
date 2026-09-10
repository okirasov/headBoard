import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '../lib/api';
import { type PushState, disablePush, enablePush, pushState } from '../lib/push';
import { useStore } from '../store/useStore';
import { deleteAccount } from '../store/sync';
import { pickAndImportBackup, shareBackup } from '../lib/backup';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Sheet } from '../components/Sheet';
import { Btn, Segmented } from '../components/ui';
import { IcArchive, IcBell, IcChevronRightSm, IcFolder, IcHash, IcHistory, IcRepeat, IcStats, IcTemplate, IcDownload, IcUpload } from '../components/Icons';
import { STALE_DAYS_OPTIONS, archived } from '@headboard/core';

export function ProfileSheet() {
  const { t } = useTheme();
  const { T, lang } = useT();
  const open = useStore(s => s.mProfOpen);
  const user = useStore(s => s.user);
  const theme = useStore(s => s.theme);
  const set = useStore(s => s.set);
  const setLang = useStore(s => s.setLang);
  const setTheme = useStore(s => s.setTheme);
  const toast = useStore(s => s.toast);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const onDeleteAccount = async () => {
    if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 6000); return; }
    if (deleting) return;
    setDeleting(true);
    const ok = await deleteAccount();
    setDeleting(false); setConfirmDel(false);
    toast(ok ? T.tAccountDeleted : T.tAccountDeleteFailed);
  };
  const staleDays = useStore(s => s.staleDays);
  const setStaleDays = useStore(s => s.setStaleDays);
  const signOut = useStore(s => s.signOut);
  const archivedN = useStore(s => archived(s.tasks).length);
  const projectsN = useStore(s => s.projects.length);
  const templatesN = useStore(s => s.templates.length);
  const notifyStale = useStore(s => s.notifyStale);
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
      <View>
        <Text style={[kicker(9.5, t.mut2), { marginBottom: 7 }]}>{T.staleAfter}</Text>
        <Segmented value={String(STALE_DAYS_OPTIONS.includes(staleDays as 3) ? staleDays : 7)} onChange={v => setStaleDays(Number(v))} options={STALE_DAYS_OPTIONS.map(d => ({ v: String(d), label: d + T.dShort }))} />
        <Text style={[txt(9, { mono: true, color: t.mut2 }), { marginTop: 5 }]}>{T.staleAfterHint}</Text>
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
      <Pressable onPress={() => set({ mProfOpen: false, mView: 'recurring' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <IcRepeat size={15} color={t.mut} />
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1 }]}>{T.recurTitle}</Text>
        <IcChevronRightSm size={12} color={t.mut2} />
      </Pressable>
      <Pressable onPress={() => set({ mProfOpen: false, mView: 'due' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <IcBell size={15} color={t.mut} />
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1 }]}>{T.dueTitle}</Text>
        <IcChevronRightSm size={12} color={t.mut2} />
      </Pressable>
      <Pressable onPress={() => set({ mProfOpen: false, mView: 'stats' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <IcStats size={15} color={t.mut} />
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1 }]}>{T.statsTitle}</Text>
        <IcChevronRightSm size={12} color={t.mut2} />
      </Pressable>
      <Pressable onPress={() => set({ mProfOpen: false, mView: 'projects' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <IcFolder size={15} color={t.mut} />
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1 }]}>{T.projectsTitle}</Text>
        <Text style={txt(10.5, { mono: true, color: t.mut2 })}>{projectsN}</Text>
        <IcChevronRightSm size={12} color={t.mut2} />
      </Pressable>
      <Pressable onPress={() => set({ mProfOpen: false, mView: 'templates' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <IcTemplate size={15} color={t.mut} />
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1 }]}>{T.templatesTitle}</Text>
        <Text style={txt(10.5, { mono: true, color: t.mut2 })}>{templatesN}</Text>
        <IcChevronRightSm size={12} color={t.mut2} />
      </Pressable>
      <Pressable onPress={() => set({ mProfOpen: false, mView: 'tags' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <IcHash size={15} color={t.mut} />
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1 }]}>{T.tagsTitle}</Text>
        <IcChevronRightSm size={12} color={t.mut2} />
      </Pressable>
      <Pressable onPress={() => set({ mProfOpen: false, mView: 'history', histId: null })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <IcHistory size={15} color={t.mut} />
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1 }]}>{T.historyTitle}</Text>
        <IcChevronRightSm size={12} color={t.mut2} />
      </Pressable>
      <Pressable onPress={() => set({ mProfOpen: false, mView: 'archive' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <IcArchive size={15} color={t.mut} />
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1 }]}>{T.archiveTitle}</Text>
        <Text style={txt(10.5, { mono: true, color: t.mut2 })}>{archivedN}</Text>
        <IcChevronRightSm size={12} color={t.mut2} />
      </Pressable>
      <View>
        <Text style={[kicker(9.5, t.mut2), { marginBottom: 7 }]}>{T.dataTitle}</Text>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          <Btn variant="card" label={T.exportData} icon={<IcDownload size={11} color={t.ink} />} size={12} pad={10} style={{ flex: 1 }} onPress={() => void shareBackup().catch(() => undefined)} />
          <Btn variant="card" label={T.importData} icon={<IcUpload size={11} color={t.ink} />} size={12} pad={10} style={{ flex: 1 }} onPress={() => void pickAndImportBackup().catch(() => undefined)} />
        </View>
        <Text style={[txt(9, { mono: true, color: t.mut2 }), { marginTop: 5 }]}>{T.exportHint}</Text>
      </View>
      <Pressable onPress={signOut} style={{ alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <Text style={txt(13.5, { w: 600, color: t.hi })}>{T.signOut}</Text>
      </Pressable>
      {api && (
        <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: t.hi, borderRadius: 12, padding: 12, gap: 6, opacity: 0.95 }}>
          <Text style={kicker(9.5, t.hi)}>{T.dangerTitle}</Text>
          <Text style={txt(9.5, { mono: true, color: t.mut2, lh: 1.5 })}>{T.deleteAccountHint}</Text>
          <Btn variant="outline" color={confirmDel ? t.hi : t.mut2} label={deleting ? T.deleteAccountBusy : confirmDel ? T.deleteAccountConfirm : T.deleteAccount} size={12} pad={10} style={{ borderColor: confirmDel ? t.hi : t.line }} onPress={() => void onDeleteAccount()} />
        </View>
      )}
    </Sheet>
  );
}
