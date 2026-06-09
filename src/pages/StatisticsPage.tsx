import { useMemo, useState, type CSSProperties } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Filter,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

type ModuleFilter = 'all' | 'ect' | 'rtms';
type Tone = 'ect' | 'rtms' | 'ok' | 'warn' | 'akut';

interface Metric {
  module: ModuleFilter;
  label: string;
  value: string;
  detail: string;
  trend: string;
  trendGood: boolean;
  tone: Tone;
}

interface Improvement {
  module: ModuleFilter;
  title: string;
  count: number;
  impact: string;
  nextStep: string;
  owner: string;
  tone: Tone;
}

interface RegistryItem {
  module: ModuleFilter;
  label: string;
  completed: number;
  total: number;
  status: string;
  tone: Tone;
}

const metrics: Metric[] = [
  { module: 'ect', label: 'ECT genomförda', value: '42', detail: 'senaste 30 dagarna', trend: '+8% mot förra månaden', trendGood: true, tone: 'ect' },
  { module: 'rtms', label: 'rTMS genomförda', value: '68', detail: 'senaste 30 dagarna', trend: '+5% mot förra månaden', trendGood: true, tone: 'rtms' },
  { module: 'all', label: 'Medelväntetid', value: '6 dagar', detail: 'remiss till första behandling', trend: '-2 dagar', trendGood: true, tone: 'ok' },
  { module: 'all', label: 'Akuta ärenden', value: '7', detail: 'krävde prioritering', trend: '+3 ärenden', trendGood: false, tone: 'akut' },
];

const improvements: Improvement[] = [
  {
    module: 'ect',
    title: 'Orbit-status saknas före beslut',
    count: 5,
    impact: 'Fördröjer ECT-beslut och gör prioritering osäker.',
    nextStep: 'Lägg Orbit-kontroll som obligatorisk punkt i remissflödet.',
    owner: 'Koordinator',
    tone: 'warn',
  },
  {
    module: 'ect',
    title: 'Sen anestesibedömning',
    count: 2,
    impact: 'Akuta patienter riskerar att flyttas sent i schemat.',
    nextStep: 'Skapa automatisk akut-signal till narkos vid röd prioritet.',
    owner: 'Narkos',
    tone: 'akut',
  },
  {
    module: 'all',
    title: 'Otydlig orsak till avbokning',
    count: 6,
    impact: 'Svårt att se om bortfall beror på patient, kapacitet eller förberedelser.',
    nextStep: 'Lägg till fasta avbokningsorsaker i bokningsvyn.',
    owner: 'System',
    tone: 'ok',
  },
];

const registry: RegistryItem[] = [
  { module: 'ect', label: 'ECT registrerade behandlingar', completed: 38, total: 42, status: '4 saknar komplettering', tone: 'warn' },
  { module: 'rtms', label: 'rTMS registrerade behandlingar', completed: 64, total: 68, status: 'På god väg', tone: 'ok' },
  { module: 'all', label: 'Uppföljningsskattningar', completed: 91, total: 110, status: '19 kvar att följa upp', tone: 'warn' },
  { module: 'all', label: 'Ofullständig kvalitetsdata', completed: 2, total: 110, status: 'Kräver åtgärd', tone: 'akut' },
];

const toneStyles: Record<Tone, { color: string; bg: string }> = {
  ect: { color: 'var(--ect-color)', bg: 'var(--ect-bg)' },
  rtms: { color: 'var(--rtms-color)', bg: 'var(--rtms-bg)' },
  ok: { color: 'var(--ok-color)', bg: 'var(--ok-bg)' },
  warn: { color: 'var(--warn-color)', bg: 'var(--warn-bg)' },
  akut: { color: 'var(--akut-color)', bg: 'var(--akut-bg)' },
};

const styles: Record<string, CSSProperties> = {
  page: {
    padding: 24,
    maxWidth: 1180,
    margin: '0 auto',
  },
  top: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 24,
  },
  eyebrow: {
    color: 'var(--text-subtle)',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    margin: 0,
    color: 'var(--text-main)',
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  body: {
    margin: '8px 0 0',
    color: 'var(--text-muted)',
    fontSize: 14,
    lineHeight: 1.5,
  },
  filterBar: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  filterButton: {
    minHeight: 44,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--surface)',
    color: 'var(--text-muted)',
    padding: '0 14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 750,
    cursor: 'pointer',
  },
  insight: {
    border: '1px solid rgba(168, 100, 5, 0.28)',
    background: 'var(--warn-bg)',
    color: 'var(--text-main)',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: 16,
  },
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)',
    gap: 24,
  },
  sectionTitle: {
    margin: '0 0 16px',
    color: 'var(--text-main)',
    fontSize: 18,
    fontWeight: 700,
  },
  row: {
    minHeight: 76,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    borderTop: '1px solid var(--border)',
    padding: '16px 0',
  },
  chip: {
    minHeight: 32,
    borderRadius: 999,
    padding: '0 10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
};

function appliesToFilter(itemModule: ModuleFilter, filter: ModuleFilter) {
  return filter === 'all' || itemModule === filter || itemModule === 'all';
}

function filterLabel(filter: ModuleFilter) {
  if (filter === 'ect') return 'ECT';
  if (filter === 'rtms') return 'rTMS';
  return 'Alla';
}

function completionPercent(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export default function StatisticsPage() {
  const [filter, setFilter] = useState<ModuleFilter>('all');

  const visibleMetrics = useMemo(() => metrics.filter((item) => appliesToFilter(item.module, filter)), [filter]);
  const visibleImprovements = useMemo(() => improvements.filter((item) => appliesToFilter(item.module, filter)), [filter]);
  const visibleRegistry = useMemo(() => registry.filter((item) => appliesToFilter(item.module, filter)), [filter]);
  const priorityItem = visibleImprovements.find((item) => item.tone === 'akut') ?? visibleImprovements[0];

  return (
    <div style={styles.page}>
      <header style={styles.top}>
        <div>
          <div style={styles.eyebrow}>Uppföljning</div>
          <h1 style={styles.title}>Statistik & Kvalitet</h1>
          <p style={styles.body}>
            Följ kapacitet, väntetider, flaskhalsar och kvalitetsregister i samma vy.
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
                  background: active ? 'var(--ect-bg)' : 'var(--surface)',
                  color: active ? 'var(--ect-color)' : 'var(--text-muted)',
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
        {visibleMetrics.map((item) => {
          const tone = toneStyles[item.tone];
          const TrendIcon = item.trendGood ? TrendingDown : TrendingUp;

          return (
            <article key={item.label} style={{ ...styles.card, borderTop: `4px solid ${tone.color}` }}>
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
        })}
      </section>

      <div style={styles.sectionGrid}>
        <section style={styles.card} aria-labelledby="improvement-heading">
          <h2 id="improvement-heading" style={styles.sectionTitle}>Behöver utvecklas</h2>
          {visibleImprovements.map((item) => {
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

          {visibleRegistry.map((item) => {
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
      </div>
    </div>
  );
}
