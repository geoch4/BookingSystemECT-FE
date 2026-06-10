import type { CSSProperties } from 'react';
import type { TessaMockData } from '../../utils/mockData';

export interface TessaBarProps {
  data: TessaMockData;
}

const toneColor: Record<string, string> = {
  ok: 'var(--ok-color)',
  warn: 'var(--warn-color)',
  akut: 'var(--akut-color)',
};

const styles: Record<string, CSSProperties> = {
  strip: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#DDEAF6', border: '1px solid #AFC5DA',
    borderRadius: 'var(--radius)', padding: '11px 18px',
    boxShadow: '0 5px 14px rgba(23, 32, 51, 0.10)', marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.03em', color: '#526174', flexShrink: 0,
  },
  staffGroup: {
    display: 'flex', alignItems: 'center', gap: 18, flex: 1,
  },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    fontSize: 13, fontWeight: 600, color: 'var(--text-main)',
  },
  dot: { width: 8, height: 8, borderRadius: 999, flexShrink: 0 },
  muted: { color: '#526174', fontWeight: 650 },
  updated: { fontSize: 12, color: '#526174', fontWeight: 650, flexShrink: 0 },
};

export default function TessaBar({ data }: TessaBarProps) {
  return (
    <div style={styles.strip}>
      <span style={styles.sectionLabel}>Bemanning idag</span>
      <div style={styles.staffGroup}>
        {data.staff.map((s) => {
          const showValue = s.tone !== 'ok' || s.label === 'Rast';
          return (
            <span key={s.label} style={styles.pill}>
              <span style={{ ...styles.dot, background: toneColor[s.tone] ?? 'var(--border-strong)' }} />
              {s.label}
              {showValue && <span style={styles.muted}>{s.value}</span>}
            </span>
          );
        })}
      </div>
      <span style={styles.updated}>Uppdaterad {data.lastUpdated} · TESSA</span>
    </div>
  );
}
