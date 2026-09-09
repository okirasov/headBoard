import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export function NavItem({ active, icon, label, badge, onClick }: { active: boolean; icon: ReactNode; label: string; badge?: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('flex w-full cursor-pointer items-center gap-9 rounded-10 px-10 py-8 text-left text-13.5 font-medium leading-normal', active ? 'bg-sel text-ink' : 'text-mut')}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-7 bg-heat2b px-7 py-1 font-mono text-10.5 font-semibold text-goldInk">{badge}</span>
      )}
    </button>
  );
}
