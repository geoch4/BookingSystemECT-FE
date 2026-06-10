import { useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { Activity, ArrowRight, Brain, Check, Plus } from 'lucide-react';
import type { ModuleCardData, ModuleTone } from '../../utils/mockData';

export interface ModuleCardProps {
  module: ModuleCardData;
  onOpen: (route: string) => void;
  onStatusOpen: (route: string) => void;
}

const moduleVisuals: Record<ModuleTone, { color: string; bg: string; soft: string; border: string; icon: ReactNode }> = {
  ect: {
    color: 'var(--ect-color)',
    bg: 'var(--ect-bg)',
    soft: 'var(--ect-soft)',
    border: '#B8D2EE',
    icon: <Brain size={22} strokeWidth={2.1} aria-hidden="true" />,
  },
  rtms: {
    color: 'var(--rtms-color)',
    bg: 'var(--rtms-bg)',
    soft: 'var(--rtms-soft)',
    border: '#B6DECE',
    icon: <Activity size={22} strokeWidth={2.1} aria-hidden="true" />,
  },
  acuteEct: {
    color: 'var(--akut-color)',
    bg: 'var(--akut-bg)',
    soft: 'var(--akut-soft)',
    border: 'rgba(180,35,42,0.28)',
    icon: <Brain size={22} strokeWidth={2.1} aria-hidden="true" />,
  },
};

const statusToneStyle: Record<string, { dot: string; label: string }> = {
  ok:   { dot: 'var(--ok-color)',   label: 'Stabil'  },
  warn: { dot: 'var(--warn-color)', label: 'Bevaka'  },
  akut: { dot: 'var(--akut-color)', label: 'Akut'    },
};

const styles: Record<string, CSSProperties> = {
  card: {
    position: 'relative',
    borderRadius: 'var(--radius)',
    padding: 20,
    boxShadow: '0 5px 16px rgba(23, 32, 51, 0.09)',
    display: 'flex', flexDirection: 'column',
    cursor: 'pointer',
    transition: 'transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease',
    textAlign: 'left', width: '100%',
  },
  needsAction: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
    textTransform: 'uppercase', color: 'var(--akut-color)',
    marginBottom: 10,
  },
  needsActionDot: {
    width: 6, height: 6, borderRadius: 999,
    background: 'var(--akut-color)', display: 'inline-block',
  },
  top: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  topLeft: { display: 'flex', gap: 12, minWidth: 0 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  name: { fontSize: 18, fontWeight: 750, letterSpacing: '-0.01em' },
  desc: { fontSize: 12.5, color: '#45566B', marginTop: 2, fontWeight: 500 },
  statusWord: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 750, color: '#45566B', whiteSpace: 'nowrap' },
  dot: { width: 8, height: 8, borderRadius: 999 },
  capBlock: { marginTop: 16 },
  capNum: { display: 'flex', alignItems: 'baseline', gap: 7 },
  capBig: { fontSize: 26, fontWeight: 780, letterSpacing: '-0.02em', color: 'var(--text-main)' },
  capLabel: { fontSize: 13, color: '#45566B', fontWeight: 700 },
  track: { marginTop: 9, height: 9, borderRadius: 999, background: '#E4EAF1', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(23,32,51,0.08)' },
  capLine: { marginTop: 11, display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5, fontWeight: 650, color: '#45566B', flexWrap: 'wrap' as const },
  seg: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 7, padding: '5px 8px', cursor: 'pointer',
    fontSize: 12.5, fontWeight: 650,
  },
  segDot: { width: 7, height: 7, borderRadius: 999 },
  footer: { marginTop: 'auto', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 10 },
  acuteChip: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'var(--akut-bg)', color: 'var(--akut-color)',
    border: '1px solid rgba(180,35,42,0.28)', borderRadius: 999,
    padding: '6px 12px 6px 8px', fontSize: 12.5, fontWeight: 750,
    cursor: 'pointer', transition: 'background 0.15s',
    whiteSpace: 'nowrap',
  },
  acuteCount: {
    minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999,
    background: 'var(--akut-color)', color: '#fff', fontSize: 11, fontWeight: 800,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  calmNote: { fontSize: 12, color: '#526174', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: 6 },
  bookBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    borderRadius: 'var(--radius-sm)', padding: '5px 10px',
    fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
  },
  openBtn: {
    marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 'var(--radius-sm)', padding: '8px 13px', fontSize: 13, fontWeight: 750,
    cursor: 'pointer',
    boxShadow: '0 3px 9px rgba(23, 32, 51, 0.10)',
    transition: 'background 0.18s, color 0.18s, transform 0.15s, box-shadow 0.15s',
  },
};

function parseCapacity(label: string): { booked: number; total: number } {
  const m = label.match(/(\d+)\s+bokade av\s+(\d+)/i);
  if (m) return { booked: Number(m[1]), total: Number(m[2]) };
  const m2 = label.match(/(\d+)/g);
  if (m2 && m2.length >= 2) return { booked: Number(m2[0]), total: Number(m2[1]) };
  return { booked: 0, total: 1 };
}

function handleKey(e: KeyboardEvent<HTMLDivElement>, route: string, onOpen: (r: string) => void) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(route); }
}

