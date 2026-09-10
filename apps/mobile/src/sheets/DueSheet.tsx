import { Pressable, Text, View } from 'react-native';
import { buildSnoozeGrid, monthLabel, weekdayLabels } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { useNow } from '../lib/useNow';
import { txt } from '../theme/type';
import { Sheet } from '../components/Sheet';
import { Btn } from '../components/ui';
import { IcChevronLeft, IcChevronRight } from '../components/Icons';

/** Month grid for picking a due date (past days allowed), plus a Clear button. */
export function DueSheet() {
  const { t } = useTheme();
  const { T, lang } = useT();
  const now = useNow();
  const dueTask = useStore(s => s.dueTask);
  const dueMonth = useStore(s => s.dueMonth);
  const tasks = useStore(s => s.tasks);
  const set = useStore(s => s.set);
  const setDue = useStore(s => s.setDue);
  const task = tasks.find(x => x.id === dueTask);
  const weeks = buildSnoozeGrid({ now, monthOffset: dueMonth });
  const selected = task?.due ?? null;
  const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();
  return (
    <Sheet open={!!task} onClose={() => set({ dueTask: null })} gap={11}>
      <Text style={txt(19, { w: 500, color: t.ink, ls: -0.2 })}>{T.dueDateLbl}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => set({ dueMonth: Math.max(-12, dueMonth - 1) })} style={{ width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}><IcChevronLeft size={12} color={t.mut} /></Pressable>
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1, textAlign: 'center' }]}>{monthLabel(now, dueMonth, lang)}</Text>
        <Pressable onPress={() => set({ dueMonth: Math.min(12, dueMonth + 1) })} style={{ width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}><IcChevronRight size={12} color={t.mut} /></Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {weekdayLabels(lang).map(w => <Text key={w} style={[txt(8.5, { mono: true, upper: true, ls: 0.8, color: t.mut2 }), { flex: 1, textAlign: 'center' }]}>{w}</Text>)}
      </View>
      <View style={{ gap: 2 }}>
        {weeks.map(w => (
          <View key={w.key} style={{ flexDirection: 'row', gap: 2 }}>
            {w.days.map(d => {
              const sel = selected !== null && sameDay(selected, d.ts);
              return (
                <Pressable key={d.ts} onPress={() => task && setDue(task.id, d.ts + 12 * 3600_000)} style={{ flex: 1, height: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? t.acc : d.isToday ? t.sel : 'transparent' }}>
                  <Text style={txt(13, { w: 500, color: sel ? t.onAcc : d.inMonth ? t.ink : t.faint })}>{d.n}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      {task?.due !== null && task && <Btn variant="outline" color={t.mut2} label={T.clearDue} onPress={() => setDue(task.id, null)} />}
    </Sheet>
  );
}
