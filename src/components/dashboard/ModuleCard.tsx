import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { Activity, AlertTriangle, ArrowRight, Brain, Siren } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { ModuleCardData, ModuleTone, StatusTone } from '../../utils/mockData';

export interface ModuleCardProps {
  module: ModuleCardData;
  onOpen: (route: string) => void;
  onStatusOpen: (route: string) => void;
}

const moduleVisuals: Record<ModuleTone, { color: string; bg: string; soft: string; icon: ReactNode }> = {
  ect: {
    color: 'var(--ect-color)',
    bg: 'var(--ect-bg)',
    soft: 'var(--ect-soft)',
    icon: <Brain size={28} strokeWidth={2.1} aria-hidden="true" />,
  },
  rtms: {
    color: 'var(--rtms-color)',
    bg: 'var(--rtms-bg)',
    soft: 'var(--rtms-soft)',
    icon: <Activity size={28} strokeWidth={2.1} aria-hidden="true" />,
  },
  acuteEct: {
    color: 'var(--akut-color)',
    bg: 'var(--akut-bg)',
    soft: 'var(--akut-soft)',
    icon: <Siren size={28} strokeWidth={2.1} aria-hidden="true" />,
  },
};

const dotColor: Record<StatusTone, string> = {
  ok: 'var(--ok-color)',
  warn: 'var(--warn-color)',
  akut: 'var(--akut-color)',
};

const rowBg: Record<StatusTone, string> = {
  ok: 'var(--ok-bg)',
  warn: 'var(--warn-bg)',
  akut: 'var(--akut-bg)',
};

const rowColor: Record<StatusTone, string> = {
  ok: 'var(--ok-color)',
  warn: 'var(--warn-color)',
  akut: 'var(--akut-color)',
};

const styles: Record<string, CSSProperties> = {
  card: {
    minHeight: 360,
    width: '100%',
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--surface)',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'border-color 150ms ease, background-color 150ms ease, transform 100ms ease',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dotWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 700,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 999,
    flexShrink: 0,
  },
  eyebrow: {
    color: 'var(--text-subtle)',
    fontSize: 'var(--type-label)',
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    margin: 0,
    color: 'var(--text-main)',
    fontSize: 26,
    lineHeight: 1.15,
    fontWeight: 750,
  },
  description: {
    margin: '8px 0 0',
    color: 'var(--text-muted)',
    fontSize: 14,
    lineHeight: 1.55,
  },
  capacity: {
    marginTop: 16,
    color: 'var(--text-main)',
    fontSize: 15,
    fontWeight: 750,
  },
  progress: {
    height: 10,
    marginTop: 10,
    display: 'flex',
    overflow: 'hidden',
    borderRadius: 5,
    background: '#E8EDF3',
  },
  progressLegend: {
    marginTop: 7,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px 12px',
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 700,
  },
  operationalAlert: {
    width: '100%',
    marginTop: 14,
    border: '1px solid rgba(168, 100, 5, 0.38)',
    borderRadius: 8,
    background: 'var(--warn-bg)',
    color: 'var(--warn-color)',
    padding: '10px 11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    cursor: 'pointer',
    textAlign: 'left',
  },
  alertContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  alertLabel: {
    fontSize: 13,
    fontWeight: 800,
  },
  alertDetail: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 1.35,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    whiteSpace: 'nowrap',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    flexShrink: 0,
  },
  rows: {
    display: 'grid',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 24,
  },
  row: {
    minHeight: 48,
    border: '1px solid transparent',
    borderRadius: 8,
    padding: '9px 11px 9px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 650,
    textAlign: 'left',
    transition: 'border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease',
  },
  rowAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: 750,
  },
};

function handleKeyboardOpen(event: KeyboardEvent<HTMLDivElement>, route: string, onOpen: (route: string) => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onOpen(route);
  }
}

