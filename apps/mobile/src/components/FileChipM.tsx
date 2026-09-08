import { Image, Pressable, Text, View } from 'react-native';
import type { FileRef } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { IcFile, IcImage, IcX } from './Icons';

export function FileChipM({ file, onRemove }: { file: FileRef; onRemove: () => void }) {
  const { t } = useTheme();
  const openPreview = useStore(s => s.openPreview);
  return (
    <Pressable onPress={() => openPreview(file)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 9, paddingVertical: 5, paddingHorizontal: 8 }}>
      {file.src ? <Image source={{ uri: file.src }} style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: t.inset }} /> : file.kind === 'img' ? <IcImage size={13} color={t.mut2} /> : <IcFile size={12} color={t.mut2} />}
      <Text numberOfLines={1} style={[txt(10.5, { w: 500, color: t.ink }), { maxWidth: 90 }]}>{file.name}</Text>
      <Pressable onPress={onRemove} hitSlop={6}><IcX size={8} color={t.mut2} /></Pressable>
    </Pressable>
  );
}

export function AttachButtonM({ onPress }: { onPress: () => void }) {
  const { t } = useTheme();
  const { T } = useT();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderStyle: 'dashed', borderColor: t.lineStrong, borderRadius: 9, paddingVertical: 7, paddingHorizontal: 10 }}>
      <Text style={txt(10.5, { w: 600, color: t.mut })}>+ {T.attach}</Text>
    </Pressable>
  );
}
