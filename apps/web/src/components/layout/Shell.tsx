import { useStore } from '../../store/useStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BoardView } from '../../views/board/BoardView';
import { ReviewView } from '../../views/review/ReviewView';
import { DigestView } from '../../views/digest/DigestView';
import { CalendarView } from '../../views/calendar/CalendarView';
import { ArchiveView } from '../../views/archive/ArchiveView';
import { ProjectsView } from '../../views/projects/ProjectsView';
import { StatsView } from '../../views/stats/StatsView';
import { SearchView } from '../../views/search/SearchView';
import { DueView } from '../../views/due/DueView';
import { RecurringView } from '../../views/recurring/RecurringView';

export function Shell() {
  const view = useStore(s => s.view);
  return (
    <div className="flex h-full min-w-[1024px] overflow-hidden bg-bg text-ink">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {view === 'board' && <BoardView />}
        {view === 'review' && <ReviewView />}
        {view === 'digest' && <DigestView />}
        {view === 'calendar' && <CalendarView />}
        {view === 'archive' && <ArchiveView />}
        {view === 'projects' && <ProjectsView />}
        {view === 'stats' && <StatsView />}
        {view === 'search' && <SearchView />}
        {view === 'due' && <DueView />}
        {view === 'recurring' && <RecurringView />}
      </main>
    </div>
  );
}
