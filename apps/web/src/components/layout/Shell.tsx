import { useStore } from '../../store/useStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BoardView } from '../../views/board/BoardView';

export function Shell() {
  const view = useStore(s => s.view);
  return (
    <div className="flex h-full min-w-[1024px] overflow-hidden bg-bg text-ink">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {view === 'board' && <BoardView />}
      </main>
    </div>
  );
}
