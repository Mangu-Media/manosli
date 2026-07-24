// ─────────────────────────────────────────────
// ARTIST STUDIO — shared UI primitives
// ─────────────────────────────────────────────
import type { CSSProperties, ReactNode } from 'react';
import { theme } from '../player/data';

export const card: CSSProperties = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 16,
  padding: 20,
};

export const caption: CSSProperties = {
  fontSize: 12,
  color: theme.dim,
  marginTop: 8,
};

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: theme.text }}>{title}</h2>
      {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: theme.textSecondary }}>{subtitle}</p>}
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div style={{ ...card, flex: '1 1 160px', minWidth: 150 }}>
      <div style={{ fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent ?? theme.text, marginTop: 6 }}>{value}</div>
      {hint && <div style={caption}>{hint}</div>}
    </div>
  );
}

/** Pure-CSS vertical bar chart for the 7-day plays series. */
export function BarChart({ days }: { days: { label: string; plays: number; isToday: boolean }[] }) {
  const max = Math.max(1, ...days.map((d) => d.plays));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160 }}>
      {days.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 11, color: theme.textSecondary }}>{d.plays}</div>
          <div
            title={`${d.label}: ${d.plays} plays`}
            style={{
              width: '100%',
              maxWidth: 44,
              height: `${Math.max(4, (d.plays / max) * 110)}px`,
              borderRadius: '6px 6px 2px 2px',
              background: d.isToday
                ? `linear-gradient(180deg, ${theme.green}, ${theme.accent})`
                : theme.surfaceActive,
              border: d.isToday ? 'none' : `1px solid ${theme.border}`,
            }}
          />
          <div style={{ fontSize: 11, color: d.isToday ? theme.text : theme.dim, fontWeight: d.isToday ? 700 : 400 }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DemoTag() {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: theme.amber,
        border: `1px solid ${theme.amber}`,
        borderRadius: 6,
        padding: '1px 6px',
        marginLeft: 6,
        verticalAlign: 'middle',
      }}
    >
      demo
    </span>
  );
}
