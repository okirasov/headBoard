import { Text, View } from 'react-native';
import Svg, { G, Line, Path } from 'react-native-svg';
import { type Priority, fmtDate, idleBuckets, openByProject, priorityLabel, priorityMix, resolveColor, statsSummary, weeklyActivity, PRIORITY_BAR_TOKEN } from '@headboard/core';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../lib/useT';
import { kicker, txt } from '../theme/type';
import { Card, Dot, EmptyLine, SectionTitle } from '../components/ui';

function Tile({ label, value, unit, delta, deltaColor }: { label: string; value: string | number; unit?: string; delta?: string; deltaColor?: string }) {
  const { t } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: '46%', backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 3 }}>
      <Text style={kicker(9, t.mut2)}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
        <Text style={[txt(24, { mono: true, w: 600, color: t.ink }), { lineHeight: 26 }]}>{value}</Text>
        {unit ? <Text style={txt(11, { color: t.mut2 })}>{unit}</Text> : null}
      </View>
      {delta ? <Text style={txt(9.5, { mono: true, color: deltaColor ?? t.mut2 })}>{delta}</Text> : null}
    </View>
  );
}

/** Grouped bars (closed · created) per week, rounded tops, recessive grid. */
function WeekBars({ weeks, width, height = 140 }: { weeks: ReturnType<typeof weeklyActivity>; width: number; height?: number }) {
  const { t } = useTheme();
  const { T, lang } = useT();
  const max = Math.max(1, ...weeks.flatMap(w => [w.closed, w.created]));
  const padTop = 10, padBottom = 4, plotH = height - padTop - padBottom;
  const slot = width / weeks.length, inner = slot * 0.66, barW = (inner - 2) / 2;
  const bar = (x: number, v: number, color: string) => {
    const h = (v / max) * plotH; if (h <= 0) return null;
    const y = padTop + plotH - h, r = Math.min(2, barW / 2);
    return <Path d={`M${x} ${padTop + plotH} V${y + r} a${r} ${r} 0 0 1 ${r} -${r} h${barW - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} V${padTop + plotH} z`} fill={color} />;
  };
  return (
    <View>
      <Svg width={width} height={height}>
        {[0, 0.5, 1].map(f => { const y = padTop + plotH - f * plotH; return <Line key={f} x1={0} x2={width} y1={y} y2={y} stroke={t.line} strokeWidth={1} />; })}
        {weeks.map((w, i) => { const x0 = i * slot + (slot - inner) / 2; return <G key={w.start}>{bar(x0, w.closed, t.acc)}{bar(x0 + barW + 2, w.created, t.mut2)}</G>; })}
      </Svg>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {weeks.map(w => <Text key={w.start} style={[txt(8.5, { mono: true, color: w.isCurrent ? t.ink : t.mut2 }), { flex: 1, textAlign: 'center' }]}>{w.isCurrent ? T.nowLbl : fmtDate(w.start, lang)}</Text>)}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: t.acc }} /><Text style={txt(10, { mono: true, color: t.mut })}>{T.closedSeries}</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: t.mut2 }} /><Text style={txt(10, { mono: true, color: t.mut })}>{T.createdSeries}</Text></View>
      </View>
    </View>
  );
}

