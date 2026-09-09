import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { kicker, txt } from '../theme/type';

export function Dot({ color, size = 6 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

/** 6px pulsing sync dot (2.4s). */
export function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: op }} />;
}

export function Kicker({ children, size = 9.5, style }: { children: ReactNode; size?: number; style?: StyleProp<TextStyle> }) {
  const { t } = useTheme();
  return <Text style={[kicker(size, t.mut2), style]}>{children}</Text>;
}

/** Segment / chip: r7, active chipBg + lineStrong. */
export function Chip({ active, label, count, onPress, mono }: { active?: boolean; label: string; count?: number; onPress: () => void; mono?: boolean }) {
  const { t } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: mono ? 5 : 7, paddingHorizontal: 11, borderRadius: 7, borderWidth: 1, borderColor: active ? t.lineStrong : t.line, backgroundColor: active ? t.chipBg : t.card }}>
      <Text style={mono ? txt(10.5, { mono: true, w: 500, color: active ? t.chipInk : t.mut }) : txt(12, { w: 600, color: active ? t.chipInk : t.mut })}>{label}</Text>
      {count !== undefined && <Text style={[txt(10, { mono: true, color: active ? t.chipInk : t.mut }), { opacity: 0.7 }]}>{count}</Text>}
    </Pressable>
  );
}

type Variant = 'primary' | 'ink' | 'ok' | 'outline' | 'outlineGold' | 'card';
export function Btn({ label, onPress, variant = 'primary', size = 12.5, pad = 11, radius = 10, color, style, icon }: { label: string; onPress: () => void; variant?: Variant; size?: number; pad?: number; radius?: number; color?: string; style?: StyleProp<ViewStyle>; icon?: ReactNode }) {
  const { t } = useTheme();
  const bg = { primary: t.acc, ink: t.ink, ok: t.ok, outline: t.card, outlineGold: t.card, card: t.card }[variant];
  const fg = color ?? { primary: t.onAcc, ink: t.onInk, ok: t.onInk, outline: t.mut, outlineGold: t.mut, card: t.ink }[variant];
  const bd = variant === 'outline' || variant === 'card' ? t.line : variant === 'outlineGold' ? t.goldBd : 'transparent';
  return (
    <Pressable onPress={onPress} style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: pad, borderRadius: radius, backgroundColor: bg, borderWidth: bd === 'transparent' ? 0 : 1, borderColor: bd }, style]}>
      {icon}
      <Text style={txt(size, { w: 600, color: fg })}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: Array<{ v: T; label: string }>; onChange: (v: T) => void }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: t.line, borderRadius: 11, overflow: 'hidden' }}>
      {options.map(o => (
        <Pressable key={o.v} onPress={() => onChange(o.v)} style={{ flex: 1, alignItems: 'center', paddingVertical: 13, backgroundColor: value === o.v ? t.ink : t.card }}>
          <Text style={txt(12, { mono: true, w: 600, color: value === o.v ? t.onInk : t.mut2 })}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function EmptyLine({ children, size = 14 }: { children: ReactNode; size?: number }) {
  const { t } = useTheme();
  return <Text style={[txt(size, { italic: true, color: t.mut2 }), { paddingVertical: 8, paddingHorizontal: 4 }]}>{children}</Text>;
}

export function Card({ children, gold, style, pad = 14 }: { children: ReactNode; gold?: boolean; style?: StyleProp<ViewStyle>; pad?: number }) {
  const { t } = useTheme();
  return <View style={[{ backgroundColor: t.card, borderWidth: 1, borderColor: gold ? t.goldBd : t.line, borderRadius: 16, padding: pad }, style]}>{children}</View>;
}

export function SectionTitle({ children, gold }: { children: ReactNode; gold?: boolean }) {
  const { t } = useTheme();
  return <Text style={[txt(11, { w: 600, upper: true, ls: 0.8, color: gold ? t.goldInk : t.mut }), { marginBottom: 8 }]}>{children}</Text>;
}