function CapacityProgress({ module }: { module: ModuleCardData }) {
  const ready = module.statusRows.find((row) => row.tone === 'ok')?.count ?? 0;
  const waiting = module.statusRows.find((row) => row.tone === 'warn')?.count ?? 0;
  const capacityMatch = module.capacityLabel.match(/(\d+)\s+bokade av\s+(\d+)/i);
  const capacity = capacityMatch ? Number(capacityMatch[2]) : Math.max(ready + waiting, 1);
  const available = Math.max(capacity - ready - waiting, 0);
  const percent = (value: number) => `${Math.min((value / capacity) * 100, 100)}%`;

  return (
    <>
      <div
        role="img"
        aria-label={`${ready} klara, ${waiting} väntande och ${available} lediga platser`}
        style={styles.progress}
      >
        {ready > 0 && <span style={{ width: percent(ready), background: 'var(--ok-color)' }} />}
        {waiting > 0 && <span style={{ width: percent(waiting), background: 'var(--warn-color)' }} />}
      </div>
      <div style={styles.progressLegend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: 'var(--ok-color)' }} />
          {ready} klara
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: 'var(--warn-color)' }} />
          {waiting} väntar
        </span>
        {available > 0 && (
          <span style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: '#B8C4D3' }} />
            {available} lediga
          </span>
        )}
      </div>
    </>
  );
}

export default function ModuleCard({ module, onOpen, onStatusOpen }: ModuleCardProps) {
  const visual = moduleVisuals[module.id];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Öppna ${module.title}`}
      onClick={() => onOpen(module.route)}
      onKeyDown={(event) => handleKeyboardOpen(event, module.route, onOpen)}
      style={{
        ...styles.card,
        borderTop: `4px solid ${visual.color}`,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = visual.color;
        event.currentTarget.style.backgroundColor = visual.soft;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = 'var(--border)';
        event.currentTarget.style.borderTopColor = visual.color;
        event.currentTarget.style.backgroundColor = 'var(--surface)';
        event.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseDown={(event) => {
        event.currentTarget.style.transform = 'scale(0.98)';
      }}
      onMouseUp={(event) => {
        event.currentTarget.style.transform = 'scale(1)';
      }}
      onFocus={(event) => {
        event.currentTarget.style.outline = `3px solid ${visual.color}40`;
        event.currentTarget.style.outlineOffset = '3px';
      }}
      onBlur={(event) => {
        event.currentTarget.style.outline = 'none';
      }}
    >
      <div style={styles.top}>
        <div style={{ display: 'flex', gap: 16, minWidth: 0 }}>
          <div style={{ ...styles.iconBox, color: visual.color, background: visual.bg }}>{visual.icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={styles.eyebrow}>Modul</div>
            <h2 style={styles.title}>{module.title}</h2>
            <p style={styles.description}>{module.description}</p>
            <div style={styles.capacity}>{module.capacityLabel}</div>
            <CapacityProgress module={module} />
            {module.operationalAlert && (
              <button
                type="button"
                style={styles.operationalAlert}
                aria-label={`${module.operationalAlert.label}. ${module.operationalAlert.detail}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onStatusOpen(module.operationalAlert!.route);
                }}
              >
                <span style={styles.alertContent}>
                  <AlertTriangle size={17} strokeWidth={2.2} aria-hidden="true" />
                  <span>
                    <span style={styles.alertLabel}>{module.operationalAlert.label}</span>
                    <span style={{ ...styles.alertDetail, display: 'block' }}>{module.operationalAlert.detail}</span>
                  </span>
                </span>
                <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div style={styles.dotWrap}>
          <span style={{ ...styles.dot, background: dotColor[module.statusTone] }} />
          {module.statusTone === 'ok' ? 'Stabil' : module.statusTone === 'warn' ? 'Bevaka' : 'Akut'}
        </div>
      </div>

      <div style={styles.rows}>
        {module.statusRows.map((row) => (
          <button
            key={`${module.id}-${row.tone}-${row.label}`}
            type="button"
            aria-label={`${module.title}: ${row.count} ${row.label}`}
            onClick={(event) => {
              event.stopPropagation();
              onStatusOpen(row.route);
            }}
            style={{
              ...styles.row,
              background: rowBg[row.tone],
              color: rowColor[row.tone],
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = rowColor[row.tone];
              event.currentTarget.style.boxShadow = `0 3px 10px ${rowColor[row.tone]}20`;
              event.currentTarget.style.transform = 'translateX(3px)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = 'transparent';
              event.currentTarget.style.boxShadow = 'none';
              event.currentTarget.style.transform = 'translateX(0)';
            }}
            onFocus={(event) => {
              event.currentTarget.style.outline = `3px solid ${rowColor[row.tone]}40`;
              event.currentTarget.style.outlineOffset = '2px';
              event.currentTarget.style.borderColor = rowColor[row.tone];
            }}
            onBlur={(event) => {
              event.currentTarget.style.outline = 'none';
              event.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <StatusBadge tone={row.tone} label={String(row.count)} pulse={row.tone === 'akut' && row.count > 0} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.label}</span>
            </span>
            <span style={styles.rowAction}>
              Öppna
              <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
