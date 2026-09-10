import { Pressable, Text, View } from 'react-native';
import { type HistoryEntry, type Task, fmtDate, historyByDay, historyText, historyTime, phrases, resolveColor, startOfDay } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Btn, Dot, EmptyLine } from '../components/ui';
import { IcChevronLeft, IcChevronRightSm } from '../components/Icons';

function lastEntry(t: Task): HistoryEntry | null {
  const h = t.history ?? [];
  return h.length ? h.reduce((a, b) => (b.at > a.at ? b : a)) : null;
}

function dotColor(kind: HistoryEntry['kind'], t: ReturnType<typeof useTheme>['t']): string {
  switch (kind) {
    case 'created': case 'restored': return t.acc;
    case 'done': case 'reopened': return t.ok;
    case 'archived': case 'file_removed': case 'comment_removed': return t.hi;
    default: return t.lineStrong;
  }
}

function RecentList({ now }: { now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const rows = tasks
    .map(task => ({ task, last: lastEntry(task) }))
    .filter((x): x is { task: Task; last: HistoryEntry } => x.last !== null)
    .sort((a, b) => b.last.at - a.last.at);
  return (
    <View style={{ gap: 8 }}>
      <Text style={txt(11.5, { color: t.mut2, lh: 1.5 })}>{T.historyHint}</Text>
      <Text style={[kicker(9, t.mut2), { marginTop: 4 }]}>{T.hRecent}</Text>
      {rows.map(({ task, last }) => {
        const { label } = historyText(last, lang, projects);
        const when = startOfDay(last.at) === startOfDay(now) ? historyTime(last) : fmtDate(last.at, lang);
        return (
          <Pressable key={task.id} onPress={() => set({ histId: task.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={txt(13.5, { w: 600, color: task.status === 'archived' ? t.mut : t.ink })}>{task.title}</Text>
              <Text numberOfLines={1} style={[txt(10, { mono: true, color: t.mut2 }), { marginTop: 2 }]}>{label} · {when}</Text>
            </View>
            <IcChevronRightSm size={12} color={t.mut2} />
          </Pressable>
        );
      })}
      {rows.length === 0 && <EmptyLine size={13}>{T.noHistory}</EmptyLine>}
    </View>
  );
}

function Timeline({ task, now }: { task: Task; now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const p = projects.find(x => x.id === task.proj);
  const groups = historyByDay(task.history ?? []);
  return (
    <View style={{ gap: 12 }}>
      <Pressable onPress={() => set({ histId: null })} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
        <IcChevronLeft size={12} color={t.mut} />
        <Text style={txt(12, { w: 600, color: t.mut })}>{T.hAllTasks}</Text>
      </Pressable>
      <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 15, gap: 8 }}>
        <Text style={txt(17, { w: 500, color: t.ink, lh: 1.3, ls: -0.2 })}>{task.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {p && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Dot color={resolveColor(p.color, t)} /><Text style={txt(11, { color: t.mut })}>{p.name}</Text></View>}
          <Text style={txt(10, { mono: true, color: t.mut2 })}>{phrases.changesN((task.history ?? []).length, lang)}</Text>
          <Text style={txt(10, { mono: true, color: t.mut2 })}>{T.created} {fmtDate(task.created, lang)}</Text>
        </View>
        <Btn variant="card" color={t.ink} label={T.hOpenTask} size={12} pad={9} onPress={() => set({ mSel: task.id })} />
      </View>
      {groups.map(g => (
        <View key={g.day} style={{ gap: 4 }}>
          <Text style={kicker(9, t.mut2)}>{startOfDay(now) === g.day ? T.today : fmtDate(g.day, lang)}</Text>
          <View style={{ marginLeft: 46, borderLeftWidth: 1, borderLeftColor: t.line, paddingLeft: 14 }}>
            {g.entries.map(e => {
              const { label, detail } = historyText(e, lang, projects);
              return (
                <View key={e.id} style={{ paddingVertical: 6 }}>
                  <View style={{ position: 'absolute', left: -19, top: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor(e.kind, t) }} />
                  <Text style={[txt(10, { mono: true, color: t.mut2 }), { position: 'absolute', left: -62, top: 8, width: 40, textAlign: 'right' }]}>{historyTime(e)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={txt(13, { w: 600, color: t.ink })}>{label}</Text>
                    {e.source && e.kind !== 'created' && <Text style={[kicker(8, t.mut2), { borderWidth: 1, borderColor: t.line, borderRadius: 7, paddingHorizontal: 5 }]}>{e.source}</Text>}
                  </View>
                  {detail ? <Text style={txt(12, { color: t.mut, lh: 1.4 })}>{detail}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>
      ))}
      {groups.length === 0 && <EmptyLine size={13}>{T.noHistory}</EmptyLine>}
    </View>
  );
}

export function HistoryScreen({ now }: { now: number }) {
  const histId = useStore(s => s.histId);
  const task = useStore(s => (s.histId ? s.tasks.find(x => x.id === s.histId) ?? null : null));
  return histId && task ? <Timeline task={task} now={now} /> : <RecentList now={now} />;
}
