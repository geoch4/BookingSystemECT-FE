import { useMemo, useState } from 'react';
import { Filter, Target } from 'lucide-react';
import {
  metrics, improvements, registry,
  appliesToFilter, filterLabel,
  styles,
  type ModuleFilter,
} from '../components/statistics/statisticsData';
import MetricCard from '../components/statistics/MetricCard';
import ImprovementList from '../components/statistics/ImprovementList';
import QualityRegistry from '../components/statistics/QualityRegistry';

export default function StatisticsPage() {
  const [filter, setFilter] = useState<ModuleFilter>('all');

  const visibleMetrics     = useMemo(() => metrics.filter((i)     => appliesToFilter(i.module, filter)), [filter]);
  const visibleImprovements = useMemo(() => improvements.filter((i) => appliesToFilter(i.module, filter)), [filter]);
  const visibleRegistry    = useMemo(() => registry.filter((i)    => appliesToFilter(i.module, filter)), [filter]);
  const priorityItem = visibleImprovements.find((i) => i.tone === 'akut') ?? visibleImprovements[0];

  return (
    <div style={styles.page}>
      <header style={styles.top}>
        <div>
          <div style={styles.eyebrow}>Uppföljning</div>
          <h1 style={styles.title}>Statistik &amp; Kvalitet</h1>
          <p style={styles.body}>Följ kapacitet, väntetider, flaskhalsar och kvalitetsregister i samma vy.</p>
        </div>

        <div style={styles.filterBar} aria-label="Filtrera statistik">
          {(['all', 'ect', 'rtms'] as ModuleFilter[]).map((item) => {
            const active = filter === item;
            return (
              <button
                key={item}
                type="button"
                aria-label={`Visa ${filterLabel(item)}`}
                onClick={() => setFilter(item)}
                style={{
                  ...styles.filterButton,
                  borderColor: active ? 'var(--ect-color)' : 'var(--border)',
                  background:  active ? 'var(--ect-bg)'    : 'var(--surface)',
                  color:       active ? 'var(--ect-color)' : 'var(--text-muted)',
                }}
              >
                <Filter size={16} aria-hidden="true" />
                {filterLabel(item)}
              </button>
            );
          })}
        </div>
      </header>

      {priorityItem && (
        <section style={styles.insight} aria-label="Prioriterad förbättring">
          <Target size={22} color="var(--warn-color)" aria-hidden="true" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 850 }}>Prioritera nu: {priorityItem.title}</div>
            <p style={styles.body}>{priorityItem.nextStep}</p>
          </div>
        </section>
      )}

      <section style={styles.metricGrid} aria-label="Nyckeltal">
        {visibleMetrics.map((item) => <MetricCard key={item.label} item={item} />)}
      </section>

      <div style={styles.sectionGrid}>
        <ImprovementList items={visibleImprovements} />
        <QualityRegistry items={visibleRegistry} />
      </div>
    </div>
  );
}
