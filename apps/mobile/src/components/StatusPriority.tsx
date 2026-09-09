import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type ColumnKey, type Priority, COLUMN_KEYS, priorityLabel, statusLabel, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { IcChevronDown } from './Icons';

/** Select-styled status field (card, line, r10, chevron) that expands a list of the four statuses. */
export function StatusPicker({ value, onChange }: { value: ColumnKey; onChange: (v: ColumnKey) => void }) {
  const { t } = useTheme();
  const { lang } = useT();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Pressable onPress={() => setOpen(o => !o)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 10, paddingVertical: 11, paddingLeft: 12, paddingRight: 12 }}>
        <Text style={[txt(13, { w: 600, color: t.ink }), { flex: 1 }]}>{statusLabel(value, lang)}</Text>
        <IcChevronDown size={10} color={t.mut2} />
      </Pressable>
      {open && (
        <View style={{ marginTop: 4, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 10, overflow: 'hidden' }}>
          {COLUMN_KEYS.map(k => (
            <Pressable key={k} onPress={() => { setOpen(false); onChange(k); }} style={{ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: k === value ? t.sel : t.card }}>
              <Text style={txt(13, { w: k === value ? 600 : 500, color: t.ink })}>{statusLabel(k, lang)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export function PriorityDots({ value, onChange, size = 22 }: { value: Priority; onChange: (p: Priority) => void; size?: number }) {
  const { t } = useTheme();
  const { lang } = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      {([0, 1, 2] as Priority[]).map(i => {
        const sel = value === i;
        return (
          <Pressable key={i} onPress={() => onChange(i)} accessibilityLabel={priorityLabel(i, lang)} hitSlop={4}
            style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t[PRIORITY_BAR_TOKEN[i]], borderWidth: 2, borderColor: sel ? t.ink : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {sel && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: size / 2, borderWidth: 2, borderColor: t.panel }} />}
          </Pressable>
        );
      })}
    </View>
  );
}
