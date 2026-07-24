import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { theme, clamp } from './data';

// ─────────────────────────────────────────────
// WAVEFORM VISUALIZER (decorative bars)
// ─────────────────────────────────────────────

export function Waveform({ isPlaying, color = theme.accent, bars = 32 }: { isPlaying: boolean; color?: string; bars?: number }) {
  const [heights, setHeights] = useState<number[]>(() => Array.from({ length: bars }, () => Math.random() * 0.3 + 0.1));

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setHeights((prev) =>
        prev.map((h) => {
          const target = Math.random() * 0.8 + 0.2;
          return h + (target - h) * 0.3;
        }),
      );
    }, 120);
    return () => clearInterval(id);
  }, [isPlaying, bars]);

  return (
    <div style={{ display: 'flex', alignItems: 'end', gap: 1.5, height: 28 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 2.5,
            height: `${h * 100}%`,
            backgroundColor: color,
            borderRadius: 1,
            opacity: isPlaying ? 0.9 : 0.3,
            transition: 'height 0.12s ease, opacity 0.3s',
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// COVER ART — real artwork image with emoji fallback
// ─────────────────────────────────────────────

interface CoverProps {
  color: string;
  artwork?: string;
  emoji: string;
  alt: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Cover({ color, artwork, emoji, alt, style, children }: CoverProps) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${color}40, ${color}15)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {artwork ? (
        <img
          src={artwork}
          alt={alt}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        emoji
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// ARTIST AVATAR — round artwork with emoji fallback
// ─────────────────────────────────────────────

interface AvatarProps {
  name: string;
  color: string;
  artwork?: string;
  emoji: string;
  style?: CSSProperties;
}

export function Avatar({ name, color, artwork, emoji, style }: AvatarProps) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}50, ${color}20)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      {artwork ? (
        <img
          src={artwork}
          alt={name}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        emoji
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PROGRESS / SEEK BAR (click-to-seek)
// ─────────────────────────────────────────────

interface ProgressBarProps {
  value: number;
  max: number;
  onChange?: (value: number) => void;
  height?: number;
  color?: string;
}

export function ProgressBar({ value, max, onChange, height = 4, color = theme.accent }: ProgressBarProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !onChange) return;
    const rect = ref.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    onChange(x * max);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      style={{ width: '100%', height: height + 8, display: 'flex', alignItems: 'center', cursor: onChange ? 'pointer' : 'default' }}
    >
      <div style={{ width: '100%', height, background: theme.surfaceActive, borderRadius: height / 2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: height / 2, transition: 'width 0.1s linear' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SMALL SHARED PIECES
// ─────────────────────────────────────────────

export function Pill({
  active,
  children,
  onClick,
  color,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 16px',
        borderRadius: 20,
        border: 'none',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        background: active ? color || theme.accent : theme.surfaceHover,
        color: active ? '#fff' : theme.textSecondary,
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '0 16px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
      {action && (
        <button
          onClick={onAction}
          style={{ background: 'none', border: 'none', color: theme.textSecondary, fontSize: 12, cursor: 'pointer', fontWeight: 500, padding: '4px 8px' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.textSecondary;
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

export function ScrollRow({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
      {children}
    </div>
  );
}

export function GridRow({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14, padding: '0 16px' }}>{children}</div>;
}
