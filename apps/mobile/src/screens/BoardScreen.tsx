import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { txt } from '../theme/type';
import { IcX } from '../components/Icons';
import { type ColumnKey, live, matchesFilter, sortAutoBump, sortDone, statusLabel } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useT } from '../lib/useT';
import { Chip, EmptyLine, Btn } from '../components/ui';
import { TaskCardM } from '../components/TaskCardM';

export function BoardScreen({ now }: { now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const staleDays = useStore(s => s.staleDays);
  const fTag = useStore(s => s.fTag);
  const mCol = useStore(s => s.mCol);
  const set = useStore(s => s.set);
  const loadSeed = useStore(s => s.loadSeed);
  const lv = live(tasks).filter(x => matchesFilter(x, '', null, null, fTag));
  const group = (c: ColumnKey) => lv.filter(x => x.status === c);
  const cards = mCol === 'done' ? sortDone(group('done')) : sortAutoBump(group(mCol), now, staleDays);
  const cols: ColumnKey[] = ['inbox', 'focus', 'waiting', 'done'];
  return (
    <View>
      {fTag && (
        <Pressable onPress={() => set({ fTag: null })} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 7, borderWidth: 1, borderColor: t.lineStrong, backgroundColor: t.chipBg, marginBottom: 10 }}>
          <Text style={txt(10.5, { mono: true, w: 500, color: t.chipInk })}>#{fTag}</Text><IcX size={9} color={t.chipInk} />
        </Pressable>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {cols.map(c => <Chip key={c} active={mCol === c} label={statusLabel(c, lang)} count={group(c).length} onPress={() => set({ mCol: c })} />)}
      </View>
      {__DEV__ && tasks.length === 0 && (
        <Btn variant="outline" label={T.seedDemo} size={12} pad={9} radius={9} style={{ marginBottom: 12 }} onPress={async () => { const { buildSeed } = await import('../store/devSeed'); const s = buildSeed(); loadSeed(s.tasks, s.projects, s.projFiles); }} />
      )}
      <View style={{ gap: 9 }}>
        {cards.map(t => <TaskCardM key={t.id} task={t} now={now} />)}
        {cards.length === 0 && <EmptyLine>{T.nothingHere}</EmptyLine>}
      </View>
    </View>
  );
}
