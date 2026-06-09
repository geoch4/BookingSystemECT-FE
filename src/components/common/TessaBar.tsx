import { Coffee, HeartPulse, Stethoscope, UserRound, type LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { StaffStatus, TessaMockData } from '../../utils/mockData';

export interface TessaBarProps {
  data: TessaMockData;
}

const iconByLabel: Record<string, LucideIcon> = {
  Narkos: Stethoscope,
  Sjuksköterska: UserRound,
  Läkare: HeartPulse,
  Rast: Coffee,
};

const toneColor = {
  ok: 'var(--ok-color)',
  warn: 'var(--warn-color)',
  akut: 'var(--akut-color)',
};

const toneBg = {
  ok: 'var(--ok-bg)',
  warn: 'var(--warn-bg)',
  akut: 'var(--akut-bg)',
};

const styles: Record<string, CSSProperties> = {
  wrap: {
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--surface)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  header: {
    minHeight: 52,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottom: '1px solid var(--border)',
  },
  title: {
    margin: 0,
    color: 'var(--text-main)',
    fontSize: 'var(--type-heading)',
    fontWeight: 750,
  },
  updated: {
    color: 'var(--text-subtle)',
    fontSize: 12,
    fontWeight: 650,
    whiteSpace: 'nowrap',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 1,
    background: 'var(--border)',
  },
  item: {
    minHeight: 88,
    padding: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--surface)',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    marginBottom: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    flexShrink: 0,
  },
  label: {
    color: 'var(--text-subtle)',
    fontSize: 'var(--type-label)',
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  value: {
    color: 'var(--text-main)',
    fontSize: 'var(--type-title)',
    fontWeight: 750,
  },
  detail: {
    color: 'var(--text-muted)',
    fontSize: 12,
    marginTop: 2,
  },
};

function StatusItem({ item }: { item: StaffStatus }) {
  const Icon = iconByLabel[item.label] ?? HeartPulse;
  const color = toneColor[item.tone];

  return (
    <div style={styles.item}>
      <div style={{ ...styles.icon, color, background: toneBg[item.tone] }}>
        <Icon size={21} strokeWidth={2} aria-hidden="true" />
      </div>
      <div>
        <div style={styles.itemTop}>
          <span style={{ ...styles.dot, background: color }} />
          <span style={styles.label}>{item.label}</span>
        </div>
        <div style={styles.value}>{item.value}</div>
        <div style={styles.detail}>{item.detail}</div>
      </div>
    </div>
  );
}

export default function TessaBar({ data }: TessaBarProps) {
  return (
    <section style={styles.wrap} aria-labelledby="day-status-heading">
      <div style={styles.header}>
        <h2 id="day-status-heading" style={styles.title}>Dagsstatus</h2>
        <span style={styles.updated}>Uppdaterad {data.lastUpdated}</span>
      </div>

      <div style={styles.grid}>
        {data.staff.map((item) => <StatusItem key={item.label} item={item} />)}
      </div>
    </section>
  );
}
