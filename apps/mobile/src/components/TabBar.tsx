import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { View as ViewKey } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { txt } from '../theme/type';
import { IcBoard, IcCalendar, IcDigest, IcPlus, IcReview } from './Icons';

export function TabBar({ reviewBadge }: { reviewBadge: number }) {
  const { t } = useTheme();
  const { T } = useT();
  const insets = useSafeAreaInsets();
  const mView = useStore(s => s.mView);
  const set = useStore(s => s.set);
  const Tab = ({ k, label, Icon }: { k: ViewKey; label: string; Icon: typeof IcBoard }) => {
    const c = mView === k ? t.acc : t.mut2;
    return (
      <Pressable onPress={() => set({ mView: k })} style={{ flex: 1, alignItems: 'center', gap: 4, paddingTop: 4, position: 'relative' }}>
        <Icon size={19} color={c} />
        <Text style={txt(10, { w: 600, color: c })}>{label}</Text>
        {k === 'review' && reviewBadge > 0 && (
          <View style={{ position: 'absolute', top: 0, right: 16, minWidth: 15, height: 15, borderRadius: 7, backgroundColor: t.acc, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
            <Text style={txt(9, { mono: true, w: 600, color: t.onAcc })}>{reviewBadge}</Text>
          </View>
        )}
      </Pressable>
    );
  };
  return (
    <View
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-start',
        paddingTop: 10, paddingHorizontal: 10, paddingBottom: Math.max(26, insets.bottom + 6),
        backgroundColor: t.tabBg, borderTopWidth: 1, borderTopColor: t.lineStrong,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: -8 }, elevation: 16,
      }}
    >
      <Tab k="board" label={T.board} Icon={IcBoard} />
      <Tab k="review" label={T.resurface} Icon={IcReview} />
      <Pressable
        onPress={() => set({ mCapOpen: true, capItems: null })}
        style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: t.acc, alignItems: 'center', justifyContent: 'center', marginTop: -14, marginHorizontal: 6, shadowColor: t.fabShadow, shadowOpacity: 1, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 10 }}
      >
        <IcPlus size={22} color={t.onAcc} />
      </Pressable>
      <Tab k="digest" label={T.digest} Icon={IcDigest} />
      <Tab k="calendar" label={T.calendar} Icon={IcCalendar} />
    </View>
  );
}
