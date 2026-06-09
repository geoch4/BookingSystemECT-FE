import type { CSSProperties } from 'react';
import type { QuickActionData } from '../../utils/mockData';

export interface QuickActionsProps {
  actions: QuickActionData[];
  onNavigate: (route: string) => void;
  label?: string;
}

const styles: Record<string, CSSProperties> = {
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    color: 'var(--text-subtle)',
    fontSize: 'var(--type-label)',
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
  },
  button: {
    minHeight: 48,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--surface)',
    color: 'var(--text-main)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '0 16px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
};

export default function QuickActions({ actions, onNavigate, label = 'Snabbåtgärder' }: QuickActionsProps) {
  return (
    <section style={styles.section} aria-labelledby="quick-actions-heading">
      <div id="quick-actions-heading" style={styles.label}>
        {label}
      </div>
      <div style={styles.grid}>
        {actions.map((action) => {
          const Icon = action.icon;
          const isAkut = action.tone === 'akut';

          return (
            <button
              key={action.label}
              type="button"
              aria-label={action.ariaLabel}
              onClick={() => onNavigate(action.route)}
              style={{
                ...styles.button,
                borderColor: isAkut ? 'var(--akut-color)' : 'var(--border)',
                background: isAkut ? 'var(--akut-bg)' : 'var(--surface)',
                color: isAkut ? 'var(--akut-color)' : 'var(--text-main)',
                fontWeight: isAkut ? 850 : 750,
              }}
              onFocus={(event) => {
                event.currentTarget.style.outline = `3px solid ${isAkut ? 'rgba(180, 35, 42, 0.24)' : 'var(--focus-ring)'}`;
                event.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(event) => {
                event.currentTarget.style.outline = 'none';
              }}
            >
              <Icon size={18} aria-hidden="true" />
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
