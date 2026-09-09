import { Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { txt } from '../theme/type';

export function Mark({ size, surface }: { size: number; surface: 'panel' | 'bg' | 'card' }) {
  const { t } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="15" cy="38" r="7.5" fill={t.ink} />
      <Circle cx="24" cy="29" r="2.6" fill={t.ink} />
      <Rect x="25" y="3" width="19" height="19" rx="7" fill="none" stroke={t.ink} strokeWidth="5" />
      <Circle cx="40.5" cy="18.5" r="4.4" fill={t[surface]} />
      <Circle cx="40.5" cy="18.5" r="3.1" fill={t.acc} />
    </Svg>
  );
}

export function Logo({ mark, word, gap, surface }: { mark: number; word: number; gap: number; surface: 'panel' | 'bg' | 'card' }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
      <Mark size={mark} surface={surface} />
      <Text style={[txt(word, { w: 400, color: t.ink, ls: -0.3 }), { lineHeight: word }]}>
        b<Text style={{ color: t.acc }}>o</Text>ard
      </Text>
    </View>
  );
}
