import { Image, Modal, Pressable, Text, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { useStore } from '../store/useStore';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { IcX } from './Icons';

// Always-dark overlay in both themes (README §iOS "Просмотр файла").
const OVERLAY = 'rgba(32,29,23,0.9)', INK = '#F2EDE4', LINE = 'rgba(245,242,234,0.3)', DASH = 'rgba(245,242,234,0.28)', BADGE = 'rgba(245,242,234,0.12)', SUB = 'rgba(245,242,234,0.7)';

export function FilePreviewM() {
  const { T } = useT();
  const pv = useStore(s => s.mPv);
  const set = useStore(s => s.set);
  const close = () => set({ mPv: null });
  return (
    <Modal visible={!!pv} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      {pv && (
        <View style={{ flex: 1, backgroundColor: OVERLAY, paddingTop: 52, paddingHorizontal: 14, paddingBottom: 30, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Text numberOfLines={1} style={[txt(12.5, { w: 600, color: INK }), { flex: 1 }]}>{pv.name}</Text>
            {pv.src && (
              <Pressable onPress={() => Sharing.shareAsync(pv.src as string).catch(() => undefined)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: LINE }}>
                <Text style={txt(11.5, { w: 600, color: INK })}>{T.dl}</Text>
              </Pressable>
            )}
            <Pressable onPress={close} style={{ width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' }}><IcX size={11} color={INK} /></Pressable>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {pv.src ? (
              <Image source={{ uri: pv.src }} resizeMode="contain" style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            ) : (
              <View style={{ width: '100%', borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: DASH, alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 34, paddingHorizontal: 20 }}>
                <View style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 7, backgroundColor: BADGE }}><Text style={txt(11, { mono: true, w: 600, color: INK, ls: 1.4 })}>{pv.extL}</Text></View>
                <Text style={txt(16, { italic: true, color: INK })}>{T.pvNA}</Text>
                <Text style={[txt(11.5, { color: SUB, lh: 1.5 }), { textAlign: 'center' }]}>{T.pvNAsub}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </Modal>
  );
}
