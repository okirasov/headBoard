import { dict, type Dict, type Lang } from '@headboard/core';
import { useStore } from '../store/useStore';
export function useT(): { T: Dict; lang: Lang } {
  const lang = useStore(s => s.lang);
  return { T: dict(lang), lang };
}
