import { Pressable, Text, View } from 'react-native';
import { type Recur, type Task, fmtDate, recurLabel, RECUR_OPTIONS } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { Chip } from './ui';

/** "Due · Sep 12" pill that opens the date sheet. */
export function DueButton({ task }: { task: Task }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const set = useStore(s => s.set);
  return (
    <Pressable onPress={() => set({ dueTask: task.id, dueMonth: 0 })} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
      <Text style={txt(10.5, { mono: true, w: 500, color: task.due === null ? t.mut : t.ink })}>{task.due === null ? T.setDue : fmtDate(task.due, lang)}</Text>
    </Pressable>
  );
}

export function RecurChips({ task }: { task: Task }) {
  const { T, lang } = useT();
  const setRecur = useStore(s => s.setRecur);
  const opts: Array<{ v: Recur; L: string }> = [{ v: null, L: T.recurNone }, ...RECUR_OPTIONS.map(r => ({ v: r as Recur, L: recurLabel(r, lang, true) }))];
  return (
    <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>
      {opts.map(o => <Chip key={String(o.v)} mono active={task.recur === o.v} label={o.L} onPress={() => setRecur(task.id, o.v)} />)}
    </View>
  );
}

export function RemindChips({ task }: { task: Task }) {
  const { T } = useT();
  const setRemind = useStore(s => s.setRemind);
  const opts: Array<{ v: 0 | 1 | null; L: string }> = [{ v: null, L: T.remindNone }, { v: 0, L: T.remindDay }, { v: 1, L: T.remindDayBefore }];
  return (
    <View style={{ flexDirection: 'row', gap: 5, opacity: task.due === null ? 0.45 : 1 }} pointerEvents={task.due === null ? 'none' : 'auto'}>
      {opts.map(o => <Chip key={String(o.v)} mono active={task.remindDays === o.v} label={o.L} onPress={() => setRemind(task.id, o.v)} />)}
    </View>
  );
}
