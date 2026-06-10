import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import TessaBar from '../components/common/TessaBar';
import ModuleCard from '../components/dashboard/ModuleCard';
import QuickActions from '../components/dashboard/QuickActions';
import { useAuth } from '../context/useAuth';
import type { ModuleTone, ModuleCardData } from '../utils/mockData';
import { landingMock } from '../utils/mockData';
import { getBookings } from '../api/bookings';
import { isEctType, isRtmsType } from '../types';
import BackendErrorState from '../components/common/BackendErrorState';

function todayLabel() {
  return new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: '100%', maxWidth: 1200, margin: '0 auto', padding: '32px 28px 64px',
  },
  headRow: {
    display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20,
  },
  title: { margin: 0, fontSize: 26, fontWeight: 750, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text-main)' },
  date: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    color: 'var(--text-muted)', fontSize: 13.5, fontWeight: 600,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 20, marginTop: 20,
  },
  quietActions: {
    marginTop: 28,
    padding: '18px 20px 1px',
    border: '1px solid #B8C8D8',
    borderRadius: 12,
    background: '#DCE6F0',
    boxShadow: '0 5px 14px rgba(23, 32, 51, 0.08)',
  },
};

type RoleView = {
  roleLabel: string;
  actionLabel: string;
  title: string;
  description: string;
  actionNames: string[];
  moduleIds: ModuleTone[];
};

function getRoleView(role?: string): RoleView {
  const normalizedRole = role?.trim().toLowerCase() ?? '';

  if (
    normalizedRole.includes('överläk') || normalizedRole.includes('overlak')
    || normalizedRole === 'öl' || normalizedRole.includes('doctor')
  ) {
    return {
      roleLabel: 'Överläkare',
      actionLabel: 'Remissarbete',
      title: 'Remisser att bedöma',
      description: 'Granska prioriteringar, akuta ECT-ärenden och medicinska underlag.',
      actionNames: ['Prioriteringslista', 'Styrdokument'],
      moduleIds: ['ect', 'rtms'],
    };
  }

  if (normalizedRole.includes('narkos') || normalizedRole.includes('anestesi')) {
    return {
      roleLabel: 'Narkossjuksköterska',
      actionLabel: 'Inför behandling',
      title: 'Behandlingsberedskap',
      description: 'Se dagens ECT-flöde, akuta patienter och relevanta styrdokument.',
      actionNames: ['Styrdokument'],
      moduleIds: ['ect'],
    };
  }

  return {
    roleLabel: 'ECT-koordinator',
    actionLabel: 'Koordinatorverktyg',
    title: 'Dagens behandlingsflöde',
    description: 'Oversikt över beläggning och bemanning. Välj en modul för att arbeta vidare.',
    actionNames: ['Ny remiss', 'Prioriteringslista', 'Styrdokument', 'Statistik & Kvalitet'],
    moduleIds: ['ect', 'rtms'],
  };
}

const ECT_CAPACITY = 12;
const RTMS_CAPACITY = 13;

function buildLiveModules(
  bookings: { date: string; status: string; priority: string; treatmentTypeId: number }[],
): ModuleCardData[] {
  const today = new Date().toISOString().slice(0, 10);
  const todayActive = bookings.filter((b) => b.date.slice(0, 10) === today && b.status !== 'Cancelled');

  const ect  = todayActive.filter((b) => isEctType(b.treatmentTypeId));
  const rtms = todayActive.filter((b) => isRtmsType(b.treatmentTypeId));

  function stats(list: typeof ect) {
    const akut = list.filter((b) => b.priority === 'Red').length;
    const ok   = list.filter((b) => b.status === 'Confirmed' && b.priority !== 'Red').length;
    const warn = Math.max(list.length - akut - ok, 0);
    return { booked: list.length, akut, ok, warn };
  }

  const es = stats(ect);
  const rs = stats(rtms);

  return landingMock.modules
    .filter((m) => m.id !== 'acuteEct')
    .map((m) => {
      if (m.id === 'ect') {
        return {
          ...m,
          capacityLabel: `${es.booked} bokade av ${ECT_CAPACITY} platser`,
          statusTone: es.akut > 0 ? 'akut' : es.warn > 0 ? 'warn' : 'ok',
          statusRows: [
            { ...m.statusRows[0], count: es.ok },
            { ...m.statusRows[1], count: es.warn },
            { ...m.statusRows[2], count: es.akut },
          ],
        } as ModuleCardData;
      }
      if (m.id === 'rtms') {
        return {
          ...m,
          capacityLabel: `${rs.booked} bokade av ${RTMS_CAPACITY} platser`,
          statusTone: rs.akut > 0 ? 'akut' : rs.warn > 0 ? 'warn' : 'ok',
          statusRows: [
            { ...m.statusRows[0], count: rs.ok },
            { ...m.statusRows[1], count: rs.warn },
            { ...m.statusRows[2], count: rs.akut },
          ],
        } as ModuleCardData;
      }
      return m;
    });
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleView = getRoleView(user?.role);

  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const bookings = bookingsQuery.data ?? [];
  const liveModules = buildLiveModules(bookings);

  const visibleActions = landingMock.quickActions.filter((a) => roleView.actionNames.includes(a.label));
  const visibleModules = liveModules.filter((m) => roleView.moduleIds.includes(m.id));

  return (
    <main style={styles.page}>
      <div style={styles.headRow}>
        <h1 style={styles.title}>{roleView.title}</h1>
        <div style={styles.date}>
          <CalendarDays size={15} color="var(--ect-color)" aria-hidden="true" />
          {todayLabel()}
        </div>
      </div>

      <TessaBar data={landingMock.tessa} />

      {bookingsQuery.isError && (
        <BackendErrorState
          error={bookingsQuery.error}
          onRetry={() => void bookingsQuery.refetch()}
        />
      )}

      {!bookingsQuery.isError && <div style={styles.grid}>
        {visibleModules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            onOpen={(route) => navigate(route)}
            onStatusOpen={(route) => navigate(route)}
          />
        ))}
      </div>}

      {visibleActions.length > 0 && (
        <div style={styles.quietActions}>
          <QuickActions
            actions={visibleActions}
            label={roleView.actionLabel}
            onNavigate={(route) => navigate(route)}
          />
        </div>
      )}
    </main>
  );
}
