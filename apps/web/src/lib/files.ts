import type { FileRef } from '@headboard/core';

const MAX_INLINE_IMG = 15e5;

/** Turn browser File objects into FileRefs; small images are read to data URLs. */
export async function filesToRefs(list: FileList | File[]): Promise<FileRef[]> {
  const files = Array.from(list);
  return Promise.all(files.map(async f => {
    const rec: FileRef = { id: 'f' + Date.now() + Math.random().toString(36).slice(2, 6), name: f.name, size: f.size, kind: /^image\//.test(f.type) ? 'img' : 'file' };
    if (rec.kind === 'img' && f.size < MAX_INLINE_IMG) {
      const src = await new Promise<string>(res => { const rd = new FileReader(); rd.onload = () => res(String(rd.result)); rd.readAsDataURL(f); });
      return { ...rec, src };
    }
    return rec;
  }));
}
