import { ClipboardCheck, Download } from 'lucide-react';
import type { RegistryItem } from './statisticsData';
import { toneStyles, completionPercent, styles } from './statisticsData';

export default function QualityRegistry({ items }: { items: RegistryItem[] }) {
  return (
    <section style={styles.card} aria-labelledby="registry-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <h2 id="registry-heading" style={{ ...styles.sectionTitle, margin: 0 }}>Kvalitetsregister</h2>
        <button
          type="button"
          aria-label="Exportera kvalitetsregister"
          style={{
            minHeight: 44,
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--surface)',
            color: 'var(--text-main)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            fontSize: 14,
            fontWeight: 750,
            cursor: 'pointer',
          }}
        >
          <Download size={16} aria-hidden="true" />
          Export
        </button>
      </div>

      <div style={{ minHeight: 76, borderRadius: 8, background: 'var(--ok-bg)', color: 'var(--ok-color)', padding: 16, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <ClipboardCheck size={24} aria-hidden="true" />
        <div>
          <div style={{ fontSize: 14, fontWeight: 850 }}>Kopplat till förbättringsarbetet</div>
          <div style={{ fontSize: 14 }}>Registerluckor visas tillsammans med orsaken som behöver förbättras.</div>
        </div>
      </div>

      {items.map((item) => {
        const tone = toneStyles[item.tone];
        const percent = completionPercent(item.completed, item.total);
        const isGapMetric = item.label.includes('Ofullständig');

        return (
          <article key={item.label} style={styles.row}>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-main)', fontSize: 14, fontWeight: 850 }}>{item.label}</div>
                  <div style={styles.body}>{item.status}</div>
                </div>
                <span style={{ ...styles.chip, background: tone.bg, color: tone.color }}>
                  {isGapMetric ? item.completed : `${percent}%`}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-soft)', overflow: 'hidden', marginTop: 12 }}>
                <div
                  style={{
                    width: `${isGapMetric ? Math.min(item.completed * 10, 100) : percent}%`,
                    height: '100%',
                    background: tone.color,
                  }}
                />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
