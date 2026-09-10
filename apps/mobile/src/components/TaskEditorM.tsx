import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { type Comment, type Task, commentTime, resolveColor } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { Chip, Dot } from './ui';
import { IcLink, IcX } from './Icons';

/** Title as a heading-sized input; commits on blur / return. */
export function TitleInputM({ task }: { task: Task }) {
  const { t } = useTheme();
  const setTitle = useStore(s => s.setTitle);
  const [v, setV] = useState(task.title);
  useEffect(() => { setV(task.title); }, [task.id, task.title]);
  const commit = () => { const x = v.trim(); if (x && x !== task.title) setTitle(task.id, x); else setV(task.title); };
  return (
    <TextInput
      value={v}
      onChangeText={setV}
      onBlur={commit}
      onSubmitEditing={commit}
      blurOnSubmit
      multiline
      maxLength={90}
      style={[txt(19, { w: 500, color: t.ink, ls: -0.2, lh: 1.3 }), { padding: 0, margin: 0 }]}
    />
  );
}

/** Project chips: "No project" + every project, current one active. */
export function ProjectChipsM({ task }: { task: Task }) {
  const { t } = useTheme();
  const { T } = useT();
  const projects = useStore(s => s.projects);
  const setProject = useStore(s => s.setProject);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
      <Text style={txt(9.5, { mono: true, upper: true, ls: 0.8, color: t.mut2 })}>{T.projectLbl}</Text>
      <Chip mono active={task.proj === null} label={T.noProject} onPress={() => setProject(task.id, null)} />
      {projects.map(p => (
        <Pressable key={p.id} onPress={() => setProject(task.id, p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 7, borderWidth: 1, borderColor: task.proj === p.id ? t.lineStrong : t.line, backgroundColor: task.proj === p.id ? t.chipBg : t.card }}>
          <Dot color={resolveColor(p.color, t)} />
          <Text style={txt(10.5, { mono: true, w: 500, color: task.proj === p.id ? t.chipInk : t.mut })}>{p.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** Note in an inset box; commits on blur. */
export function NoteInputM({ task, readOnly }: { task: Task; readOnly?: boolean }) {
  const { t } = useTheme();
  const { T } = useT();
  const setNote = useStore(s => s.setNote);
  const [v, setV] = useState(task.note);
  useEffect(() => { setV(task.note); }, [task.id, task.note]);
  if (readOnly) return task.note ? <View style={{ backgroundColor: t.inset, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 }}><Text style={txt(12.5, { color: t.mut, lh: 1.5 })}>{task.note}</Text></View> : null;
  return (
    <TextInput
      value={v}
      onChangeText={setV}
      onBlur={() => { if (v !== task.note) setNote(task.id, v); }}
      placeholder={T.notePh}
      placeholderTextColor={t.faint}
      multiline
      style={[txt(12.5, { color: t.mut, lh: 1.5 }), { backgroundColor: v ? t.inset : 'transparent', borderRadius: 10, paddingVertical: v ? 10 : 4, paddingHorizontal: v ? 12 : 2, minHeight: 24 }]}
    />
  );
}

/** Claude chat URL: input plus an open button when set. */
export function ChatLinkM({ task, readOnly }: { task: Task; readOnly?: boolean }) {
  const { t } = useTheme();
  const { T } = useT();
  const setChat = useStore(s => s.setChat);
  const [v, setV] = useState(task.chat ?? '');
  useEffect(() => { setV(task.chat ?? ''); }, [task.id, task.chat]);
  if (readOnly && !task.chat) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={txt(9.5, { mono: true, upper: true, ls: 0.8, color: t.mut2 })}>{T.claudeChat}</Text>
      {readOnly ? <Text numberOfLines={1} style={[txt(11, { mono: true, color: t.mut }), { flex: 1 }]}>{task.chat}</Text> : (
        <TextInput
          value={v}
          onChangeText={setV}
          onBlur={() => { const u = v.trim(); if (u !== (task.chat ?? '')) setChat(task.id, u || null); }}
          placeholder={T.chatPh}
          placeholderTextColor={t.faint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={[txt(11, { mono: true, color: t.mut }), { flex: 1, backgroundColor: t.inset, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 }]}
        />
      )}
      {task.chat ? (
        <Pressable onPress={() => Linking.openURL(task.chat as string)} hitSlop={6} style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' }}>
          <IcLink size={12} color={t.ink} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** One comment: tap the text to edit inline, × twice to delete. */
export function CommentRowM({ task, c, now }: { task: Task; c: Comment; now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const editComment = useStore(s => s.editComment);
  const removeComment = useStore(s => s.removeComment);
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(c.text);
  const [confirm, setConfirm] = useState(false);
  const commit = () => { const x = v.trim(); if (x && x !== c.text) editComment(task.id, c.id, x); setEditing(false); setV(x || c.text); };
  return (
    <View style={{ backgroundColor: t.inset, borderRadius: 10, paddingVertical: 7, paddingLeft: 10, paddingRight: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
      <View style={{ flex: 1 }}>
        {editing ? (
          <TextInput autoFocus value={v} onChangeText={setV} onBlur={commit} onSubmitEditing={commit} blurOnSubmit multiline style={[txt(12, { color: t.ink, lh: 1.45 }), { backgroundColor: t.card, borderRadius: 6, borderWidth: 1, borderColor: t.lineStrong, paddingVertical: 4, paddingHorizontal: 6 }]} />
        ) : (
          <Pressable onPress={() => setEditing(true)}><Text style={txt(12, { color: t.ink, lh: 1.45 })}>{c.text}</Text></Pressable>
        )}
        <Text style={[txt(9, { mono: true, color: t.mut2 }), { marginTop: 2 }]}>{commentTime(c.at, lang, now)}</Text>
      </View>
      <Pressable
        onPress={() => { if (confirm) removeComment(task.id, c.id); else { setConfirm(true); setTimeout(() => setConfirm(false), 2500); } }}
        hitSlop={6}
        style={{ minWidth: 20, height: 20, paddingHorizontal: confirm ? 6 : 0, borderRadius: 6, borderWidth: 1, borderColor: confirm ? t.hi : 'transparent', alignItems: 'center', justifyContent: 'center' }}
      >
        {confirm ? <Text style={txt(9, { mono: true, color: t.hi })}>{T.cmConfirm}</Text> : <IcX size={9} color={t.mut2} />}
      </Pressable>
    </View>
  );
}
