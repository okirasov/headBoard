import { backupFilename, exportBackup } from '@headboard/core';
import { useStore } from '../store/useStore';

/** Download the current data as a JSON file (browser save dialog). */
export function downloadBackup(): void {
  const s = useStore.getState();
  const now = Date.now();
  const json = JSON.stringify(exportBackup({ tasks: s.tasks, projects: s.projects, templates: s.templates }, now), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFilename(now);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Open a file picker and merge the chosen backup into the store. Resolves to false when nothing was imported. */
export function pickAndImportBackup(): Promise<boolean> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) { resolve(false); return; }
      const text = await f.text();
      resolve(useStore.getState().importBackup(text) !== null);
    };
    input.click();
  });
}
