import { useCallback, useEffect, useState } from 'react';
import { type CalendarStatus, fmtDateTimeShort } from '@headboard/core';
import { api } from '../../lib/api';
import { useStore } from '../../store/useStore';
import { refreshTasks } from '../../store/sync';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { cx } from '../../lib/cx';
import { Dot } from '../../components/ui/primitives';

/**
 * The "Google Calendar · two-way sync" chip made real: shows connection state, starts the consent flow,
 * and offers Sync now / Disconnect once connected. Without an API it stays the decorative chip of the prototype.
 */
export function CalendarSyncChip() {
  const { T, lang } = useT();
  const now = useNow();
  const token = useStore(s => s.token);
  const toast = useStore(s => s.toast);
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!api || !token) return;
    try { setStatus(await api.calendar.status()); } catch { setStatus(null); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  if (!api || !token) {
    return <div className="flex items-center gap-6 rounded-7 border border-okBd bg-okBg px-10 py-3 font-mono text-10.5 text-ok"><Dot color="var(--ok)" size={6} />{T.gcal}</div>;
  }
  if (status && !status.available) {
    return <div className="flex items-center gap-6 rounded-7 border border-line bg-card px-10 py-3 font-mono text-10.5 text-mut2"><Dot color="var(--faint)" size={6} />{T.gcalUnavailable}</div>;
  }

  const a = api; // narrowed for the closures below
  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await a.calendar.connect(location.origin + location.pathname);
      location.href = url;
    } catch { toast(T.gcalError); setBusy(false); }
  };
  const syncNow = async () => {
    setBusy(true); setOpen(false);
    try { setStatus(await a.calendar.syncNow()); await refreshTasks(); } catch { toast(T.gcalError); }
    setBusy(false);
  };
  const disconnect = async () => {
    setBusy(true); setOpen(false);
    try { await a.calendar.disconnect(); await load(); } catch { toast(T.gcalError); }
    setBusy(false);
  };

  if (!status?.connected) {
    return (
      <button type="button" onClick={connect} disabled={busy} className="flex cursor-pointer items-center gap-6 rounded-7 border border-line bg-card px-10 py-3 font-mono text-10.5 text-mut hover:border-acc hover:text-acc">
        <Dot color="var(--mut2)" size={6} />{busy ? T.gcalSyncing : T.gcalConnect}
      </button>
    );
  }
  const err = status.lastError;
  const label = busy ? T.gcalSyncing : err === 'reauthorize' ? T.gcalReauth : err ? T.gcalError : T.gcalConnected + (status.lastSyncAt ? ' · ' + T.gcalSynced + fmtDateTimeShort(status.lastSyncAt, lang, now) : '');
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cx('flex cursor-pointer items-center gap-6 rounded-7 border px-10 py-3 font-mono text-10.5', err ? 'border-goldBd bg-heat2b text-goldInk' : 'border-okBd bg-okBg text-ok')}
      >
        <Dot color={err ? 'var(--goldInk)' : 'var(--ok)'} size={6} />{label}
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 flex w-290 flex-col gap-8 rounded-12 border border-line bg-card p-12 shadow-menu animate-fadeUpFast">
          <div className="text-12 leading-[1.5] text-mut">{T.gcalHint}</div>
          <div className="flex gap-6">
            {err === 'reauthorize'
              ? <button type="button" onClick={connect} className="flex-1 cursor-pointer rounded-9 bg-acc px-10 py-6 text-12 font-semibold text-onAcc hover:bg-accHov">{T.gcalConnect}</button>
              : <button type="button" onClick={syncNow} className="flex-1 cursor-pointer rounded-9 border border-line bg-card px-10 py-6 text-12 font-semibold text-mut hover:border-acc hover:text-acc">{T.gcalSyncNow}</button>}
            <button type="button" onClick={disconnect} className="flex-1 cursor-pointer rounded-9 border border-line bg-card px-10 py-6 text-12 font-semibold text-mut2 hover:border-hi hover:text-hi">{T.gcalDisconnect}</button>
          </div>
        </div>
      )}
    </div>
  );
}
