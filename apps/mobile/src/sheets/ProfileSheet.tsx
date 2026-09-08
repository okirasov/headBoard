import { Pressable, Text, View } from 'react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Sheet } from '../components/Sheet';
import { Segmented } from '../components/ui';

export function ProfileSheet() {
  const { t } = useTheme();
  const { T, lang } = useT();
  const open = useStore(s => s.mProfOpen);
  const user = useStore(s => s.user);
  const theme = useStore(s => s.theme);
  const set = useStore(s => s.set);
  const setLang = useStore(s => s.setLang);
  const setTheme = useStore(s => s.setTheme);
  const signOut = useStore(s => s.signOut);
  return (
    <Sheet open={open && !!user} onClose={() => set({ mProfOpen: false })} gap={15}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: t.chipBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={txt(13, { mono: true, w: 600, color: t.chipInk })}>{user?.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={txt(15, { w: 600, color: t.ink })}>{user?.name}</Text>
          <Text style={txt(10.5, { mono: true, color: t.mut2 })}>{user?.email}</Text>
        </View>
      </View>
      <View>
        <Text style={[kicker(9.5, t.mut2), { marginBottom: 7 }]}>{T.language}</Text>
        <Segmented value={lang} onChange={setLang} options={[{ v: 'en', label: 'EN' }, { v: 'ru', label: 'RU' }]} />
      </View>
      <View>
        <Text style={[kicker(9.5, t.mut2), { marginBottom: 7 }]}>{T.theme}</Text>
        <Segmented value={theme} onChange={setTheme} options={[{ v: 'light', label: T.light }, { v: 'dark', label: T.dark }]} />
      </View>
      <Pressable onPress={signOut} style={{ alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        <Text style={txt(13.5, { w: 600, color: t.hi })}>{T.signOut}</Text>
      </Pressable>
    </Sheet>
  );
}
