import { Text, View } from 'react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Btn } from './ui';
import { IcSpark, IcTemplate } from './Icons';

/** First-run card on an empty board (mirrors web Welcome). */
export function WelcomeM() {
  const { t } = useTheme();
  const { T } = useT();
  const set = useStore(s => s.set);
  const loadSeed = useStore(s => s.loadSeed);
  const steps: Array<[string, string]> = [[T.welcome1, T.welcome1Sub], [T.welcome2, T.welcome2Sub], [T.welcome3, T.welcome3Sub]];
  return (
    <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, gap: 10, marginBottom: 12 }}>
      <Text style={kicker(9.5, t.mut2)}>{T.welcomeKicker}</Text>
      <Text style={txt(20, { w: 500, color: t.ink, lh: 1.25, ls: -0.2 })}>{T.welcomeTitle}</Text>
      <Text style={txt(12.5, { color: t.mut, lh: 1.5 })}>{T.welcomeSub}</Text>
      <View style={{ gap: 6, marginTop: 4 }}>
        {steps.map(([title, sub], i) => (
          <View key={title} style={{ flexDirection: 'row', gap: 10, backgroundColor: t.inset, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 }}>
            <Text style={txt(10.5, { mono: true, color: t.acc })}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={txt(12.5, { w: 600, color: t.ink })}>{title}</Text>
              <Text style={[txt(11.5, { color: t.mut, lh: 1.45 }), { marginTop: 2 }]}>{sub}</Text>
            </View>
          </View>
        ))}
      </View>
      <Btn label={T.welcomeCapture} icon={<IcSpark size={11} color={t.onAcc} />} onPress={() => set({ mCapOpen: true, capItems: null })} />
      <Btn variant="card" label={T.welcomeTemplates} icon={<IcTemplate size={11} color={t.ink} />} onPress={() => set({ mView: 'templates' })} />
      {__DEV__ && (
        <Btn variant="outline" color={t.mut2} label={T.seedDemo} size={11.5} pad={8} radius={9} onPress={async () => { const { buildSeed } = await import('../store/devSeed'); const s = buildSeed(); loadSeed(s.tasks, s.projects, s.projFiles); }} />
      )}
    </View>
  );
}