export function StatsScreen({ now }: { now: number }) {
  const { t, theme } = useTheme();
  const { T, lang } = useT();
  const tasks = useStore(s => s.tasks);
  const projects = useStore(s => s.projects);
  const staleDays = useStore(s => s.staleDays);
  const sum = statsSummary(tasks, now, staleDays);
  const weeks = weeklyActivity(tasks, now, 8);
  const mix = priorityMix(tasks);
  const idle = idleBuckets(tasks, now);
  const load = openByProject(tasks, projects);
  const delta = sum.closedWeek - sum.closedPrevWeek;
  const idleLabel = { fresh: T.idleFresh, warm: T.idleWarm, stale: T.idleStale, cold: T.idleCold } as const;
  const barColor = (p: Priority) => t[PRIORITY_BAR_TOKEN[p]];
  const maxIdle = Math.max(1, ...idle.map(b => b.count));
  const maxLoad = Math.max(1, ...load.map(r => r.open));
  const chartW = 402 - 28 - 28; // screen minus page and card padding

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Tile label={T.closedThisWeek} value={sum.closedWeek} delta={(delta > 0 ? '+' : '') + delta + ' ' + T.vsLastWeek} deltaColor={delta > 0 ? t.ok : delta < 0 ? t.hi : t.mut2} />
        <Tile label={T.openNow} value={sum.openN} delta={'+' + sum.createdWeek + ' ' + T.createdSeries} />
        <Tile label={T.forgottenNow} value={sum.staleN} delta={'≥ 7 ' + T.daysUnit} deltaColor={sum.staleN > 0 ? t.hi : t.mut2} />
        <Tile label={T.streakLbl} value={sum.streak} unit={T.streakUnit} />
      </View>
      {tasks.length === 0 ? <EmptyLine>{T.noStats}</EmptyLine> : (
        <>
          <Card pad={14}>
            <SectionTitle>{T.closedPerWeek}</SectionTitle>
            <WeekBars weeks={weeks} width={chartW} />
          </Card>
          <Card pad={14}>
            <SectionTitle>{T.priorityMixTitle}</SectionTitle>
            <View style={{ flexDirection: 'row', height: 16, borderRadius: 6, overflow: 'hidden', backgroundColor: t.inset, gap: 2 }}>
              {([0, 1, 2] as Priority[]).filter(p => mix.counts[p] > 0).map(p => (
                <View key={p} style={{ flex: mix.counts[p], backgroundColor: barColor(p), borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
                  {mix.counts[p] / Math.max(1, mix.total) > 0.14 && <Text style={txt(9, { mono: true, w: 600, color: p === 0 ? t.onAcc : p === 1 ? (theme === 'dark' ? t.onInk : t.goldInk) : t.ink })}>{mix.counts[p]}</Text>}
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
              {([0, 1, 2] as Priority[]).map(p => <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: barColor(p) }} /><Text style={txt(10, { mono: true, color: t.mut })}>{priorityLabel(p, lang)} <Text style={{ color: t.ink }}>{mix.counts[p]}</Text></Text></View>)}
            </View>
            <View style={{ marginTop: 14 }}><SectionTitle>{T.idleAgeTitle}</SectionTitle></View>
            <View style={{ gap: 7 }}>
              {idle.map(b => (
                <View key={b.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[txt(11.5, { color: t.ink }), { width: 54 }]}>{idleLabel[b.key]}</Text>
                  <View style={{ flex: 1, height: 9, borderRadius: 4, backgroundColor: t.inset, overflow: 'hidden' }}><View style={{ width: `${(b.count / maxIdle) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: b.key === 'stale' || b.key === 'cold' ? t.goldInk : t.ink }} /></View>
                  <Text style={[txt(10, { mono: true, color: t.mut }), { width: 22, textAlign: 'right' }]}>{b.count}</Text>
                </View>
              ))}
            </View>
          </Card>
          <Card pad={14}>
            <SectionTitle>{T.openByProjectTitle}</SectionTitle>
            <View style={{ gap: 7 }}>
              {load.map(r => (
                <View key={r.id ?? 'none'} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 118, flexDirection: 'row', alignItems: 'center', gap: 6 }}><Dot color={r.color ? resolveColor(r.color, t) : t.mut2} /><Text numberOfLines={1} style={[txt(11.5, { color: t.ink }), { flex: 1 }]}>{r.name ?? T.noProject}</Text></View>
                  <View style={{ flex: 1, height: 9, borderRadius: 4, backgroundColor: t.inset, overflow: 'hidden' }}><View style={{ width: `${(r.open / maxLoad) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: r.color ? resolveColor(r.color, t) : t.mut2 }} /></View>
                  <Text style={[txt(10, { mono: true, color: t.mut }), { width: 22, textAlign: 'right' }]}>{r.open}</Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      )}
    </View>
  );
}
