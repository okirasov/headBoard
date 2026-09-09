import { cx } from '../../lib/cx';

type Size = 'sidebar' | 'auth' | 'title' | 'mobile';
const SIZES: Record<Size, { mark: number; word: number; gap: number }> = {
  sidebar: { mark: 25, word: 21, gap: 7 },
  auth: { mark: 32, word: 26, gap: 8 },
  title: { mark: 34, word: 28, gap: 8 },
  mobile: { mark: 20, word: 20, gap: 6 },
};

/** The "thought-board" mark. `surface` is the local background token behind the accent dot. */
export function Mark({ size, surface }: { size: number; surface: 'panel' | 'bg' | 'card' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <circle cx="15" cy="38" r="7.5" fill="var(--ink)" />
      <circle cx="24" cy="29" r="2.6" fill="var(--ink)" />
      <rect x="25" y="3" width="19" height="19" rx="7" fill="none" stroke="var(--ink)" strokeWidth="5" />
      <circle cx="40.5" cy="18.5" r="4.4" fill={`var(--${surface})`} />
      <circle cx="40.5" cy="18.5" r="3.1" fill="var(--acc)" />
    </svg>
  );
}

export function Wordmark({ size }: { size: number }) {
  return (
    <span className="font-sans font-normal leading-none tracking-tight text-ink" style={{ fontSize: size }}>
      b<span className="text-acc">o</span>ard
    </span>
  );
}

export function Logo({ size, surface, className }: { size: Size; surface: 'panel' | 'bg' | 'card'; className?: string }) {
  const s = SIZES[size];
  return (
    <div className={cx('flex items-center', className)} style={{ gap: s.gap }}>
      <Mark size={s.mark} surface={surface} />
      <Wordmark size={s.word} />
    </div>
  );
}
