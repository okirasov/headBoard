import { Text, View } from 'react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { txt } from '../theme/type';

export function Snack() {
  const { t } = useTheme();
  const snack = useStore(s => s.snack);
  if (!snack) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 118, alignItems: 'center' }}>
      <View style={{ backgroundColor: t.ink, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 7 }}>
        <Text style={txt(12.5, { w: 500, color: t.onInk })}>{snack}</Text>
      </View>
    </View>
  );
}
