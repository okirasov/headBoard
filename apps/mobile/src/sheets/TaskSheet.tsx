import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { type ColumnKey, type Task, commentTime, fmtDate, resolveColor } from '@headboard/core';
import { useStore, selectSelectedTask } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { useNow } from '../lib/useNow';
import { pickFiles } from '../lib/files';
import { txt } from '../theme/type';
import { Sheet } from '../components/Sheet';
import { Btn, Dot } from '../components/ui';
import { IdleBadge } from '../components/TaskCardM';
import { PriorityDots, StatusPicker } from '../components/StatusPriority';
import { AttachButtonM, FileChipM } from '../components/FileChipM';
import { DueButton, RemindChips } from '../components/DueControls';
import { IcArchive, IcLink, IcSend } from '../components/Icons';

function Body({ task }: { task: Task }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const now = useNow();
  const projects = useStore(s => s.projects);
  const cmText = useStore(s => s.cmText);
  const set = useStore(s => s.set);
  const moveTask = useStore(s => s.moveTask);
  const setPriority = useStore(s => s.setPriority);
  const addComment = useStore(s => s.addComment);
  const attachFiles = useStore(s => s.attachFiles);
  const removeFile = useStore(s => s.removeFile);
  const toggleDone = useStore(s => s.toggleDone);
  const bump = useStore(s => s.bump);
  const openSnooze = useStore(s => s.openSnooze);
  const restore = useStore(s => s.restore);
  const deleteTask = useStore(s => s.deleteTask);
  const [confirmDel, setConfirmDel] = useState(false);
  const isArchived = task.status === 'archived';
  const p = projects.find(x => x.id === task.proj);
  const close = () => set({ mSel: null });
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <IdleBadge task={task} now={now} />
        {p && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Dot color={resolveColor(p.color, t)} /><Text style={txt(11.5, { color: t.mut })}>{p.name}</Text></View>}
      </View>
      <Text style={txt(19, { w: 500, color: t.ink, ls: -0.2, lh: 1.3 })}>{task.title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        {isArchived ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.card, borderWidth: 1, borderColor: t.goldBd, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12 }}>
            <IcArchive size={13} color={t.goldInk} />
            <Text style={txt(13, { w: 600, color: t.goldInk })}>{T.archivedBadge}</Text>
            {task.archivedAt ? <Text style={txt(10.5, { mono: true, color: t.mut2 })}>{fmtDate(task.archivedAt, lang)}</Text> : null}
          </View>
        ) : (
          <StatusPicker value={task.status as ColumnKey} onChange={v => moveTask(task.id, v)} />
        )}
        <View style={{ height: 41, justifyContent: 'center' }}><PriorityDots value={task.pr} onChange={pr => setPriority(task.id, pr)} /></View>
      </View>
      {isArchived ? (
        <View style={{ flexDirection: 'row', gap: 7 }}>
          <Btn label={T.restore} style={{ flex: 1 }} onPress={() => restore(task.id)} />
          <Btn variant="outline" color={confirmDel ? t.hi : t.mut2} label={confirmDel ? T.confirmDelete : T.deleteForever} style={{ flex: 1, borderColor: confirmDel ? t.hi : t.line }} onPress={() => (confirmDel ? deleteTask(task.id) : setConfirmDel(true))} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 7 }}>
          <Btn variant="ok" label={task.status === 'done' ? T.reopen : T.markDone} style={{ flex: 1 }} onPress={() => { toggleDone(task.id); close(); }} />
          <Btn label={T.bump} style={{ flex: 1 }} onPress={() => { bump(task.id); close(); }} />
          <Btn variant="outline" label={T.snoozeDots} style={{ flex: 1 }} onPress={() => openSnooze(task.id)} />
        </View>
      )}
      {!isArchived && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={txt(9.5, { mono: true, upper: true, ls: 0.8, color: t.mut2 })}>{T.due}</Text>
          <DueButton task={task} />
          <RemindChips task={task} />
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center', paddingBottom: 2 }}>
        {task.files.map(f => <FileChipM key={f.id} file={f} onRemove={() => removeFile(task.id, f.id)} />)}
        <AttachButtonM onPress={async () => attachFiles(task.id, await pickFiles())} />
      </ScrollView>
      {task.comments.length > 0 && (
        <ScrollView style={{ maxHeight: 120 }} contentContainerStyle={{ gap: 5 }}>
          {task.comments.map(c => (
            <View key={c.id} style={{ backgroundColor: t.inset, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10 }}>
              <Text style={txt(12, { color: t.ink, lh: 1.45 })}>{c.text}</Text>
              <Text style={[txt(9, { mono: true, color: t.mut2 }), { marginTop: 2 }]}>{commentTime(c.at, lang, now)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <TextInput
          value={cmText}
          onChangeText={v => set({ cmText: v })}
          onSubmitEditing={() => addComment(task.id, cmText)}
          placeholder={T.cmPh}
          placeholderTextColor={t.faint}
          style={[txt(12.5, { color: t.ink }), { flex: 1, backgroundColor: t.inset, borderWidth: 1, borderColor: t.line, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 }]}
        />
        <Pressable onPress={() => addComment(task.id, cmText)} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.acc, alignItems: 'center', justifyContent: 'center' }}>
          <IcSend size={14} color={t.onAcc} />
        </Pressable>
      </View>
      {task.chat && (
        <Btn variant="card" label={T.openChat} icon={<IcLink size={11} color={t.ink} />} onPress={() => Linking.openURL(task.chat as string)} />
      )}
    </>
  );
}

export function TaskSheet() {
  const task = useStore(selectSelectedTask);
  const set = useStore(s => s.set);
  return (
    <Sheet open={!!task} onClose={() => set({ mSel: null })}>
      {task && <Body task={task} />}
    </Sheet>
  );
}
