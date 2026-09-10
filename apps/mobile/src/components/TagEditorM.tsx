import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { type Task, normalizeTag, suggestTags } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { IcX } from './Icons';

export function TagEditorM({ task }: { task: Task }) {
  const { t } = useTheme();
  const { T } = useT();
  const tasks = useStore(s => s.tasks);
  const setTags = useStore(s => s.setTags);
  const [draft, setDraft] = useState('');
  const [focus, setFocus] = useState(false);
  const suggestions = suggestTags(tasks, draft, task.tags);
  const add = (raw: string) => { const x = normalizeTag(raw); if (x && !task.tags.includes(x)) setTags(task.id, [...task.tags, x]); setDraft(''); };
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 }}>
        {task.tags.map(x => (
          <View key={x} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
            <Text style={txt(10.5, { mono: true, color: t.mut })}>#{x}</Text>
            <Pressable onPress={() => setTags(task.id, task.tags.filter(y => y !== x))} hitSlop={6}><IcX size={8} color={t.mut2} /></Pressable>
          </View>
        ))}
        <TextInput
          value={draft}
          onChangeText={v => { if (/[ ,]$/.test(v)) add(v); else setDraft(v); }}
          onSubmitEditing={() => add(draft)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          blurOnSubmit={false}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={T.addTagPh}
          placeholderTextColor={t.faint}
          style={[txt(10.5, { mono: true, color: t.ink }), { minWidth: 96, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7, borderWidth: 1, borderStyle: 'dashed', borderColor: focus ? t.acc : t.lineStrong }]}
        />
      </View>
      {focus && suggestions.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {suggestions.map(s => <Pressable key={s} onPress={() => add(s)} style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7, backgroundColor: t.inset }}><Text style={txt(10.5, { mono: true, color: t.mut })}>#{s}</Text></Pressable>)}
        </View>
      )}
    </View>
  );
}
