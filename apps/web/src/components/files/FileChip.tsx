import type { FileRef } from '@headboard/core';
import { sizeHuman } from '@headboard/core';
import { useStore } from '../../store/useStore';
import { IcFile, IcImage, IcX } from '../ui/Icons';
import { cx } from '../../lib/cx';

/** Attachment chip: thumbnail or icon, name, size, remove. Click opens preview. */
export function FileChip({ file, onRemove, size = 'md' }: { file: FileRef; onRemove: () => void; size?: 'sm' | 'md' }) {
  const openPreview = useStore(s => s.openPreview);
  const thumb = size === 'md' ? 30 : 26;
  return (
    <div
      onClick={() => openPreview(file)}
      className={cx('flex cursor-pointer items-center gap-6 rounded-9 border border-line bg-card hover:border-acc', size === 'md' ? 'px-8 py-5' : 'px-8 py-4')}
    >
      {file.src ? (
        <div className="rounded-6 bg-inset bg-cover bg-center" style={{ width: thumb, height: thumb, backgroundImage: `url(${file.src})` }} />
      ) : file.kind === 'img' ? (
        <IcImage size={size === 'md' ? 14 : 13} className="text-mut2" />
      ) : (
        <IcFile size={size === 'md' ? 13 : 12} className="text-mut2" />
      )}
      <span className={cx('ellipsis text-11.5 font-medium leading-normal', size === 'md' ? 'max-w-130' : 'max-w-150')}>{file.name}</span>
      {file.size ? <span className="font-mono text-9.5 text-mut2">{sizeHuman(file.size)}</span> : null}
      <span
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="flex cursor-pointer text-mut2 hover:text-hi"
        role="button"
        aria-label="remove"
      >
        <IcX size={9} />
      </span>
    </div>
  );
}

/** Dashed "+ Attach" label wrapping a hidden multiple file input. */
export function AttachButton({ label, onFiles, className }: { label: string; onFiles: (files: FileList) => void; className?: string }) {
  return (
    <label className={cx('flex cursor-pointer items-center gap-4 rounded-9 border border-dashed border-lineStrong text-11.5 font-semibold leading-normal text-mut hover:border-acc hover:text-acc', className)}>
      + {label}
      <input type="file" multiple className="hidden" onChange={e => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }} />
    </label>
  );
}
