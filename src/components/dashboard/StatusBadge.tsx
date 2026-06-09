import type { CSSProperties } from 'react';
import { statusIconByTone, type StatusTone } from '../../utils/mockData';

export interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  pulse?: boolean;
}

const toneStyles: Record<StatusTone, { color: string; background: string; border: string }> = {
  ok: { color: 'var(--ok-color)', background: 'var(--ok-bg)', border: 'rgba(20, 122, 75, 0.22)' },
  warn: { color: 'var(--warn-color)', background: 'var(--warn-bg)', border: 'rgba(168, 100, 5, 0.24)' },
  akut: { color: 'var(--akut-color)', background: 'var(--akut-bg)', border: 'rgba(180, 35, 42, 0.24)' },
};

const styles: Record<string, CSSProperties> = {
  badge: {
    minHeight: 28,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
};

export default function StatusBadge({ tone, label, pulse = false }: StatusBadgeProps) {
  const Icon = statusIconByTone[tone];
  const cfg = toneStyles[tone];

  return (
    <span
      style={{
        ...styles.badge,
        color: cfg.color,
        background: cfg.background,
        border: `1px solid ${cfg.border}`,
        animation: pulse ? 'pulse 1.4s ease-in-out infinite' : undefined,
      }}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  );
}
