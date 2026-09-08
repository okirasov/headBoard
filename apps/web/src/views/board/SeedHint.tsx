import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { Button } from '../../components/ui/primitives';

/** Development helper: loads the prototype's sample dataset into an empty board. Not compiled into production. */
export function SeedHint() {
  const { T } = useT();
  const loadSeed = useStore(s => s.loadSeed);
  if (!import.meta.env.DEV) return null;
  return (
    <div className="mb-12 flex items-center gap-10 rounded-12 border border-dashed border-lineStrong px-14 py-9 text-12.5 text-mut2">
      <span className="flex-1">dev</span>
      <Button
        variant="outline"
        hoverTone="acc"
        className="rounded-9 px-12 py-6 text-12"
        onClick={async () => { const { buildSeed } = await import('../../store/devSeed'); const s = buildSeed(); loadSeed(s.tasks, s.projects, s.projFiles); }}
      >
        {T.seedDemo}
      </Button>
    </div>
  );
}
