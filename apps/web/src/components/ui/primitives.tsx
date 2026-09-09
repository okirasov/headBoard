import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { cx } from '../../lib/cx';

/** Mono uppercase label. */
const KICKER_SIZE = { 9: 'text-9', 9.5: 'text-9.5', 10: 'text-10', 10.5: 'text-10.5', 11: 'text-11' } as const;
export function Kicker({ children, className, size = 9.5, spacing = 'kicker' }: { children: ReactNode; className?: string; size?: keyof typeof KICKER_SIZE; spacing?: 'kicker' | 'kickerWide' }) {
  return <div className={cx('font-mono uppercase text-mut2', KICKER_SIZE[size], spacing === 'kicker' ? 'tracking-kicker' : 'tracking-kickerWide', className)}>{children}</div>;
}

/** Small round colour dot; `color` is a CSS colour (token var or project colour). */
export function Dot({ color, size = 7, className }: { color: string; size?: number; className?: string }) {
  return <span className={cx('inline-block shrink-0 rounded-full', className)} style={{ width: size, height: size, background: color }} />;
}

/** Filter/segment chip: r7, mono 10.5, active = chipBg + lineStrong border. */
export function Chip({ active, children, onClick, className }: { active?: boolean; children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'cursor-pointer rounded-7 border px-9 py-4 font-mono text-10.5 font-medium leading-normal',
        active ? 'border-lineStrong bg-chipBg text-chipInk' : 'border-line bg-card text-mut',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Two- or three-way segmented control; active cell = ink/onInk. */
export function Segmented<T extends string>({ value, options, onChange, size = 'sm' }: { value: T; options: Array<{ v: T; label: string }>; onChange: (v: T) => void; size?: 'sm' | 'lg' }) {
  return (
    <div className={cx('flex overflow-hidden border border-line', size === 'sm' ? 'rounded-9' : 'rounded-11')}>
      {options.map(o => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cx(
            'flex-1 cursor-pointer text-center font-mono font-semibold',
            size === 'sm' ? 'py-7 text-10.5' : 'py-13 text-12',
            value === o.v ? 'bg-ink text-onInk' : 'bg-card text-mut2',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type Variant = 'primary' | 'ink' | 'ok' | 'outline' | 'outlineGold' | 'ghost';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  tone?: 'default' | 'mut2';
  hoverTone?: 'acc' | 'hi' | 'ink';
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-acc text-onAcc hover:bg-accHov',
  ink: 'bg-ink text-onInk hover:bg-inkHov',
  ok: 'bg-ok text-onInk hover:bg-okHov',
  outline: 'border border-line bg-card text-mut',
  outlineGold: 'border border-goldBd bg-card text-mut',
  ghost: 'text-mut2 hover:text-ink',
};
const HOVER: Record<NonNullable<ButtonProps['hoverTone']>, string> = {
  acc: 'hover:border-acc hover:text-acc',
  hi: 'hover:border-hi hover:text-hi',
  ink: 'hover:border-lineStrong hover:text-ink',
};

export function Button({ variant = 'primary', tone, hoverTone, className, children, ...rest }: ButtonProps) {
  const outline = variant === 'outline' || variant === 'outlineGold';
  return (
    <button
      type="button"
      className={cx('inline-flex cursor-pointer items-center justify-center gap-7 font-semibold leading-normal', VARIANT[variant], tone === 'mut2' && 'text-mut2', outline && hoverTone && HOVER[hoverTone], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Square bordered icon button (close, nav arrows). */
export function IconButton({ size = 26, radius = 8, className, style, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: number; radius?: number; style?: CSSProperties }) {
  return (
    <button
      type="button"
      className={cx('flex shrink-0 cursor-pointer items-center justify-center border border-line bg-card text-mut hover:border-lineStrong hover:text-ink', className)}
      style={{ width: size, height: size, borderRadius: radius, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Clickable overlay backdrop. */
export function Scrim({ onClick, tone = 'soft' }: { onClick: () => void; tone?: 'soft' | 'strong' | 'drawer' }) {
  const bg = tone === 'strong' ? 'bg-scrim' : tone === 'drawer' ? 'bg-scrimDrawer' : 'bg-scrimSoft';
  return <div className={cx('absolute inset-0', bg)} onClick={onClick} />;
}

/** Italic muted empty-state line. */
export function Empty({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('font-sans italic text-mut2', className)}>{children}</div>;
}
