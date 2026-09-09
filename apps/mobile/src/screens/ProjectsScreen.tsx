import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { type Project, PROJECT_PALETTE, live, nextProjectColor, phrases, resolveColor } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Btn, Card, Dot, EmptyLine } from '../components/ui';
import { IcCheck } from '../components/Icons';

function Swatches({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {PROJECT_PALETTE.map(s => {
        const sel = s.color === value;
        return (
          <Pressable key={s.key} onPress={() => onChange(s.color)} hitSlop={4} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: resolveColor(s.color, t), borderWidth: 2, borderColor: sel ? t.ink : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {sel && <IcCheck size={11} color={t.onAcc} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function Row({ p }: { p: Project }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const updateProject = useStore(s => s.updateProject);
  const deleteProject = useStore(s => s.deleteProject);
  const [name, setName] = useState(p.name);
  const [confirm, setConfirm] = useState(false);
  const open = live(tasks).filter(x => x.proj === p.id && x.status !== 'done').length;
  const commit = () => { if (name.trim() && name.trim() !== p.name) updateProject(p.id, { name }); else setName(p.name); };
  return (
    <Card style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Dot color={resolveColor(p.color, t)} size={10} />
        <TextInput value={name} onChangeText={setName} onBlur={commit} onSubmitEditing={commit} returnKeyType="done" style={[txt(14.5, { w: 600, color: t.ink }), { flex: 1, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8, backgroundColor: t.inset }]} />
        <Text style={txt(10.5, { mono: true, color: t.mut2 })}>{phrases.tasksN(open, lang)}</Text>
      </View>
      <Swatches value={p.color} onChange={c => updateProject(p.id, { color: c })} />
      <Pressable onPress={() => (confirm ? deleteProject(p.id) : setConfirm(true))} style={{ alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: confirm ? t.hi : t.line, backgroundColor: t.card }}>
        <Text style={txt(11.5, { w: 600, color: confirm ? t.hi : t.mut2 })}>{confirm ? T.confirmDeleteProject : T.deleteProject}</Text>
      </Pressable>
    </Card>
  );
}

export function ProjectsScreen() {
  const { t } = useTheme();
  const { T } = useT();
  const projects = useStore(s => s.projects);
  const addProject = useStore(s => s.addProject);
  const [name, setName] = useState('');
  const [color, setColor] = useState(() => nextProjectColor(projects));
  const add = () => { if (!name.trim()) return; addProject(name, color); setName(''); setColor(nextProjectColor([...projects, { id: '_', name: '', color }])); };
  return (
    <View style={{ gap: 9 }}>
      <Text style={txt(11.5, { color: t.mut2, lh: 1.5 })}>{T.projectsHint}</Text>
      {projects.map(p => <Row key={p.id} p={p} />)}
      {projects.length === 0 && <EmptyLine>{T.noProjects}</EmptyLine>}
      <View style={{ marginTop: 6, gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: t.lineStrong, backgroundColor: t.panel }}>
        <Text style={kicker(9.5, t.mut2)}>{T.newProject}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Dot color={resolveColor(color, t)} size={10} />
          <TextInput value={name} onChangeText={setName} onSubmitEditing={add} placeholder={T.projectNamePh} placeholderTextColor={t.faint} returnKeyType="done" style={[txt(13.5, { color: t.ink }), { flex: 1, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 }]} />
        </View>
        <Swatches value={color} onChange={setColor} />
        <Btn label={T.addProject} size={12.5} pad={10} onPress={add} style={{ opacity: name.trim() ? 1 : 0.5 }} />
      </View>
    </View>
  );
}
