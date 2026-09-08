import * as DocumentPicker from 'expo-document-picker';
import type { FileRef } from '@headboard/core';

/** Let the user pick files; images keep their local uri as `src` so they can be previewed. */
export async function pickFiles(): Promise<FileRef[]> {
  const res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
  if (res.canceled) return [];
  return res.assets.map(a => {
    const img = /^image\//.test(a.mimeType ?? '');
    return { id: 'f' + Date.now() + Math.random().toString(36).slice(2, 6), name: a.name, size: a.size, kind: img ? 'img' : 'file', ...(img ? { src: a.uri } : {}) } as FileRef;
  });
}