export default function ModuleCard({ module, onOpen, onStatusOpen }: ModuleCardProps) {
  const [hovered, setHovered] = useState(false);
  const visual = moduleVisuals[module.id] ?? moduleVisuals.ect;
  const status = statusToneStyle[module.statusTone] ?? statusToneStyle.ok;
  const { booked, total } = parseCapacity(module.capacityLabel);
  const pct = total > 0 ? Math.round((booked / total) * 100) : 0;

  const readyRow  = module.statusRows.find((r) => r.tone === 'ok');
  const waitRow   = module.statusRows.find((r) => r.tone === 'warn');
  const akutRow   = module.statusRows.find((r) => r.tone === 'akut');
  const akutCount = akutRow?.count ?? 0;
  const available = Math.max(total - booked, 0);

  return (
    <div
      className="module-card-interactive"
      role="button"
      tabIndex={0}
      aria-label={`Öppna ${module.title}`}
      onClick={() => onOpen(module.route)}
      onKeyDown={(e) => handleKey(e, module.route, onOpen)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        ...styles.card,
        background: module.id === 'ect'
          ? hovered ? '#DCECF9' : '#EAF3FB'
          : module.id === 'rtms'
            ? hovered ? '#DCEFE8' : '#E8F5F0'
            : hovered ? '#F9DCDE' : '#FCEBEC',
        border: akutCount > 0 ? '1px solid rgba(180,35,42,0.45)' : `1px solid ${visual.border}`,
        borderTop: `3px solid ${visual.color}`,
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 12px 28px rgba(23, 32, 51, 0.15)' : '0 5px 16px rgba(23, 32, 51, 0.09)',
      }}
    >
      {akutCount > 0 && (
        <div style={styles.needsAction}>
          <span style={styles.needsActionDot} />
          Kräver åtgärd
        </div>
      )}

      <div style={styles.top}>
        <div style={styles.topLeft}>
          <div style={{ ...styles.iconBox, background: visual.bg, color: visual.color }}>{visual.icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={styles.name}>{module.title}</div>
            <div style={styles.desc}>{module.description}</div>
          </div>
        </div>
        <span style={styles.statusWord}>
          <span style={{ ...styles.dot, background: status.dot }} />
          {status.label}
        </span>
      </div>

      <div style={{
        ...styles.capBlock,
        background: 'rgba(255,255,255,0.72)',
        border: `1px solid ${visual.border}`,
        borderRadius: 9,
        padding: '12px 14px',
      }}>
        <div style={styles.capNum}>
          <span style={styles.capBig}>
            {booked}<span style={{ color: 'var(--text-subtle)', fontWeight: 600, fontSize: 16 }}> / {total}</span>
          </span>
          <span style={styles.capLabel}>platser bokade</span>
        </div>
        <div style={styles.track}>
          <div style={{ height: '100%', borderRadius: 999, background: visual.color, width: `${pct}%`, transition: 'width 0.5s ease' }} />
        </div>
        <div style={styles.capLine}>
          {readyRow && (
            <button
              type="button"
              className="module-status-chip"
              style={{ ...styles.seg, color: '#0F6840', background: '#DDF2E7', border: '1px solid #A9D8BE' }}
              onClick={(event) => { event.stopPropagation(); onStatusOpen(readyRow.route); }}
              aria-label={`${readyRow.count} ${readyRow.label}`}
            >
              <span style={{ ...styles.segDot, background: 'var(--ok-color)' }} />
              <b style={{ color: 'var(--text-main)' }}>{readyRow.count}</b> klara
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          )}
          {waitRow && (
            <button
              type="button"
              className="module-status-chip"
              style={{ ...styles.seg, color: '#875100', background: '#FFF0CC', border: '1px solid #E6C77A' }}
              onClick={(event) => { event.stopPropagation(); onStatusOpen(waitRow.route); }}
              aria-label={`${waitRow.count} ${waitRow.label}`}
            >
              <span style={{ ...styles.segDot, background: 'var(--warn-color)' }} />
              <b style={{ color: 'var(--text-main)' }}>{waitRow.count}</b> väntar
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          )}
          {available > 0 && (
            <button
              type="button"
              className="module-status-chip"
              style={{ ...styles.seg, color: '#45566B', background: '#E8EEF4', border: '1px solid #C3CEDA' }}
              onClick={(event) => { event.stopPropagation(); onOpen(`${module.route}&action=book`); }}
              aria-label={`${available} lediga platser, boka tid`}
            >
              <span style={{ ...styles.segDot, background: 'var(--border-strong)' }} />
              <b style={{ color: 'var(--text-main)' }}>{available}</b> lediga
              <Plus size={12} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div style={{ ...styles.footer, paddingLeft: 2, paddingRight: 2 }}>
        {akutCount > 0 ? (
          <button
            type="button"
            style={styles.acuteChip}
            aria-label={`${akutCount} akuta fall – öppna akutflödet`}
            onClick={(e) => { e.stopPropagation(); if (akutRow) onStatusOpen(akutRow.route); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fadddf'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--akut-bg)'; }}
          >
            <span style={styles.acuteCount}>{akutCount}</span>
            akuta — öppna
          </button>
        ) : (
          <span style={styles.calmNote}>
            <Check size={14} style={{ color: 'var(--ok-color)' }} aria-hidden="true" /> Inga akuta
          </span>
        )}

        {available > 0 && hovered && (
          <button
            type="button"
            style={{ ...styles.bookBtn, background: visual.bg, color: visual.color, border: `1px solid ${visual.border}` }}
            onClick={(e) => { e.stopPropagation(); onOpen(`${module.route}&action=book`); }}
          >
            <Plus size={13} aria-hidden="true" /> Boka tid
          </button>
        )}

        <span
          style={{
            ...styles.openBtn,
            border: `1px solid ${visual.border}`,
            background: hovered ? visual.color : '#FFFFFF',
            color: hovered ? '#fff' : visual.color,
            transform: hovered ? 'translateY(-1px)' : 'none',
            boxShadow: hovered ? `0 6px 14px ${visual.color}33` : '0 3px 9px rgba(23, 32, 51, 0.10)',
          }}
        >
          Öppna {module.title} <ArrowRight size={15} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
