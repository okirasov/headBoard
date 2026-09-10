import { Pressable, Text, View } from 'react-native';
import { type Task, daysUntil, fmtDate, phrases, recurLabel, recurringTasks, resolveColor, seriesHistory, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Btn, Dot, EmptyLine } from '../components/ui';
import { IcRepeat } from '../components/Icons';
import { DueButton, RecurChips } from '../components/DueControls';

function Row({ task, now }: { task: Task; now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const tasks = useStore(s => s.tasks);
  const set = useStore(s => s.set);
  const complete = useStore(s => s.complete);
  const p = projects.find(x => x.id === task.proj);
  const d = daysUntil(task, now);
  const history = seriesHistory(tasks, task).length;
  const tone = d === null ? t.mut2 : d < 0 ? t.hi : d === 0 ? t.acc : t.ink;
  return (
    <View style={{ position: 'relative', overflow: 'hidden', backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 14, paddingVertical: 12, paddingLeft: 17, paddingRight: 13, gap: 9 }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t[PRIORITY_BAR_TOKEN[task.pr]] }} />
      <Pressable onPress={() => set({ mSel: task.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><IcRepeat size={12} color={t.mut2} /><Text numberOfLines={2} style={[txt(14, { w: 600, color: t.ink, lh: 1.3 }), { flex: 1 }]}>{task.title}</Text></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            {p && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Dot color={resolveColor(p.color, t)} /><Text style={txt(11, { color: t.mut })}>{p.name}</Text></View>}
            <Text style={txt(10, { mono: true, color: t.mut2 })}>{recurLabel(task.recur, lang)}</Text>
            {history > 0 && <Text style={txt(10, { mono: true, color: t.mut2 })}>{history} {T.historyLbl}</Text>}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={kicker(8.5, t.mut2)}>{T.nextLbl}</Text>
          <Text style={txt(12, { mono: true, w: 600, color: tone })}>{task.due !== null ? fmtDate(task.due, lang) : '—'}</Text>
          {d !== null && d !== 0 && <Text style={txt(9, { mono: true, color: t.mut2 })}>{phrases.daysRel(d, lang)}</Text>}
        </View>
      </Pressable>
      <RecurChips task={task} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <DueButton task={task} />
        <View style={{ flex: 1 }} />
        <Btn variant="ok" label={T.doneNext} size={11.5} pad={8} radius={9} onPress={() => complete(task.id)} />
      </View>
    </View>
  );
}

export function RecurringScreen({ now }: { now: number }) {
  const { t } = useTheme();
  const { T } = useT();
  const tasks = useStore(s => s.tasks);
  const rows = recurringTasks(tasks);
  return (
    <View style={{ gap: 9 }}>
      <Text style={txt(11.5, { color: t.mut2, lh: 1.5 })}>{T.recurHint}</Text>
      {rows.map(x => <Row key={x.id} task={x} now={now} />)}
      {rows.length === 0 && <EmptyLine size={13}>{T.noRecurring}</EmptyLine>}
    </View>
  );
}
