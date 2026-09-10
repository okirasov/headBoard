import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { type Priority, type SearchHit, type Status, dueLabel, dueTone, highlight, idleDays, phrases, priorityLabel, resolveColor, searchTasks, statusLabel, tokenize, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Chip, Dot, EmptyLine } from '../components/ui';
import { IcSearch, IcX } from '../components/Icons';

const STATUSES: Array<Status | null> = [null, 'inbox', 'focus', 'waiting', 'done', 'archived'];

function Marked({ text, words, style }: { text: string; words: string[]; style: object }) {
  const { t } = useTheme();
  return <Text style={style}>{highlight(text, words).map((r, i) => (r.hit ? <Text key={i} style={{ backgroundColor: t.heat2b, color: t.ink }}>{r.text}</Text> : <Text key={i}>{r.text}</Text>))}</Text>;
}

function Row({ hit, words, now }: { hit: SearchHit; words: string[]; now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const task = hit.task;
  const p = projects.find(x => x.id === task.proj);
  const closed = task.status === 'done' || task.status === 'archived';
  const fieldLabel = { note: T.inNote, comment: T.inComment, tags: T.inTags, project: T.inProject, title: '' } as const;
  const due = dueLabel(task, lang, now);
  const idle = idleDays(task, now);
  const statusName = task.status === 'archived' ? T.sArchived : statusLabel(task.status, lang);
  return (
    <Pressable onPress={() => set({ mSel: task.id })} style={{ position: 'relative', overflow: 'hidden', backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 14, paddingVertical: 11, paddingLeft: 17, paddingRight: 13, gap: 6 }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t[PRIORITY_BAR_TOKEN[task.pr]] }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6, backgroundColor: task.status === 'archived' ? t.heat2b : task.status === 'done' ? t.okBg : t.inset }}>
          <Text style={kicker(9, task.status === 'archived' ? t.goldInk : task.status === 'done' ? t.ok : t.mut2)}>{statusName}</Text>
        </View>
        {p && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Dot color={resolveColor(p.color, t)} /><Text style={txt(11, { color: t.mut })}>{p.name}</Text></View>}
        <View style={{ flex: 1 }} />
        {due && !closed ? <Text style={txt(10, { mono: true, color: t[dueTone(task, now)] })}>{due}</Text> : null}
        {!closed && idle >= 2 ? <Text style={txt(10, { mono: true, color: t.mut2 })}>{idle}{T.idleSuf}</Text> : null}
      </View>
      <Marked text={task.title} words={words} style={txt(14.5, { w: 600, color: closed ? t.mut : t.ink, lh: 1.35 })} />
      {hit.snippet && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
          <Text style={[kicker(8.5, t.mut2), { marginTop: 3 }]}>{fieldLabel[hit.snippet.field]}</Text>
          <View style={{ flex: 1 }}><Marked text={hit.snippet.text} words={words} style={txt(12, { color: t.mut, lh: 1.45 })} /></View>
        </View>
      )}
    </Pressable>
  );
}

export function SearchScreen({ now }: { now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const projects = useStore(s => s.projects);
  const q = useStore(s => s.q);
  const set = useStore(s => s.set);
  const [status, setStatus] = useState<Status | null>(null);
  const [pr, setPr] = useState<Priority | null>(null);
  const words = tokenize(q);
  const hits = words.length ? searchTasks(tasks, projects, q, { statuses: status ? [status] : undefined, priority: pr }) : [];
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 12, paddingHorizontal: 12 }}>
        <IcSearch size={15} color={t.mut2} />
        <TextInput autoFocus value={q} onChangeText={v => set({ q: v })} placeholder={T.searchBigPh} placeholderTextColor={t.faint} returnKeyType="search" style={[txt(15, { color: t.ink }), { flex: 1, paddingVertical: 12 }]} />
        {q ? <Pressable onPress={() => set({ q: '' })} hitSlop={8}><IcX size={11} color={t.mut2} /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {STATUSES.map(s => <Chip key={String(s)} mono active={status === s} label={s === null ? T.allStatuses : s === 'archived' ? T.sArchived : statusLabel(s, lang)} onPress={() => setStatus(s)} />)}
        <View style={{ width: 1, backgroundColor: t.line, marginHorizontal: 3 }} />
        {([null, 0, 1, 2] as Array<Priority | null>).map(v => <Chip key={String(v)} mono active={pr === v} label={v === null ? T.all : priorityLabel(v, lang)} onPress={() => setPr(v)} />)}
      </ScrollView>
      {words.length > 0 && <Text style={txt(10.5, { mono: true, color: t.mut2 })}>{phrases.resultsN(hits.length, lang)}</Text>}
      <View style={{ gap: 8 }}>
        {!words.length && <EmptyLine size={13}>{T.typeToSearch}</EmptyLine>}
        {words.length > 0 && hits.length === 0 && <EmptyLine size={13}>{T.noResults}«{q.trim()}»</EmptyLine>}
        {hits.map(h => <Row key={h.task.id} hit={h} words={words} now={now} />)}
      </View>
    </View>
  );
}
