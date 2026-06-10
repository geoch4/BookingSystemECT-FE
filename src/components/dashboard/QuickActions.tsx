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
    marginBottom: 12,
    color: '#526174',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  button: {
    border: '1px solid #AFC2D5',
    borderRadius: 'var(--radius-sm)',
    background: '#F7FAFD',
    color: 'var(--text-main)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    padding: '10px 15px',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 3px 9px rgba(23, 32, 51, 0.07)',
    transition: 'background 0.14s, border-color 0.14s, color 0.14s, transform 0.14s, box-shadow 0.14s',
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

          return (
            <button
              className="quick-action-button"
              key={action.label}
              type="button"
              aria-label={action.ariaLabel}
              onClick={() => onNavigate(action.route)}
              style={styles.button}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = 'var(--ect-bg)';
                event.currentTarget.style.borderColor = '#7FA9D2';
                event.currentTarget.style.color = 'var(--ect-color)';
                event.currentTarget.style.transform = 'translateY(-2px)';
                event.currentTarget.style.boxShadow = '0 7px 16px rgba(24, 95, 165, 0.14)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = '#F7FAFD';
                event.currentTarget.style.borderColor = '#AFC2D5';
                event.currentTarget.style.color = 'var(--text-main)';
                event.currentTarget.style.transform = 'none';
                event.currentTarget.style.boxShadow = '0 3px 9px rgba(23, 32, 51, 0.07)';
              }}
              onFocus={(event) => {
                event.currentTarget.style.outline = '3px solid var(--focus-ring)';
                event.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(event) => {
                event.currentTarget.style.outline = 'none';
              }}
            >
              <Icon size={18} color="var(--ect-color)" aria-hidden="true" />
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
