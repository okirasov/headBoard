import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { type TagStat, fmtDate, phrases, tagStats, unusedTags } from '@headboard/core';
import { useStore } from '../store/useStore';
import { syncTagOp } from '../store/sync';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Btn, Card, EmptyLine } from '../components/ui';

function Row({ s }: { s: TagStat }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const set = useStore(x => x.set);
  const renameTag = useStore(x => x.renameTag);
  const deleteTag = useStore(x => x.deleteTag);
  const [name, setName] = useState(s.tag);
  const [confirm, setConfirm] = useState(false);
  const commit = () => { const target = name.trim().toLowerCase().replace(/^#/, ''); if (target && target !== s.tag) { renameTag(s.tag, name); void syncTagOp({ rename: [s.tag, name] }); } else setName(s.tag); };
  return (
    <Card style={{ paddingVertical: 10, paddingHorizontal: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={txt(12, { mono: true, color: t.mut2 })}>#</Text>
        <TextInput value={name} onChangeText={setName} onBlur={commit} onSubmitEditing={commit} autoCapitalize="none" autoCorrect={false} returnKeyType="done" style={[txt(13, { mono: true, w: 600, color: t.ink }), { flex: 1, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8, backgroundColor: t.inset }]} />
        <Pressable onPress={() => set({ mView: 'board', fTag: s.tag })}><Text style={txt(10.5, { mono: true, color: t.mut2 })}>{phrases.tasksN(s.open, lang)}</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={[txt(9.5, { mono: true, color: t.faint }), { flex: 1 }]}>{s.done + s.archived > 0 ? `${s.done} ${T.doneCol} · ${s.archived} ${T.archivedBadge}` : ''}{s.lastUsed ? '  ' + T.lastUsed + fmtDate(s.lastUsed, lang) : ''}</Text>
        <Pressable onPress={() => { if (confirm) { deleteTag(s.tag); void syncTagOp({ remove: s.tag }); } else setConfirm(true); }} style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 9, borderWidth: 1, borderColor: confirm ? t.hi : t.line, backgroundColor: t.card }}>
          <Text style={txt(10.5, { w: 600, color: confirm ? t.hi : t.mut2 })}>{confirm ? T.confirmDeleteTag : T.deleteTag}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

export function TagsScreen() {
  const { t } = useTheme();
  const { T } = useT();
  const tasks = useStore(s => s.tasks);
  const deleteTag = useStore(s => s.deleteTag);
  const stats = tagStats(tasks);
  const unused = unusedTags(stats);
  const used = stats.filter(s => s.open > 0);
  return (
    <View style={{ gap: 8 }}>
      <Text style={txt(11.5, { color: t.mut2, lh: 1.5 })}>{T.tagsHint}</Text>
      {used.map(s => <Row key={s.tag} s={s} />)}
      {stats.length === 0 && <EmptyLine size={13}>{T.noTags}</EmptyLine>}
      {unused.length > 0 && (
        <View style={{ gap: 8, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[kicker(9.5, t.mut2), { flex: 1 }]}>{T.unusedTags} · {unused.length}</Text>
            <Btn variant="outline" color={t.mut2} label={T.clearUnused} size={11} pad={7} radius={9} onPress={() => unused.forEach(u => { deleteTag(u.tag); void syncTagOp({ remove: u.tag }); })} />
          </View>
          {unused.map(s => <Row key={s.tag} s={s} />)}
        </View>
      )}
    </View>
  );
}
