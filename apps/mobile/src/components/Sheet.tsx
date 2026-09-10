import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

/** Bottom sheet: scrimSoft, panel r22 top, 40×4 handle, sheetUp .24s. */
export function Sheet({ open, onClose, children, gap = 12 }: { open: boolean; onClose: () => void; children: ReactNode; gap?: number }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (open) { anim.setValue(0); Animated.timing(anim, { toValue: 1, duration: 240, useNativeDriver: true }).start(); }
  }, [open, anim]);
  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.scrimSoft }} />
        <Animated.View
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.panel, borderTopLeftRadius: 22, borderTopRightRadius: 22,
            paddingTop: 14, paddingHorizontal: 18, paddingBottom: Math.max(34, insets.bottom + 14), maxHeight: height - Math.max(insets.top, 20) - 12,
            opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            shadowColor: 'rgb(32,29,23)', shadowOpacity: 0.2, shadowRadius: 48, shadowOffset: { width: 0, height: -16 }, elevation: 24,
          }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.lineStrong, alignSelf: 'center', marginBottom: gap }} />
          {/* Tall sheets (a task with note, files, comments and history) scroll inside instead of running under the status bar. */}
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap }}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
