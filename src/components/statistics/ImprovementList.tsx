import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { Improvement } from './statisticsData';
import { toneStyles, styles } from './statisticsData';

export default function ImprovementList({ items }: { items: Improvement[] }) {
  return (
    <section style={styles.card} aria-labelledby="improvement-heading">
      <h2 id="improvement-heading" style={styles.sectionTitle}>Behöver utvecklas</h2>
      {items.map((item) => {
        const tone = toneStyles[item.tone];
        const Icon = item.tone === 'akut' ? AlertTriangle : item.tone === 'warn' ? Clock : CheckCircle2;

        return (
          <article key={item.title} style={styles.row}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: tone.bg, color: tone.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={19} aria-hidden="true" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text-main)', fontSize: 14, fontWeight: 850 }}>{item.title}</div>
                <p style={styles.body}>{item.impact}</p>
                <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 14 }}>
                  <strong>Nästa steg:</strong> {item.nextStep}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 8, justifyItems: 'end', flexShrink: 0 }}>
              <strong style={{ color: tone.color, fontSize: 20 }}>{item.count}</strong>
              <span style={{ ...styles.chip, background: 'var(--surface-soft)', color: 'var(--text-muted)' }}>{item.owner}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
