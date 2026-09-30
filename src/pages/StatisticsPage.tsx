import { useMemo, useState } from 'react';
import { Filter, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getBookings } from '../api/bookings';
import BackendErrorState from '../components/common/BackendErrorState';
import {
  metrics, improvements, registry,
  appliesToFilter, filterLabel,
  buildImprovementsFromBookings,
  buildMetricsFromBookings,
  buildRegistryFromBookings,
  styles,
  type ModuleFilter,
} from '../components/statistics/statisticsData';
import MetricCard from '../components/statistics/MetricCard';
import ImprovementList from '../components/statistics/ImprovementList';
import QualityRegistry from '../components/statistics/QualityRegistry';

export default function StatisticsPage() {
  // Filters all three sections (metrics, improvements, registry) by module: all/ECT/rTMS.
  const [filter, setFilter] = useState<ModuleFilter>('all');
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings, retry: 1 });
  const liveBookings = bookingsQuery.data ?? [];
  const useLiveStatistics = liveBookings.length > 0;
  const sourceMetrics = useLiveStatistics ? buildMetricsFromBookings(liveBookings) : metrics;
  const sourceImprovements = useLiveStatistics ? buildImprovementsFromBookings(liveBookings) : improvements;
  const sourceRegistry = useLiveStatistics ? buildRegistryFromBookings(liveBookings) : registry;

  const visibleMetrics     = useMemo(() => sourceMetrics.filter((i)     => appliesToFilter(i.module, filter)), [filter, sourceMetrics]);
  const visibleImprovements = useMemo(() => sourceImprovements.filter((i) => appliesToFilter(i.module, filter)), [filter, sourceImprovements]);
  const visibleRegistry    = useMemo(() => sourceRegistry.filter((i)    => appliesToFilter(i.module, filter)), [filter, sourceRegistry]);
  // Highlights the most urgent improvement item, or just the first one if none are acute.
  const priorityItem = visibleImprovements.find((i) => i.tone === 'akut') ?? visibleImprovements[0];

  return (
    <div style={styles.page}>
      <header style={styles.top}>
        <div>
          <div style={styles.eyebrow}>Uppföljning</div>
          <h1 style={styles.title}>Statistik &amp; Kvalitet</h1>
          <p style={styles.body}>
            Följ kapacitet, väntetider, flaskhalsar och kvalitetsregister i samma vy.
            <span style={{ marginLeft: 8, fontWeight: 800 }}>
              {useLiveStatistics ? 'Live från bokningar' : 'Exempeldata'}
            </span>
          </p>
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

      {bookingsQuery.isError && (
        <div style={{ marginBottom: 16 }}>
          <BackendErrorState
            compact
            title="Statistik-API:t kan inte nås - visar exempeldata"
            message="Statistiken använder fasta exempelvärden tills bokningsdata kan hämtas."
            error={bookingsQuery.error}
            onRetry={() => { void bookingsQuery.refetch(); }}
          />
        </div>
      )}

      {/* Callout for the single most urgent improvement item */}
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
