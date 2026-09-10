import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { type Priority, type Template, newTemplate, normalizeTags, priorityLabel, resolveColor, templatePlaceholders, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Btn, Card, Chip, Dot, EmptyLine } from '../components/ui';
import { IcTemplate } from '../components/Icons';

/** "Create task" from a template; placeholders are collected in a small inline form. */
export function UseTemplateSheetButton({ template, compact }: { template: Template; compact?: boolean }) {
  const { t } = useTheme();
  const { T } = useT();
  const useTemplate = useStore(s => s.useTemplate);
  const keys = templatePlaceholders(template);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const run = () => { useTemplate(template.id, values); setOpen(false); setValues({}); };
  return (
    <View>
      {compact
        ? <Pressable onPress={() => (keys.length ? setOpen(o => !o) : run())} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}><IcTemplate size={11} color={t.mut2} /><Text style={txt(10.5, { mono: true, color: t.mut })}>{template.name}</Text></Pressable>
        : <Btn label={T.useTemplate} size={11.5} pad={8} radius={9} icon={<IcTemplate size={12} color={t.onAcc} />} onPress={() => (keys.length ? setOpen(o => !o) : run())} />}
      {open && (
        <View style={{ marginTop: 8, gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.panel }}>
          <Text style={kicker(9, t.mut2)}>{T.fillPlaceholders}</Text>
          {keys.map(k => (
            <View key={k} style={{ gap: 3 }}>
              <Text style={txt(11, { color: t.mut })}>{k}</Text>
              <TextInput value={values[k] ?? ''} onChangeText={v => setValues(x => ({ ...x, [k]: v }))} onSubmitEditing={run} style={[txt(12.5, { color: t.ink }), { backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 9, paddingVertical: 7, paddingHorizontal: 9 }]} />
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Btn label={T.createTask} size={11.5} pad={8} radius={9} style={{ flex: 1 }} onPress={run} />
            <Btn variant="outline" color={t.mut2} label={T.discard} size={11.5} pad={8} radius={9} onPress={() => setOpen(false)} />
          </View>
        </View>
      )}
    </View>
  );
}

function Fields({ value, onChange }: { value: Template; onChange: (patch: Partial<Template>) => void }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const projects = useStore(s => s.projects);
  const input = [txt(12.5, { color: t.ink }), { backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 10 }];
  return (
    <View style={{ gap: 8 }}>
      <TextInput value={value.name} onChangeText={v => onChange({ name: v })} placeholder={T.templateName} placeholderTextColor={t.faint} style={[...input, txt(13, { w: 600, color: t.ink })]} />
      <TextInput value={value.title} onChangeText={v => onChange({ title: v })} placeholder={T.templateTitle} placeholderTextColor={t.faint} style={input} />
      <TextInput value={value.note} onChangeText={v => onChange({ note: v })} placeholder={T.templateNote} placeholderTextColor={t.faint} multiline style={[...input, { minHeight: 56, textAlignVertical: 'top' }]} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
        <Chip mono active={value.proj === null} label={T.noProject} onPress={() => onChange({ proj: null })} />
        {projects.map(p => <Chip key={p.id} mono active={value.proj === p.id} label={p.name} onPress={() => onChange({ proj: p.id })} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {([0, 1, 2] as Priority[]).map(p => (
          <Pressable key={p} onPress={() => onChange({ pr: p })} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7, borderWidth: 1, borderColor: value.pr === p ? t.lineStrong : t.line, backgroundColor: value.pr === p ? t.chipBg : t.card }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t[PRIORITY_BAR_TOKEN[p]] }} /><Text style={txt(10.5, { mono: true, color: value.pr === p ? t.chipInk : t.mut })}>{priorityLabel(p, lang)}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput value={value.tags.join(' ')} onChangeText={v => onChange({ tags: normalizeTags(v.split(/[\s,]+/)) })} placeholder="#tags" placeholderTextColor={t.faint} autoCapitalize="none" style={[...input, txt(10.5, { mono: true, color: t.ink })]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={txt(10.5, { mono: true, color: t.mut })}>{T.dueInDays}</Text>
        <TextInput value={value.dueInDays === null ? '' : String(value.dueInDays)} onChangeText={v => onChange({ dueInDays: v === '' ? null : Math.max(0, Number(v) || 0) })} keyboardType="number-pad" placeholder="—" placeholderTextColor={t.faint} style={[...input, txt(11, { mono: true, color: t.ink }), { width: 60, textAlign: 'center' }]} />
        <Text style={[txt(9.5, { mono: true, color: t.faint }), { flex: 1 }]}>{T.dueInDaysHint}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 5, opacity: value.dueInDays === null ? 0.45 : 1 }} pointerEvents={value.dueInDays === null ? 'none' : 'auto'}>
        {([null, 0, 1] as Array<0 | 1 | null>).map(r => <Chip key={String(r)} mono active={value.remindDays === r} label={r === null ? T.remindNone : r === 0 ? T.remindDay : T.remindDayBefore} onPress={() => onChange({ remindDays: r })} />)}
      </View>
    </View>
  );
}

function Row({ tpl }: { tpl: Template }) {
  const { t } = useTheme();
  const { T } = useT();
  const projects = useStore(s => s.projects);
  const updateTemplate = useStore(s => s.updateTemplate);
  const deleteTemplate = useStore(s => s.deleteTemplate);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const p = projects.find(x => x.id === tpl.proj);
  const keys = templatePlaceholders(tpl);
  return (
    <Card style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 9, position: 'relative', overflow: 'hidden', paddingLeft: 17 }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t[PRIORITY_BAR_TOKEN[tpl.pr]] }} />
      <Text style={txt(14, { w: 600, color: t.ink })}>{tpl.name}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {p && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Dot color={resolveColor(p.color, t)} /><Text style={txt(11, { color: t.mut })}>{p.name}</Text></View>}
        {tpl.tags.length > 0 && <Text style={txt(10, { mono: true, color: t.mut2 })}>{tpl.tags.map(x => '#' + x).join(' ')}</Text>}
        {tpl.dueInDays !== null && <Text style={txt(10, { mono: true, color: t.mut2 })}>{T.dueInDays} {tpl.dueInDays} {T.daysUnit}</Text>}
        {keys.length > 0 && <Text style={txt(10, { mono: true, color: t.goldInk })}>{keys.map(k => '{' + k + '}').join(' ')}</Text>}
        {tpl.usedCount > 0 && <Text style={txt(10, { mono: true, color: t.mut2 })}>{T.usedN}{tpl.usedCount}×</Text>}
      </View>
      <UseTemplateSheetButton template={tpl} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Btn variant="outline" color={t.ink} label={editing ? T.discard : T.renameTag} size={11.5} pad={8} radius={9} style={{ flex: 1 }} onPress={() => setEditing(e => !e)} />
        <Btn variant="outline" color={confirm ? t.hi : t.mut2} label={confirm ? T.confirmDeleteTemplate : T.deleteProject} size={11.5} pad={8} radius={9} style={{ flex: 1, borderColor: confirm ? t.hi : t.line }} onPress={() => (confirm ? deleteTemplate(tpl.id) : setConfirm(true))} />
      </View>
      {editing && <Fields value={tpl} onChange={patch => updateTemplate(tpl.id, patch)} />}
    </Card>
  );
}

