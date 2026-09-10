import { Pressable, Text, View } from 'react-native';
import { type Task, dueLabel, dueTone, idleDays, isSnoozed, isStale, recurLabel, resolveColor, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { Dot } from './ui';
import { IcComment, IcPaperclip } from './Icons';

export function IdleBadge({ task, now }: { task: Task; now: number }) {
  const { t } = useTheme();
  const { T } = useT();
  const idle = idleDays(task, now);
  const snz = isSnoozed(task, now);
  if (task.status === 'done' || (idle < 2 && !snz)) return null;
  const staleDays = useStore(s => s.staleDays);
  const stale = isStale(task, now, staleDays);
  return (
    <View style={{ paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6, backgroundColor: stale ? t.heat2b : t.inset }}>
      <Text style={txt(10, { mono: true, color: stale ? t.goldInk : t.mut2 })}>{snz ? T.snoozed : idle + T.idleSuf}</Text>
    </View>
  );
}

export function TaskCardM({ task, now }: { task: Task; now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const p = projects.find(x => x.id === task.proj);
  const staleDays = useStore(s => s.staleDays);
  const stale = isStale(task, now, staleDays);
  const due = dueLabel(task, lang, now);
  const open = task.status !== 'done';
  return (
    <Pressable onPress={() => set({ mSel: task.id })} style={{ position: 'relative', overflow: 'hidden', backgroundColor: t.card, borderWidth: 1, borderColor: stale ? t.goldBd : t.line, borderRadius: 14, paddingTop: 13, paddingBottom: 13, paddingLeft: 17, paddingRight: 13, gap: 7 }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t[PRIORITY_BAR_TOKEN[task.pr]] }} />
      {open && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 16 }}>
          <IdleBadge task={task} now={now} />
          <View style={{ flex: 1 }} />
          {due && <Text style={txt(10, { mono: true, color: t[dueTone(task, now)] })}>{due}</Text>}
        </View>
      )}
      <Text style={txt(14.5, { w: 500, color: t.ink, lh: 1.4 })}>{task.title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        {p && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Dot color={resolveColor(p.color, t)} /><Text style={txt(11, { color: t.mut })}>{p.name}</Text></View>}
        {task.tags.length > 0 && <Text style={txt(10, { mono: true, color: t.mut2 })}>{task.tags.map(x => '#' + x).join(' ')}</Text>}
        <View style={{ flex: 1 }} />
        {task.comments.length > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><IcComment size={9} color={t.mut2} /><Text style={txt(10, { mono: true, color: t.mut2 })}>{task.comments.length}</Text></View>}
        {task.files.length > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><IcPaperclip size={9} color={t.mut2} /><Text style={txt(10, { mono: true, color: t.mut2 })}>{task.files.length}</Text></View>}
        {task.recur && <Text style={txt(10, { mono: true, color: t.mut2 })}>↻ {recurLabel(task.recur, lang, true).toLowerCase()}</Text>}
      </View>
    </Pressable>
  );
}
