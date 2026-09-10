import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ColumnKey, type Priority, phrases, priorityLabel, statusLabel, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { IcArchive, IcCheck, IcX } from './Icons';

const MOVE_TO: ColumnKey[] = ['inbox', 'focus', 'waiting'];

/** Action bar above the tab bar while cards are multi-selected (long-press a card to start). */
export function BulkBarM() {
  const { t } = useTheme();
  const { T, lang } = useT();
  const insets = useSafeAreaInsets();
  const selected = useStore(s => s.selected);
  const clearSelection = useStore(s => s.clearSelection);
  const bulkMove = useStore(s => s.bulkMove);
  const bulkDone = useStore(s => s.bulkDone);
  const bulkArchive = useStore(s => s.bulkArchive);
  const bulkPriority = useStore(s => s.bulkPriority);
  if (selected.length === 0) return null;
  const pill = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: t.onInk + '40' };
  return (
    <View style={{ position: 'absolute', left: 12, right: 12, bottom: Math.max(84, insets.bottom + 72), backgroundColor: t.ink, borderRadius: 12, paddingVertical: 9, paddingLeft: 14, paddingRight: 8, gap: 8, shadowColor: 'rgb(32,29,23)', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={txt(10.5, { mono: true, upper: true, ls: 0.8, color: t.onInk })}>{phrases.selectedN(selected.length, lang)}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={clearSelection} hitSlop={8} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}><IcX size={12} color={t.onInk} /></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center', paddingRight: 6 }}>
        <Pressable onPress={bulkDone} style={pill}><IcCheck size={11} color={t.onInk} /><Text style={txt(12, { w: 600, color: t.onInk })}>{T.markDone}</Text></Pressable>
        {MOVE_TO.map(c => <Pressable key={c} onPress={() => bulkMove(c)} style={pill}><Text style={txt(12, { w: 600, color: t.onInk })}>→ {statusLabel(c, lang)}</Text></Pressable>)}
        {([0, 1, 2] as Priority[]).map(pr => (
          <Pressable key={pr} onPress={() => bulkPriority(pr)} accessibilityLabel={priorityLabel(pr, lang)} style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: t.onInk + '40', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t[PRIORITY_BAR_TOKEN[pr]] }} />
          </Pressable>
        ))}
        <Pressable onPress={bulkArchive} style={pill}><IcArchive size={11} color={t.onInk} /><Text style={txt(12, { w: 600, color: t.onInk })}>{T.archive}</Text></Pressable>
      </ScrollView>
    </View>
  );
}
