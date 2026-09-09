import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { Logo } from './Logo';
import { PulseDot } from './ui';

export function Header({ title, sub }: { title: string; sub: string }) {
  const { t } = useTheme();
  const { T } = useT();
  const insets = useSafeAreaInsets();
  const user = useStore(s => s.user);
  const set = useStore(s => s.set);
  return (
    <View style={{ paddingTop: Math.max(64, insets.top + 10), paddingHorizontal: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Logo mark={20} word={20} gap={6} surface="bg" />
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <PulseDot color={t.ok} />
          <Text style={txt(9, { mono: true, color: t.ok })}>{T.offlineM}</Text>
        </View>
        <Pressable onPress={() => set({ mProfOpen: true })} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.chipBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={txt(10.5, { mono: true, w: 600, color: t.chipInk })}>{user?.initials ?? ''}</Text>
        </Pressable>
      </View>
      <Text style={[txt(26, { w: 500, color: t.ink, ls: -0.3, lh: 1.2 }), { marginTop: 10 }]}>{title}</Text>
      <Text style={[txt(11.5, { color: t.mut2 }), { marginTop: 2 }]}>{sub}</Text>
    </View>
  );
}
