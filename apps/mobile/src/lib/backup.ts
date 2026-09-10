import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { backupFilename, exportBackup } from '@headboard/core';
import { useStore } from '../store/useStore';

/** Write the current data to a JSON file in the cache and hand it to the share sheet. */
export async function shareBackup(): Promise<void> {
  const s = useStore.getState();
  const now = Date.now();
  const json = JSON.stringify(exportBackup({ tasks: s.tasks, projects: s.projects, templates: s.templates }, now), null, 2);
  const file = new File(Paths.cache, backupFilename(now));
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
}

/** Pick a backup file and merge it into the store. Resolves to false when nothing was imported. */
export async function pickAndImportBackup(): Promise<boolean> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'public.json', 'text/plain'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets[0]) return false;
  const text = await new File(res.assets[0].uri).text();
  return useStore.getState().importBackup(text) !== null;
}
