import { ArrowRight, Siren } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { ModuleCardData } from '../../utils/mockData';

interface AcuteModuleBannerProps {
  module: ModuleCardData;
  onOpen: (route: string) => void;
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    width: '100%',
    marginBottom: 24,
    border: '2px solid var(--akut-color)',
    borderRadius: 8,
    background: 'var(--akut-soft)',
    padding: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 18,
  },
  main: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    minWidth: 240,
    flex: '1 1 360px',
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    background: 'var(--akut-bg)',
    color: 'var(--akut-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eyebrow: {
    color: 'var(--akut-color)',
    fontSize: 'var(--type-label)',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  title: {
    margin: '2px 0 3px',
    color: 'var(--text-main)',
    fontSize: 22,
    lineHeight: 1.15,
    fontWeight: 800,
  },
  description: {
    margin: 0,
    color: 'var(--text-muted)',
    fontSize: 13,
  },
  metrics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    flex: '1 1 300px',
  },
  metric: {
    minHeight: 42,
    border: '1px solid rgba(180, 35, 42, 0.22)',
    borderRadius: 8,
    background: '#FFFFFF',
    padding: '7px 11px',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    color: 'var(--text-main)',
    fontSize: 12,
    fontWeight: 700,
  },
  count: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    background: 'var(--akut-bg)',
    color: 'var(--akut-color)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 850,
  },
  button: {
    minHeight: 44,
    border: 0,
    borderRadius: 8,
    background: 'var(--akut-color)',
    color: '#FFFFFF',
    padding: '0 16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 750,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};

export default function AcuteModuleBanner({ module, onOpen }: AcuteModuleBannerProps) {
  return (
    <section style={styles.wrap} aria-labelledby="acute-ect-heading">
      <div style={styles.main}>
        <div style={styles.icon}>
          <Siren size={27} strokeWidth={2.2} aria-hidden="true" />
        </div>
        <div>
          <div style={styles.eyebrow}>Högsta prioritet</div>
          <h2 id="acute-ect-heading" style={styles.title}>{module.title}</h2>
          <p style={styles.description}>{module.capacityLabel}</p>
        </div>
      </div>

      <div style={styles.metrics}>
        {module.statusRows.map((row) => (
          <div key={`${row.tone}-${row.label}`} style={styles.metric}>
            <span style={styles.count}>{row.count}</span>
            <span>{row.label}</span>
          </div>
        ))}
      </div>

      <button type="button" style={styles.button} onClick={() => onOpen(module.route)}>
        Öppna akutflöde
        <ArrowRight size={17} aria-hidden="true" />
      </button>
    </section>
  );
}
