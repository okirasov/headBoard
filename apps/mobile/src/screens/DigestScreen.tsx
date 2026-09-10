import { Pressable, Text, View } from 'react-native';
import { type Task, cannedDigest, digestStats, digestStatsLine, dueDiff, fmtDateTimeShort, idleDays, resolveColor } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { api } from '../lib/api';
import { txt } from '../theme/type';
import { Card, Dot, EmptyLine, SectionTitle, Btn } from '../components/ui';
import { IcSpark } from '../components/Icons';

export function Row({ task, chip, chipColor, gold }: { task: Task; chip: string; chipColor: string; gold?: boolean }) {
  const { t } = useTheme();
  const projects = useStore(s => s.projects);
  const set = useStore(s => s.set);
  const p = projects.find(x => x.id === task.proj);
  return (
    <Pressable onPress={() => set({ mSel: task.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: gold ? t.rowLineGold : t.rowLine }}>
      <Dot color={p ? resolveColor(p.color, t) : t.mut2} />
      <Text style={[txt(13, { w: 500, color: t.ink }), { flex: 1 }]}>{task.title}</Text>
      <Text style={txt(10, { mono: true, color: chipColor })}>{chip}</Text>
    </Pressable>
  );
}

export function DigestScreen({ now }: { now: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const digestText = useStore(s => s.digestText);
  const digestAt = useStore(s => s.digestAt);
  const digestBusy = useStore(s => s.digestBusy);
  const digestSeed = useStore(s => s.digestSeed);
  const set = useStore(s => s.set);
  const staleDays = useStore(s => s.staleDays);
  const stats = digestStats(tasks, now, staleDays);
  const regen = async () => {
    if (digestBusy) return;
    set({ digestBusy: true });
    let text: string | null = null;
    if (api) { try { text = (await api.ai.digest(stats, lang)).text.trim() || null; } catch { text = null; } }
    if (!text) text = cannedDigest(digestSeed + 1, stats, lang);
    set({ digestText: text, digestAt: Date.now(), digestSeed: digestSeed + 1, digestBusy: false });
  };
  return (
    <View style={{ gap: 10 }}>
      <Card pad={16}>
        <Text style={[txt(9.5, { mono: true, upper: true, ls: 0.8, color: t.mut2 }), { marginBottom: 9 }]}>{digestStatsLine(stats, lang)}</Text>
        <Text style={txt(16, { color: t.ink, lh: 1.55 })}>{digestText ?? cannedDigest(0, stats, lang)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Btn variant="outline" color={t.acc} label={digestBusy ? T.thinking : T.regen} size={12} pad={8} radius={9} style={{ paddingHorizontal: 13 }} icon={<IcSpark size={11} color={t.acc} />} onPress={() => void regen()} />
          {digestAt ? <Text style={txt(9.5, { mono: true, color: t.mut2 })}>{T.digestUpdated + fmtDateTimeShort(digestAt, lang, now)}</Text> : null}
        </View>
      </Card>
      <Card style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <SectionTitle>{T.dueToday}</SectionTitle>
        {stats.due.map(x => <Row key={x.id} task={x} chip={(dueDiff(x, now) as number) < 0 ? T.overdue : T.today} chipColor={(dueDiff(x, now) as number) < 0 ? t.hi : t.acc} />)}
        {stats.due.length === 0 && <EmptyLine size={12.5}>{T.nothingDue}</EmptyLine>}
      </Card>
      <Card gold style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <SectionTitle gold>{T.dustyPicks}</SectionTitle>
        {stats.stale.slice(0, 3).map(x => <Row key={x.id} task={x} chip={idleDays(x, now) + T.idleSuf} chipColor={t.goldInk} gold />)}
      </Card>
    </View>
  );
}
