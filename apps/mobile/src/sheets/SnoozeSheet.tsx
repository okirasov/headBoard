import { Pressable, Text, View } from 'react-native';
import { buildSnoozeGrid, monthLabel, snoozePresets, snoozePresetLabel, weekdayLabels } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { useNow } from '../lib/useNow';
import { txt } from '../theme/type';
import { Sheet } from '../components/Sheet';
import { Chip } from '../components/ui';
import { IcChevronLeft, IcChevronRight } from '../components/Icons';

export function SnoozeSheet() {
  const { t } = useTheme();
  const { T, lang } = useT();
  const now = useNow();
  const zTask = useStore(s => s.zTask);
  const zMonth = useStore(s => s.zMonth);
  const set = useStore(s => s.set);
  const snooze = useStore(s => s.snooze);
  const closeSnooze = useStore(s => s.closeSnooze);
  const weeks = buildSnoozeGrid({ now, monthOffset: zMonth });
  const pick = (ts: number) => { if (zTask) snooze(zTask, ts); };
  return (
    <Sheet open={!!zTask} onClose={closeSnooze} gap={11}>
      <Text style={txt(19, { w: 500, color: t.ink, ls: -0.2 })}>{T.zTitle}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
        {snoozePresets(now).map(p => <Chip key={p.key} mono label={snoozePresetLabel(p.key, lang)} onPress={() => pick(p.ts)} />)}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => set({ zMonth: Math.max(0, zMonth - 1) })} style={{ width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}><IcChevronLeft size={12} color={t.mut} /></Pressable>
        <Text style={[txt(13.5, { w: 600, color: t.ink }), { flex: 1, textAlign: 'center' }]}>{monthLabel(now, zMonth, lang)}</Text>
        <Pressable onPress={() => set({ zMonth: Math.min(11, zMonth + 1) })} style={{ width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}><IcChevronRight size={12} color={t.mut} /></Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {weekdayLabels(lang).map(w => <Text key={w} style={[txt(8.5, { mono: true, upper: true, ls: 0.8, color: t.mut2 }), { flex: 1, textAlign: 'center' }]}>{w}</Text>)}
      </View>
      <View style={{ gap: 2 }}>
        {weeks.map(w => (
          <View key={w.key} style={{ flexDirection: 'row', gap: 2 }}>
            {w.days.map(d => (
              <Pressable key={d.ts} disabled={d.disabled} onPress={() => pick(d.ts)} style={{ flex: 1, height: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: d.isToday ? t.sel : 'transparent' }}>
                <Text style={txt(13, { w: 500, color: d.disabled ? t.ghost : d.inMonth ? t.ink : t.faint })}>{d.n}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </Sheet>
  );
}
