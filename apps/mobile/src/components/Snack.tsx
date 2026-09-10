import { Pressable, Text, View } from 'react-native';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';

export function Snack() {
  const { t } = useTheme();
  const { T } = useT();
  const snack = useStore(s => s.snack);
  const snackUndo = useStore(s => s.snackUndo);
  const undo = useStore(s => s.undo);
  if (!snack) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 118, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.ink, paddingVertical: 9, paddingLeft: 18, paddingRight: snackUndo ? 10 : 18, borderRadius: 7 }}>
        <Text style={txt(12.5, { w: 500, color: t.onInk })}>{snack}</Text>
        {snackUndo && (
          <Pressable onPress={undo} hitSlop={8} style={{ borderWidth: 1, borderColor: t.onInk, opacity: 0.9, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 9 }}>
            <Text style={txt(10.5, { mono: true, upper: true, ls: 0.8, color: t.onInk })}>{T.undo}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
