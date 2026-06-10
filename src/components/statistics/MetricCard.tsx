import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import type { Metric } from './statisticsData';
import { toneStyles, styles } from './statisticsData';

export default function MetricCard({ item }: { item: Metric }) {
  const tone = toneStyles[item.tone];
  const TrendIcon = item.trendGood ? TrendingDown : TrendingUp;

  return (
    <article style={{ ...styles.card, borderTop: `4px solid ${tone.color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={styles.eyebrow}>{item.label}</div>
          <div style={{ color: 'var(--text-main)', fontSize: 30, fontWeight: 850, lineHeight: 1 }}>{item.value}</div>
          <div style={styles.body}>{item.detail}</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 8, background: tone.bg, color: tone.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart3 size={22} aria-hidden="true" />
        </div>
      </div>
      <div style={{ marginTop: 16, color: item.trendGood ? 'var(--ok-color)' : 'var(--akut-color)', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrendIcon size={16} aria-hidden="true" />
        {item.trend}
      </div>
    </article>
  );
}
