import { Pressable, Text, View } from 'react-native';
import { type MonthDay, buildMonthGrid, dueLabel, dueTone, live, monthLabel, resolveColor, startOfDay, weekdayLabels } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { Card, Dot, EmptyLine, SectionTitle } from '../components/ui';
import { CalendarSyncCard } from '../components/CalendarSyncCard';

function DayCell({ d, onPress }: { d: MonthDay; onPress: () => void }) {
  const { t } = useTheme();
  const heat = d.inMonth && !d.isToday && !d.isSelected && d.count > 0 && d.isFuture;
  const bg = d.isToday ? t.acc : d.isSelected ? t.sel : heat ? (d.heavy ? t.heat2 : t.heat1) : 'transparent';
  const bd = d.isSelected ? t.lineStrong : heat && d.heavy ? t.heat2bd : 'transparent';
  const num = d.isToday ? t.onAcc : d.inMonth ? t.ink : t.ghost;
  const badgeBg = d.isToday ? 'rgba(251,247,238,0.22)' : !d.isFuture ? t.inset : d.heavy ? t.heat2b : t.card;
  const badgeC = d.isToday ? t.onAcc : !d.isFuture ? t.faint : d.heavy ? t.goldInk : t.mut;
  return (
    <Pressable onPress={onPress} style={{ flex: 1, height: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: bg, borderWidth: 1, borderColor: bd }}>
      <Text style={txt(11.5, { w: 500, color: num })}>{d.n}</Text>
      <View style={{ height: 13, alignItems: 'center', justifyContent: 'center' }}>
        {d.count > 0 && <View style={{ paddingVertical: 2, paddingHorizontal: 4.5, borderRadius: 7, backgroundColor: badgeBg }}><Text style={[txt(9, { mono: true, w: 600, color: badgeC }), { lineHeight: 9 }]}>{d.count}</Text></View>}
      </View>
    </Pressable>
  );
}

export function CalendarScreen({ now }: { now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const projects = useStore(s => s.projects);
  const calSel = useStore(s => s.calSel);
  const set = useStore(s => s.set);
  const weeks = buildMonthGrid(tasks, { now, selected: calSel });
  const sched = live(tasks).filter(x => x.due !== null && x.status !== 'done').sort((a, b) => (a.due as number) - (b.due as number));
  const rows = calSel ? sched.filter(x => startOfDay(x.due as number) === calSel) : sched;
  return (
    <View style={{ gap: 10 }}>
      <CalendarSyncCard now={now} />
      <Card pad={14}>
        <Text style={[txt(15, { italic: true, color: t.ink }), { marginBottom: 9 }]}>{monthLabel(now, 0, lang)}</Text>
        <View style={{ flexDirection: 'row', gap: 3, marginBottom: 4 }}>
          {weekdayLabels(lang).map(w => <Text key={w} style={[txt(8.5, { mono: true, upper: true, ls: 0.8, color: t.mut2 }), { flex: 1, textAlign: 'center' }]}>{w}</Text>)}
        </View>
        <View style={{ gap: 3 }}>
          {weeks.map(w => (
            <View key={w.key} style={{ flexDirection: 'row', gap: 3 }}>
              {w.days.map(d => <DayCell key={d.ts} d={d} onPress={() => set({ calSel: d.isSelected ? null : d.ts })} />)}
            </View>
          ))}
        </View>
      </Card>
      <Card style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <SectionTitle>{calSel ? T.schedSel : T.sched}</SectionTitle>
        {rows.map(x => {
          const p = projects.find(pp => pp.id === x.proj);
          return (
            <Pressable key={x.id} onPress={() => set({ mSel: x.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: t.rowLine }}>
              <Text style={[txt(10, { mono: true, color: t[dueTone(x, now)] }), { width: 66 }]}>{dueLabel(x, lang, now)}</Text>
              <Dot color={p ? resolveColor(p.color, t) : t.mut2} />
              <Text style={[txt(13, { w: 500, color: t.ink }), { flex: 1 }]}>{x.title}</Text>
            </Pressable>
          );
        })}
        {rows.length === 0 && <EmptyLine size={12.5}>{T.nothingSched}</EmptyLine>}
      </Card>
    </View>
  );
}
