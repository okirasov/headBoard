import { Pressable, Text, View } from 'react-native';
import { signInWith } from '../lib/auth';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Logo } from '../components/Logo';

export function SignInScreen() {
  const { t } = useTheme();
  const { T } = useT();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: 96, paddingHorizontal: 22, paddingBottom: 44 }}>
      <Logo mark={32} word={26} gap={8} surface="bg" />
      <Text style={[kicker(9.5, t.mut2, 0.1), { marginTop: 6 }]}>{T.tagline}</Text>
      <Text style={[txt(20, { color: t.mut, lh: 1.5 }), { marginTop: 26 }]}>{T.authSub}</Text>
      <View style={{ flex: 1 }} />
      <View style={{ gap: 10 }}>
        <Pressable onPress={() => void signInWith('Google')} style={{ height: 52, borderRadius: 14, borderWidth: 1, borderColor: t.lineStrong, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={txt(14.5, { w: 600, color: t.ink })}>{T.google}</Text>
        </Pressable>
        <Pressable onPress={() => void signInWith('Apple')} style={{ height: 52, borderRadius: 14, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={txt(14.5, { w: 600, color: t.onInk })}>{T.apple}</Text>
        </Pressable>
      </View>
      <Text style={[txt(10.5, { mono: true, color: t.mut2, lh: 1.7, ls: 0.4 }), { marginTop: 16 }]}>{T.authNote}</Text>
    </View>
  );
}