export function TemplatesScreen() {
  const { t } = useTheme();
  const { T } = useT();
  const templates = useStore(s => s.templates);
  const addTemplate = useStore(s => s.addTemplate);
  const [draft, setDraft] = useState<Template>(() => newTemplate({ name: '' }));
  const add = () => { if (!draft.name.trim()) return; addTemplate(newTemplate({ ...draft, title: draft.title.trim() || draft.name })); setDraft(newTemplate({ name: '' })); };
  return (
    <View style={{ gap: 9 }}>
      <Text style={txt(11.5, { color: t.mut2, lh: 1.5 })}>{T.templatesHint}</Text>
      {templates.map(x => <Row key={x.id} tpl={x} />)}
      {templates.length === 0 && <EmptyLine size={13}>{T.noTemplates}</EmptyLine>}
      <View style={{ marginTop: 6, gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: t.lineStrong, backgroundColor: t.panel }}>
        <Text style={kicker(9.5, t.mut2)}>{T.newTemplate}</Text>
        <Fields value={draft} onChange={patch => setDraft(d => ({ ...d, ...patch }))} />
        <Btn label={T.newTemplate} size={12.5} pad={10} onPress={add} style={{ opacity: draft.name.trim() ? 1 : 0.5 }} />
      </View>
    </View>
  );
}
