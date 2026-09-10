import { Pressable, Text, View } from 'react-native';
import { type DueGroupKey, type Task, daysUntil, dueGroups, fmtDate, phrases, resolveColor, undated, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Dot, EmptyLine, Segmented } from '../components/ui';
import { DueButton, RemindChips } from '../components/DueControls';

function Row({ task, now, tone }: { task: Task; now: number; tone: string }) {
  const { t } = useTheme();
  const { lang } = useT();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const p = projects.find(x => x.id === task.proj);
  const d = daysUntil(task, now);
  return (
    <View style={{ position: 'relative', overflow: 'hidden', backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 14, paddingVertical: 11, paddingLeft: 17, paddingRight: 13, gap: 8 }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t[PRIORITY_BAR_TOKEN[task.pr]] }} />
      <Pressable onPress={() => set({ mSel: task.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 62 }}>
          {task.due !== null && <Text style={txt(11.5, { mono: true, w: 600, color: tone })}>{fmtDate(task.due, lang)}</Text>}
          {d !== null && d !== 0 && <Text style={txt(9, { mono: true, color: t.mut2 })}>{phrases.daysRel(d, lang)}</Text>}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={2} style={txt(14, { w: 600, color: t.ink, lh: 1.3 })}>{task.title}</Text>
          {p && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}><Dot color={resolveColor(p.color, t)} /><Text style={txt(11, { color: t.mut })}>{p.name}</Text></View>}
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <DueButton task={task} />
        <RemindChips task={task} />
      </View>
    </View>
  );
}

export function DueScreen({ now }: { now: number }) {
  const { t } = useTheme();
  const { T } = useT();
  const tasks = useStore(s => s.tasks);
  const notifyDue = useStore(s => s.notifyDue);
  const set = useStore(s => s.set);
  const groups = dueGroups(tasks, now);
  const later = undated(tasks).slice(0, 6);
  const total = groups.reduce((n, g) => n + g.tasks.length, 0);
  const label: Record<DueGroupKey, string> = { overdue: T.gOverdue, today: T.gToday, tomorrow: T.gTomorrow, week: T.gWeek, later: T.gLater };
  const tone = (k: DueGroupKey) => (k === 'overdue' ? t.hi : k === 'today' ? t.acc : t.ink);
  return (
    <View style={{ gap: 14 }}>
      <View style={{ backgroundColor: t.panel, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 12, gap: 8 }}>
        <Text style={txt(13, { w: 600, color: t.ink })}>{T.dueNotify}</Text>
        <Text style={txt(11, { color: t.mut2, lh: 1.45 })}>{T.dueNotifyHint}</Text>
        <Segmented value={notifyDue ? 'on' : 'off'} onChange={v => set({ notifyDue: v === 'on' })} options={[{ v: 'on', label: T.notifyOn }, { v: 'off', label: T.notifyOff }]} />
      </View>
      {total === 0 && <EmptyLine size={13}>{T.noDue}</EmptyLine>}
      {groups.filter(g => g.tasks.length > 0).map(g => (
        <View key={g.key} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={kicker(9.5, g.key === 'overdue' ? t.hi : g.key === 'today' ? t.acc : t.mut2)}>{label[g.key]}</Text><Text style={txt(10, { mono: true, color: t.mut2 })}>{g.tasks.length}</Text></View>
          {g.tasks.map(x => <Row key={x.id} task={x} now={now} tone={tone(g.key)} />)}
        </View>
      ))}
      {later.length > 0 && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={kicker(9.5, t.mut2)}>{T.gUndated}</Text><Text style={txt(10, { mono: true, color: t.mut2 })}>{undated(tasks).length}</Text></View>
          {later.map(x => <Row key={x.id} task={x} now={now} tone={t.ink} />)}
        </View>
      )}
    </View>
  );
}
