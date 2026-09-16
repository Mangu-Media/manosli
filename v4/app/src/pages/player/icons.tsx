import type { ReactElement, SVGProps } from 'react';

// ─────────────────────────────────────────
// ICONS — hand-crafted SVG icons
// ─────────────────────────────────────────

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className = '' }: IconProps): ReactElement | null {
  const s: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const icons: Record<string, ReactElement> = {
    home: <svg {...s} viewBox="0 0 24 24" className={className}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" /></svg>,
    search: <svg {...s} viewBox="0 0 24 24" className={className}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>,
    library: <svg {...s} viewBox="0 0 24 24" className={className}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M4 4h16v16H6.5A2.5 2.5 0 014 17.5V4z" /></svg>,
    playlist: <svg {...s} viewBox="0 0 24 24" className={className}><path d="M11 5H6M14 8H6M8 11H6" /><circle cx="17" cy="14" r="4" /><path d="M17 10v4" /></svg>,
    play: <svg {...s} viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21" /></svg>,
    pause: <svg {...s} viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>,
    skipFwd: <svg {...s} viewBox="0 0 24 24" className={className}><polygon points="5,4 15,12 5,20" fill="currentColor" /><line x1="19" y1="5" x2="19" y2="19" /></svg>,
    skipBack: <svg {...s} viewBox="0 0 24 24" className={className}><polygon points="19,20 9,12 19,4" fill="currentColor" /><line x1="5" y1="5" x2="5" y2="19" /></svg>,
    shuffle: <svg {...s} viewBox="0 0 24 24" className={className}><polyline points="16,3 21,3 21,8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21,16 21,21 16,21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>,
    repeat: <svg {...s} viewBox="0 0 24 24" className={className}><polyline points="17,1 21,5 17,9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7,23 3,19 7,15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>,
    heart: <svg {...s} viewBox="0 0 24 24" className={className}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>,
    heartFill: <svg {...s} viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>,
    volume: <svg {...s} viewBox="0 0 24 24" className={className}><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></svg>,
    volumeMute: <svg {...s} viewBox="0 0 24 24" className={className}><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>,
    queue: <svg {...s} viewBox="0 0 24 24" className={className}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
    plus: <svg {...s} viewBox="0 0 24 24" className={className}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    x: <svg {...s} viewBox="0 0 24 24" className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    chevDown: <svg {...s} viewBox="0 0 24 24" className={className}><polyline points="6,9 12,15 18,9" /></svg>,
    chevRight: <svg {...s} viewBox="0 0 24 24" className={className}><polyline points="9,6 15,12 9,18" /></svg>,
    clock: <svg {...s} viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>,
    menu: <svg {...s} viewBox="0 0 24 24" className={className}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
    mic: <svg {...s} viewBox="0 0 24 24" className={className}><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
    user: <svg {...s} viewBox="0 0 24 24" className={className}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    disc: <svg {...s} viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>,
    trending: <svg {...s} viewBox="0 0 24 24" className={className}><polyline points="23,6 13.5,15.5 8.5,10.5 1,18" /><polyline points="17,6 23,6 23,12" /></svg>,
    back: <svg {...s} viewBox="0 0 24 24" className={className}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12,19 5,12 12,5" /></svg>,
    upload: <svg {...s} viewBox="0 0 24 24" className={className}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
    more:<svg {...s} viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" /></svg>,
    radio: <svg {...s} viewBox="0 0 24 24" className={className}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V4l10 2" /><circle cx="9" cy="14" r="2" /><path d="M14 12h4M14 16h4" /></svg>,
    rooms: <svg {...s} viewBox="0 0 24 24" className={className}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
    spatial: <svg {...s} viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="3" /><path d="M5 12a7 7 0 0114 0M2 12a10 10 0 0120 0" /></svg>,
  };

  return icons[name] || null;
}
