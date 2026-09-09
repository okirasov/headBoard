import { useStore } from '../../store/useStore';
import { useT } from '../../lib/useT';
import { filesToRefs } from '../../lib/files';
import { Dot } from '../../components/ui/primitives';
import { AttachButton, FileChip } from '../../components/files/FileChip';

export function ProjectFilesBar() {
  const { T } = useT();
  const fProj = useStore(s => s.fProj);
  const projects = useStore(s => s.projects);
  const projFiles = useStore(s => s.projFiles);
  const attachProjFiles = useStore(s => s.attachProjFiles);
  const removeProjFile = useStore(s => s.removeProjFile);
  const p = projects.find(x => x.id === fProj);
  if (!p) return null;
  const files = projFiles[p.id] ?? [];
  return (
    <div className="mb-12 flex flex-wrap items-center gap-10 rounded-12 border border-line bg-panel px-14 py-9">
      <span className="flex items-center gap-7 text-13 font-semibold leading-normal"><Dot color={p.color} size={8} />{p.name}</span>
      <span className="font-mono text-9.5 uppercase tracking-[1px] text-mut2">{T.projFilesL}</span>
      {files.map(f => <FileChip key={f.id} file={f} size="sm" onRemove={() => removeProjFile(p.id, f.id)} />)}
      <AttachButton label={T.attach} className="px-10 py-6" onFiles={async fl => attachProjFiles(p.id, await filesToRefs(fl))} />
    </div>
  );
}
