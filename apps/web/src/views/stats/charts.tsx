import { useState, type ReactNode } from 'react';
import { cx } from '../../lib/cx';

/**
 * Small hand-rolled SVG charts in the Headboard idiom: thin marks, 4px rounded data-ends, 2px surface gaps,
 * recessive grid, text in text tokens, hover tooltip on every mark. Colours are passed in as CSS values.
 */

export function ChartCard({ title, right, children, table, showTable, className }: { title: string; right?: ReactNode; children: ReactNode; table: ReactNode; showTable: boolean; className?: string }) {
  return (
    <section className={cx('flex flex-col gap-12 rounded-16 border border-line bg-card px-18 py-16', className)}>
      <div className="flex items-center gap-10">
        <div className="text-11.5 font-semibold uppercase leading-normal tracking-[1px] text-mut">{title}</div>
        <span className="flex-1" />
        {right}
      </div>
      {showTable ? table : children}
    </section>
  );
}

export function Tooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-8 border border-line bg-panel px-9 py-6 font-mono text-10.5 leading-normal text-ink shadow-menu" style={{ left: x, top: y - 8 }}>
      {children}
    </div>
  );
}

export interface GroupedBar { label: string; series: Array<{ key: string; value: number; color: string; name: string }>; emphasis?: boolean }

