import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Task, archived, fmtDate, resolveColor } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { Btn, Dot, EmptyLine } from '../components/ui';

function Row({ task, now }: { task: Task; now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const restore = useStore(s => s.restore);
  const deleteTask = useStore(s => s.deleteTask);
  const [confirm, setConfirm] = useState(false);
  const p = projects.find(x => x.id === task.proj);
  const when = task.archivedAt ?? task.touched;
  const days = Math.max(0, Math.floor((now - when) / 864e5));
  return (
    <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 13 }}>
      <Pressable onPress={() => set({ mSel: task.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <View style={{ width: 46, alignItems: 'center' }}>
          <Text style={[txt(11, { mono: true, w: 600, color: t.mut }), { lineHeight: 12 }]}>{fmtDate(when, lang)}</Text>
          <Text style={[txt(8, { mono: true, upper: true, ls: 0.8, color: t.mut2 }), { marginTop: 3 }]}>{days} {T.daysShort}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={txt(13.5, { w: 600, color: t.mut, lh: 1.3 })}>{task.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
            {p && <Dot color={resolveColor(p.color, t)} />}
            <Text style={txt(10.5, { color: t.mut2 })}>{(p ? p.name : T.noProject) + (task.tags.length ? ' · ' + task.tags.map(x => '#' + x).join(' ') : '')}</Text>
          </View>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
        <Btn variant="outline" color={t.ink} label={T.restore} size={11.5} pad={8} radius={9} style={{ flex: 1 }} onPress={() => restore(task.id)} />
        <Btn variant="outline" color={confirm ? t.hi : t.mut2} label={confirm ? T.confirmDelete : T.deleteForever} size={11.5} pad={8} radius={9} style={{ flex: 1, borderColor: confirm ? t.hi : t.line }} onPress={() => (confirm ? deleteTask(task.id) : setConfirm(true))} />
      </View>
    </View>
  );
}

export function ArchiveScreen({ now }: { now: number }) {
  const { T } = useT();
  const tasks = useStore(s => s.tasks);
  const rows = archived(tasks);
  return (
    <View style={{ gap: 9 }}>
      {rows.map(x => <Row key={x.id} task={x} now={now} />)}
      {rows.length === 0 && <EmptyLine>{T.archiveEmpty}</EmptyLine>}
    </View>
  );
}
