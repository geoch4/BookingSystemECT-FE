import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '44px 24px', gap: 10, textAlign: 'center',
    }}>
      {icon && (
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--surface-sink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-subtle)', marginBottom: 2,
        }}>
          {icon}
        </div>
      )}
      <p style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-main)', margin: 0 }}>{title}</p>
      {description && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 340, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}
