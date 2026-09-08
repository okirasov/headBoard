import { useStore } from '../../store/useStore';

export function Snackbar() {
  const snack = useStore(s => s.snack);
  if (!snack) return null;
  return (
    <div className="absolute bottom-22 left-1/2 z-[60] -translate-x-1/2 rounded-7 bg-ink px-18 py-9 text-12.5 font-medium leading-normal text-onInk shadow-snack animate-fadeUp">{snack}</div>
  );
}
