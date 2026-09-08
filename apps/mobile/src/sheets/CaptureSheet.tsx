import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { heuristicExtract, phrases, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { Sheet } from '../components/Sheet';
import { Btn } from '../components/ui';
import { IcSpark, IcX } from '../components/Icons';

export function CaptureSheet() {
  const { t } = useTheme();
  const { T, lang } = useT();
  const open = useStore(s => s.mCapOpen);
  const capText = useStore(s => s.capText);
  const capItems = useStore(s => s.capItems);
  const capBusy = useStore(s => s.capBusy);
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const addTasks = useStore(s => s.addTasks);
  const close = () => set({ mCapOpen: false, capItems: null });
  const extract = () => { const text = capText.trim(); if (!text || capBusy) return; set({ capItems: heuristicExtract(text, projects) }); };
  const items = capItems ?? [];
  return (
    <Sheet open={open} onClose={close} gap={11}>
      <Text style={txt(19, { w: 500, color: t.ink, ls: -0.2 })}>{T.capture}</Text>
      <TextInput
        multiline
        value={capText}
        onChangeText={v => set({ capText: v })}
        placeholder={T.capPhM}
        placeholderTextColor={t.faint}
        style={[txt(13, { color: t.ink, lh: 1.5 }), { height: 96, backgroundColor: t.inset, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 12, textAlignVertical: 'top' }]}
      />
      {items.length > 0 && (
        <ScrollView style={{ maxHeight: 150 }} contentContainerStyle={{ gap: 5 }}>
          {items.map((ci, i) => (
            <View key={i} style={{ position: 'relative', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 10, paddingVertical: 8, paddingLeft: 13, paddingRight: 10 }}>
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t[PRIORITY_BAR_TOKEN[ci.pr]] }} />
              <Text style={[txt(12.5, { w: 500, color: t.ink }), { flex: 1 }]}>{ci.title}</Text>
              <Pressable onPress={() => set({ capItems: items.filter((_, j) => j !== i) })} style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}><IcX size={9} color={t.mut2} /></Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={{ flexDirection: 'row', gap: 7 }}>
        <Btn label={capBusy ? T.extracting : T.extract} icon={<IcSpark size={11} color={t.onAcc} />} style={{ flex: 1 }} onPress={extract} />
        {items.length > 0 && <Btn variant="ink" label={phrases.addN(items.length, lang)} style={{ flex: 1 }} onPress={() => addTasks(items)} />}
      </View>
    </Sheet>
  );
}
