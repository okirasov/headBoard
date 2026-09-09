import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { type CalendarStatus, fmtDateTimeShort } from '@headboard/core';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { refreshTasks } from '../store/sync';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { Btn, Card, Dot } from './ui';

const RETURN_URL = 'headboard://calendar';

/** Google Calendar connection card on the Calendar screen; the consent flow runs in the system browser. */
export function CalendarSyncCard({ now }: { now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const token = useStore(s => s.token);
  const toast = useStore(s => s.toast);
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!api || !token) return;
    try { setStatus(await api.calendar.status()); } catch { setStatus(null); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  if (!api || !token || (status && !status.available)) return null;

  const a = api; // narrowed for the closures below
  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await a.calendar.connect(RETURN_URL);
      const res = await WebBrowser.openAuthSessionAsync(url, RETURN_URL);
      if (res.type === 'success') {
        const outcome = /calendar=(\w+)/.exec(res.url)?.[1];
        toast(outcome === 'connected' ? T.gcalConnected : outcome === 'denied' ? T.gcalDenied : T.gcalError);
        if (outcome === 'connected') { await a.calendar.syncNow().catch(() => undefined); await refreshTasks(); }
      }
    } catch { toast(T.gcalError); }
    await load();
    setBusy(false);
  };
  const syncNow = async () => { setBusy(true); try { setStatus(await a.calendar.syncNow()); await refreshTasks(); } catch { toast(T.gcalError); } setBusy(false); };
  const disconnect = async () => { setBusy(true); try { await a.calendar.disconnect(); await load(); } catch { toast(T.gcalError); } setBusy(false); };

  const err = status?.lastError;
  const connected = !!status?.connected;
  const color = !connected ? t.mut2 : err ? t.goldInk : t.ok;
  const label = busy ? T.gcalSyncing : !connected ? T.gcalConnect : err === 'reauthorize' ? T.gcalReauth : err ? T.gcalError : T.gcalConnected;
  return (
    <Card style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Dot color={color} />
        <Text style={[txt(10.5, { mono: true, color }), { flex: 1 }]}>{label}</Text>
        {connected && status?.lastSyncAt ? <Text style={txt(9.5, { mono: true, color: t.mut2 })}>{T.gcalSynced}{fmtDateTimeShort(status.lastSyncAt, lang, now)}</Text> : null}
      </View>
      <Text style={txt(11.5, { color: t.mut, lh: 1.5 })}>{T.gcalHint}</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {!connected || err === 'reauthorize'
          ? <Btn label={T.gcalConnect} size={11.5} pad={8} radius={9} style={{ flex: 1 }} onPress={() => void connect()} />
          : <Btn variant="outline" color={t.ink} label={T.gcalSyncNow} size={11.5} pad={8} radius={9} style={{ flex: 1 }} onPress={() => void syncNow()} />}
        {connected && <Pressable onPress={() => void disconnect()} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 9, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}><Text style={txt(11.5, { w: 600, color: t.mut2 })}>{T.gcalDisconnect}</Text></Pressable>}
      </View>
    </Card>
  );
}
