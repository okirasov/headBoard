import { Pressable, Text, View } from 'react-native';
import { digestStats, fmtDate, idleDays } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { Btn, EmptyLine } from '../components/ui';

export function ReviewScreen({ now }: { now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const keep = useStore(s => s.keep);
  const archive = useStore(s => s.archive);
  const openSnooze = useStore(s => s.openSnooze);
  const staleDays = useStore(s => s.staleDays);
  const stale = digestStats(tasks, now, staleDays).stale;
  return (
    <View style={{ gap: 9 }}>
      {stale.map(task => {
        const p = projects.find(x => x.id === task.proj);
        const sub = (p ? p.name : T.noProject) + (task.tags.length ? ' · ' + task.tags.map(x => '#' + x).join(' ') : '') + ' · ' + T.lastT + fmtDate(task.touched, lang);
        return (
          <View key={task.id} style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.goldBd, borderRadius: 14, padding: 13 }}>
            <Pressable onPress={() => set({ mSel: task.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <View style={{ width: 46, alignItems: 'center' }}>
                <Text style={[txt(18, { mono: true, w: 600, color: t.goldInk }), { lineHeight: 18 }]}>{idleDays(task, now)}</Text>
                <Text style={[txt(8, { mono: true, upper: true, ls: 0.8, color: t.goldFaint }), { marginTop: 2 }]}>{T.daysShort}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={txt(13.5, { w: 600, color: t.ink, lh: 1.3 })}>{task.title}</Text>
                <Text style={[txt(10.5, { color: t.mut2 }), { marginTop: 2 }]}>{sub}</Text>
              </View>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
              <Btn label={T.keep} size={11.5} pad={8} radius={9} style={{ flex: 1 }} onPress={() => keep(task.id)} />
              <Btn label={T.snoozeDots} variant="outlineGold" size={11.5} pad={8} radius={9} style={{ flex: 1 }} onPress={() => openSnooze(task.id)} />
              <Btn label={T.archive} variant="outlineGold" color={t.mut2} size={11.5} pad={8} radius={9} style={{ flex: 1 }} onPress={() => archive(task.id)} />
            </View>
          </View>
        );
      })}
      {stale.length === 0 && <EmptyLine>{T.noDust}</EmptyLine>}
    </View>
  );
}
