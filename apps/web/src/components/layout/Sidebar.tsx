import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { useNow } from '../../lib/useNow';
import { archived, digestStats } from '@headboard/core';
import { Logo } from '../brand/Logo';
import { Kicker } from '../ui/primitives';
import { IcArchive, IcBoard, IcCalendar, IcDigest, IcReview, IcStats } from '../ui/Icons';
import { NavItem } from './NavItem';
import { ProjectList } from './ProjectList';
import { ProfileBlock, SyncStatus } from './ProfileMenu';

export function Sidebar() {
  const { T } = useT();
  const view = useStore(s => s.view);
  const tasks = useStore(s => s.tasks);
  const set = useStore(s => s.set);
  const now = useNow();
  const staleN = digestStats(tasks, now).staleN;
  const archivedN = archived(tasks).length;
  return (
    <aside className="flex w-234 shrink-0 flex-col border-r border-line bg-panel px-12 pb-16 pt-20">
      <div className="px-10">
        <Logo size="sidebar" surface="panel" />
        <Kicker spacing="kickerWide" className="mt-5">{T.tagline}</Kicker>
      </div>
      <nav className="mt-22 flex flex-col gap-2">
        <NavItem active={view === 'board'} icon={<IcBoard size={15} />} label={T.board} onClick={() => set({ view: 'board' })} />
        <NavItem active={view === 'review'} icon={<IcReview size={15} />} label={T.resurface} badge={staleN} onClick={() => set({ view: 'review' })} />
        <NavItem active={view === 'digest'} icon={<IcDigest size={15} />} label={T.digest} onClick={() => set({ view: 'digest' })} />
        <NavItem active={view === 'calendar'} icon={<IcCalendar size={15} />} label={T.calendar} onClick={() => set({ view: 'calendar' })} />
        <NavItem active={view === 'stats'} icon={<IcStats size={15} />} label={T.statsTitle} onClick={() => set({ view: 'stats' })} />
        <NavItem active={view === 'archive'} icon={<IcArchive size={15} />} label={T.archiveTitle} count={archivedN} onClick={() => set({ view: 'archive' })} />
      </nav>
      <ProjectList />
      <div className="flex-1" />
      <ProfileBlock />
      <SyncStatus />
    </aside>
  );
}
