import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 16, ...rest }: P) => ({ width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true, ...rest });
const S = { stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IcBoard = (p: P) => (
  <svg {...base(p)}><rect x="1.5" y="2" width="3.4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="6.3" y="2" width="3.4" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="11.1" y="2" width="3.4" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg>
);
export const IcReview = (p: P) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.8V8l2.4 1.6" {...S} strokeWidth="1.5" /></svg>
);
export const IcDigest = (p: P) => (
  <svg {...base(p)}><rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5.2 5h5.6M5.2 8h5.6M5.2 11h3.2" {...S} strokeWidth="1.5" /></svg>
);
export const IcCalendar = (p: P) => (
  <svg {...base(p)}><rect x="1.8" y="2.8" width="12.4" height="11.4" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M1.8 6.4h12.4M5.3 1.2v3M10.7 1.2v3" {...S} strokeWidth="1.5" /></svg>
);
export const IcSearch = (p: P) => (
  <svg {...base(p)}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" /><path d="M11 11l3.4 3.4" {...S} strokeWidth="1.6" /></svg>
);
export const IcSpark = (p: P) => (
  <svg {...base(p)}><path d="M8 1l1.8 4.9L14.7 8l-4.9 2.1L8 15l-1.8-4.9L1.3 8l4.9-2.1z" fill="currentColor" /></svg>
);
export const IcCheck = (p: P) => (
  <svg {...base(p)}><path d="M2.5 8.5L6 12l7.5-8" {...S} strokeWidth="2" /></svg>
);
export const IcArrowUp = (p: P) => (
  <svg {...base(p)}><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" {...S} strokeWidth="2" /></svg>
);
export const IcX = (p: P) => (
  <svg {...base(p)}><path d="M3 3l10 10M13 3L3 13" {...S} strokeWidth="2" /></svg>
);
export const IcChevronUp = (p: P) => (
  <svg {...base(p)}><path d="M4 10L8 6l4 4" {...S} strokeWidth="1.8" /></svg>
);
export const IcChevronDown = (p: P) => (
  <svg {...base(p)}><path d="M4 6.5L8 10.5l4-4" {...S} strokeWidth="1.8" /></svg>
);
export const IcChevronLeft = (p: P) => (
  <svg {...base(p)}><path d="M10 2.5L4.5 8l5.5 5.5" {...S} strokeWidth="2" /></svg>
);
export const IcChevronRight = (p: P) => (
  <svg {...base(p)}><path d="M6 2.5L11.5 8 6 13.5" {...S} strokeWidth="2" /></svg>
);
export const IcComment = (p: P) => (
  <svg {...base(p)}><path d="M14 10.5a1.5 1.5 0 0 1-1.5 1.5H6l-3.5 3V3.5A1.5 1.5 0 0 1 4 2h8.5A1.5 1.5 0 0 1 14 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
);
export const IcPaperclip = (p: P) => (
  <svg {...base(p)}><path d="M13 7.5l-5 5a3.2 3.2 0 0 1-4.5-4.5l5.5-5.5a2.1 2.1 0 0 1 3 3L6.7 10.8a1 1 0 0 1-1.5-1.5L10 4.5" {...S} strokeWidth="1.4" /></svg>
);
export const IcRepeat = (p: P) => (
  <svg {...base(p)}><path d="M13.5 7A5.5 5.5 0 0 0 3.3 4.6M2.5 9a5.5 5.5 0 0 0 10.2 2.4" {...S} strokeWidth="1.6" /><path d="M13.5 2.5V7H9M2.5 13.5V9h4.5" {...S} strokeWidth="1.6" /></svg>
);
export const IcLink = (p: P) => (
  <svg {...base(p)}><path d="M6.5 9.5l3-3" {...S} strokeWidth="1.6" /><path d="M7.2 4.8l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7l-1.2 1.2M8.8 11.2l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7l1.2-1.2" {...S} strokeWidth="1.6" /></svg>
);
export const IcSend = (p: P) => (
  <svg {...base(p)}><path d="M14.5 1.5L7 9M14.5 1.5L10 14.5 7 9 1.5 6z" {...S} strokeWidth="1.5" /></svg>
);
export const IcImage = (p: P) => (
  <svg {...base(p)}><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><circle cx="5.5" cy="6" r="1.3" fill="currentColor" /><path d="M2 12l3.5-3.5 2.5 2.5 3-3.5 3 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
);
export const IcFile = (p: P) => (
  <svg {...base(p)}><path d="M9 1.5H4.5A1.5 1.5 0 0 0 3 3v10a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 13V5.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M9 1.5V5.5H13" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
);
export const IcArchive = (p: P) => (
  <svg {...base(p)}><rect x="1.5" y="2.5" width="13" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.5" /><path d="M2.5 6v6.5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6M6.3 9h3.4" {...S} strokeWidth="1.5" /></svg>
);
export const IcRestore = (p: P) => (
  <svg {...base(p)}><path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9" {...S} strokeWidth="1.6" /><path d="M2.5 2.5V6h3.5" {...S} strokeWidth="1.6" /></svg>
);
export const IcPlus = (p: P) => (
  <svg {...base(p)}><path d="M8 3v10M3 8h10" {...S} strokeWidth="2" /></svg>
);
