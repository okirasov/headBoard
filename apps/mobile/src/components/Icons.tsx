import Svg, { Circle, Path, Rect } from 'react-native-svg';

type P = { size?: number; color: string };
const R = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IcBoard = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Rect x="1.5" y="2" width="3.4" height="12" rx="1" stroke={color} strokeWidth="1.5" /><Rect x="6.3" y="2" width="3.4" height="8.5" rx="1" stroke={color} strokeWidth="1.5" /><Rect x="11.1" y="2" width="3.4" height="5.5" rx="1" stroke={color} strokeWidth="1.5" /></Svg>
);
export const IcReview = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Circle cx="8" cy="8" r="6.2" stroke={color} strokeWidth="1.5" /><Path d="M8 4.8V8l2.4 1.6" stroke={color} strokeWidth="1.5" {...R} /></Svg>
);
export const IcDigest = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke={color} strokeWidth="1.5" /><Path d="M5.2 5h5.6M5.2 8h5.6M5.2 11h3.2" stroke={color} strokeWidth="1.5" {...R} /></Svg>
);
export const IcCalendar = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Rect x="1.8" y="2.8" width="12.4" height="11.4" rx="1.5" stroke={color} strokeWidth="1.5" /><Path d="M1.8 6.4h12.4M5.3 1.2v3M10.7 1.2v3" stroke={color} strokeWidth="1.5" {...R} /></Svg>
);
export const IcSpark = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16"><Path d="M8 1l1.8 4.9L14.7 8l-4.9 2.1L8 15l-1.8-4.9L1.3 8l4.9-2.1z" fill={color} /></Svg>
);
export const IcX = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M3 3l10 10M13 3L3 13" stroke={color} strokeWidth="2" {...R} /></Svg>
);
export const IcPlus = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M8 3v10M3 8h10" stroke={color} strokeWidth="2" {...R} /></Svg>
);
export const IcArchive = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Rect x="1.5" y="2.5" width="13" height="3.5" rx="1" stroke={color} strokeWidth="1.5" /><Path d="M2.5 6v6.5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6M6.3 9h3.4" stroke={color} strokeWidth="1.5" {...R} /></Svg>
);
export const IcCheck = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M2.5 8.5L6 12l7.5-8" stroke={color} strokeWidth="2" {...R} /></Svg>
);
export const IcFolder = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M1.5 4.5A1.5 1.5 0 0 1 3 3h3.2l1.6 1.8H13a1.5 1.5 0 0 1 1.5 1.5v6.2A1.5 1.5 0 0 1 13 14H3a1.5 1.5 0 0 1-1.5-1.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /></Svg>
);
export const IcChevronRightSm = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M6 3.5L10.5 8 6 12.5" stroke={color} strokeWidth="1.8" {...R} /></Svg>
);
export const IcChevronDown = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M4 6.5L8 10.5l4-4" stroke={color} strokeWidth="1.8" {...R} /></Svg>
);
export const IcChevronLeft = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M10 2.5L4.5 8l5.5 5.5" stroke={color} strokeWidth="2" {...R} /></Svg>
);
export const IcChevronRight = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M6 2.5L11.5 8 6 13.5" stroke={color} strokeWidth="2" {...R} /></Svg>
);
export const IcComment = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M14 10.5a1.5 1.5 0 0 1-1.5 1.5H6l-3.5 3V3.5A1.5 1.5 0 0 1 4 2h8.5A1.5 1.5 0 0 1 14 3.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /></Svg>
);
export const IcPaperclip = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M13 7.5l-5 5a3.2 3.2 0 0 1-4.5-4.5l5.5-5.5a2.1 2.1 0 0 1 3 3L6.7 10.8a1 1 0 0 1-1.5-1.5L10 4.5" stroke={color} strokeWidth="1.4" {...R} /></Svg>
);
export const IcLink = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M6.5 9.5l3-3" stroke={color} strokeWidth="1.6" {...R} /><Path d="M7.2 4.8l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7l-1.2 1.2M8.8 11.2l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7l1.2-1.2" stroke={color} strokeWidth="1.6" {...R} /></Svg>
);
export const IcSend = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M14.5 1.5L7 9M14.5 1.5L10 14.5 7 9 1.5 6z" stroke={color} strokeWidth="1.5" {...R} /></Svg>
);
export const IcImage = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke={color} strokeWidth="1.4" /><Circle cx="5.5" cy="6" r="1.3" fill={color} /><Path d="M2 12l3.5-3.5 2.5 2.5 3-3.5 3 3.5" stroke={color} strokeWidth="1.4" strokeLinejoin="round" /></Svg>
);
export const IcFile = ({ size = 16, color }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none"><Path d="M9 1.5H4.5A1.5 1.5 0 0 0 3 3v10a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 13V5.5z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" /><Path d="M9 1.5V5.5H13" stroke={color} strokeWidth="1.4" strokeLinejoin="round" /></Svg>
);