/** Grouped vertical bars (≤ 2 series), 2px gap between bars, hover tooltip per group. */
export function GroupedBars({ groups, height = 160, legend }: { groups: GroupedBar[]; height?: number; legend: Array<{ name: string; color: string }> }) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const max = Math.max(1, ...groups.flatMap(g => g.series.map(s => s.value)));
  const padTop = 14, padBottom = 22, w = 100, gapPct = 0.32; // width in percent units, layout via viewBox
  const slot = w / groups.length;
  const barW = (slot * (1 - gapPct)) / Math.max(1, groups[0]?.series.length ?? 1);
  const plotH = height - padTop - padBottom;
  const ticks = [0, 0.5, 1].map(f => Math.round(max * f));
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-[160px] w-full overflow-visible" style={{ height }}>
        {ticks.map(tv => {
          const y = padTop + plotH - (tv / max) * plotH;
          return <line key={tv} x1="0" x2={w} y1={y} y2={y} stroke="var(--line)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />;
        })}
        {groups.map((g, i) => {
          const x0 = i * slot + (slot * gapPct) / 2;
          return (
            <g key={g.label} onMouseEnter={e => { const r = (e.currentTarget as SVGGElement).ownerSVGElement!.getBoundingClientRect(); setHover({ i, x: ((x0 + (slot * (1 - gapPct)) / 2) / w) * r.width, y: padTop }); }} onMouseLeave={() => setHover(null)}>
              <rect x={i * slot} y="0" width={slot} height={height} fill="transparent" />
              {g.series.map((s, j) => {
                const h = (s.value / max) * plotH;
                const x = x0 + j * barW + (j ? 0.6 : 0);
                const bw = barW - (g.series.length > 1 ? 0.6 : 0);
                return (
                  <g key={s.key}>
                    {s.value > 0 && (
                      <path
                        d={`M${x} ${padTop + plotH} v-${Math.max(0, h - 1.5)} a1.5 1.5 0 0 1 1.5 -1.5 h${bw - 3} a1.5 1.5 0 0 1 1.5 1.5 v${Math.max(0, h - 1.5)} z`}
                        fill={s.color}
                        opacity={hover && hover.i !== i ? 0.55 : 1}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="mt-6 grid font-mono text-9.5 text-mut2" style={{ gridTemplateColumns: `repeat(${groups.length}, 1fr)` }}>
        {groups.map(g => <div key={g.label} className={cx('text-center', g.emphasis && 'text-ink')}>{g.label}</div>)}
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-12">
        {legend.map(l => <span key={l.name} className="flex items-center gap-5 font-mono text-10 text-mut"><span className="h-8 w-8 rounded-2" style={{ background: l.color }} />{l.name}</span>)}
      </div>
      {hover && (
        <Tooltip x={hover.x} y={hover.y}>
          <div className="text-mut2">{groups[hover.i].label}</div>
          {groups[hover.i].series.map(s => <div key={s.key} className="flex items-center gap-6"><span className="h-7 w-7 rounded-2" style={{ background: s.color }} />{s.name} <b className="font-semibold">{s.value}</b></div>)}
        </Tooltip>
      )}
    </div>
  );
}

/** One horizontal stacked bar with 2px surface gaps, direct labels on segments wide enough, legend below. */
export function StackedBar({ parts, total }: { parts: Array<{ key: string; value: number; color: string; name: string; ink?: string; inkClass?: string }>; total: number }) {
  const [hover, setHover] = useState<{ key: string; x: number } | null>(null);
  const shown = parts.filter(p => p.value > 0);
  return (
    <div className="relative">
      <div className="flex h-18 w-full gap-2 overflow-hidden rounded-6 bg-inset">
        {shown.map(p => (
          <div
            key={p.key}
            className="relative flex items-center justify-center overflow-hidden rounded-2 first:rounded-l-6 last:rounded-r-6"
            style={{ width: `${(p.value / Math.max(1, total)) * 100}%`, background: p.color, opacity: hover && hover.key !== p.key ? 0.55 : 1 }}
            onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); const pr = e.currentTarget.parentElement!.getBoundingClientRect(); setHover({ key: p.key, x: r.left - pr.left + r.width / 2 }); }}
            onMouseLeave={() => setHover(null)}
          >
            {p.value / Math.max(1, total) > 0.12 && <span className={cx('font-mono text-9.5 font-semibold', p.inkClass)} style={p.inkClass ? undefined : { color: p.ink ?? 'var(--onAcc)' }}>{p.value}</span>}
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-12">
        {parts.map(p => <span key={p.key} className="flex items-center gap-5 font-mono text-10 text-mut"><span className="h-8 w-8 rounded-2" style={{ background: p.color }} />{p.name} <span className="text-ink">{p.value}</span></span>)}
      </div>
      {hover && <Tooltip x={hover.x} y={0}>{parts.find(p => p.key === hover.key)!.name} <b className="font-semibold">{parts.find(p => p.key === hover.key)!.value}</b></Tooltip>}
    </div>
  );
}

/** Horizontal bars with a text label per row (identity by label, colour as a secondary cue). */
export function HBars({ rows, color = 'var(--ink)' }: { rows: Array<{ key: string; label: ReactNode; value: number; color?: string; hint?: string }>; color?: string }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className="flex flex-col gap-8">
      {rows.map(r => (
        <div key={r.key} className="group flex items-center gap-10" title={r.hint}>
          <div className="w-150 shrink-0 truncate text-12.5 leading-normal text-ink">{r.label}</div>
          <div className="relative h-10 flex-1 overflow-hidden rounded-4 bg-inset">
            <div className="h-full rounded-r-4 transition-[width] duration-300" style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? color }} />
          </div>
          <div className="w-28 text-right font-mono text-10.5 text-mut">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

export function StatTile({ label, value, unit, delta, tone }: { label: string; value: string | number; unit?: string; delta?: string; tone?: 'ok' | 'hi' | 'mut' }) {
  return (
    <div className="flex flex-col gap-4 rounded-14 border border-line bg-card px-16 py-14">
      <div className="font-mono text-9.5 uppercase tracking-kicker text-mut2">{label}</div>
      <div className="flex items-baseline gap-6">
        <span className="font-mono text-26 font-semibold leading-none text-ink">{value}</span>
        {unit && <span className="text-12 text-mut2">{unit}</span>}
      </div>
      {delta && <div className={cx('font-mono text-10', tone === 'ok' ? 'text-ok' : tone === 'hi' ? 'text-hi' : 'text-mut2')}>{delta}</div>}
    </div>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <table className="w-full border-collapse text-12.5">
      <thead><tr>{head.map(h => <th key={h} className="border-b border-line py-6 pr-10 text-left font-mono text-9.5 font-medium uppercase tracking-kicker text-mut2">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={cx('border-b border-rowLine py-6 pr-10', j > 0 && 'font-mono text-11 text-mut')}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}
