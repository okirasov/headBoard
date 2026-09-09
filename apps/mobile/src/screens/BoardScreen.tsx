import { View } from 'react-native';
import { type ColumnKey, live, sortAutoBump, sortDone, statusLabel } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useT } from '../lib/useT';
import { Chip, EmptyLine, Btn } from '../components/ui';
import { TaskCardM } from '../components/TaskCardM';

export function BoardScreen({ now }: { now: number }) {
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const mCol = useStore(s => s.mCol);
  const set = useStore(s => s.set);
  const loadSeed = useStore(s => s.loadSeed);
  const lv = live(tasks);
  const group = (c: ColumnKey) => lv.filter(t => t.status === c);
  const cards = mCol === 'done' ? sortDone(group('done')) : sortAutoBump(group(mCol), now);
  const cols: ColumnKey[] = ['inbox', 'focus', 'waiting', 'done'];
  return (
    <View>
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
