import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import TopNav from '../components/common/TopNav';
import TessaBar from '../components/common/TessaBar';
import AcuteModuleBanner from '../components/dashboard/AcuteModuleBanner';
import ModuleCard from '../components/dashboard/ModuleCard';
import QuickActions from '../components/dashboard/QuickActions';
import { useAuth } from '../context/useAuth';
import type { ModuleTone, ModuleCardData } from '../utils/mockData';
import { landingMock } from '../utils/mockData';
import { getBookings } from '../api/bookings';
import { isEctType, isRtmsType } from '../types';

// Formaterar dagens datum på svenska för toppnavigationen.
function todayLabel() {
  return new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

// Samlade inline-styles för sidan.
// Det gör komponenten lättare att läsa än om varje style låg direkt i JSX:en.
const styles: Record<string, CSSProperties> = {
  // Hela sidans bakgrund och avstånd under den fasta toppbaren.
  page: {
    minHeight: '100vh',
    background: 'var(--page-bg)',
    color: 'var(--text-main)',
    paddingTop: 72,
  },
  // Huvudinnehållet centreras och får en maxbredd så det blir lättläst.
  main: {
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    padding: '24px',
  },
  // Rubrikblocket ovanför modulkorten.
  heading: {
    marginBottom: 16,
  },
  // Liten sektionsetikett, till exempel "Välj modul".
  sectionLabel: {
    color: 'var(--text-subtle)',
    fontSize: 'var(--type-label)',
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  // Huvudrubriken på startsidan.
  title: {
    margin: 0,
    color: 'var(--text-main)',
    fontSize: 'var(--type-display)',
    fontWeight: 750,
    lineHeight: 1.15,
  },
  // Brödtext under rubriken.
  body: {
    margin: '8px 0 0',
    color: 'var(--text-muted)',
    fontSize: 15,
    lineHeight: 1.55,
  },
  // Responsivt rutnät: två kort på stor skärm, ett kort på mindre skärm.
  moduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24,
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
    normalizedRole.includes('överläk')
    || normalizedRole.includes('overlak')
    || normalizedRole === 'öl'
    || normalizedRole.includes('doctor')
  ) {
    return {
      roleLabel: 'Överläkare',
      actionLabel: 'Remissarbete',
      title: 'Remisser att bedöma',
      description: 'Granska prioriteringar, akuta ECT-ärenden och medicinska underlag.',
      actionNames: ['Prioriteringslista', 'Styrdokument'],
      moduleIds: ['acuteEct', 'ect'],
    };
  }

  if (normalizedRole.includes('narkos') || normalizedRole.includes('anestesi')) {
    return {
      roleLabel: 'Narkossjuksköterska',
      actionLabel: 'Inför behandling',
      title: 'Behandlingsberedskap',
      description: 'Se dagens ECT-flöde, akuta patienter och relevanta styrdokument.',
      actionNames: ['Styrdokument'],
      moduleIds: ['ect', 'acuteEct'],
    };
  }

  return {
    roleLabel: 'ECT-koordinator',
    actionLabel: 'Koordinatorverktyg',
    title: 'Dagens behandlingsflöde',
    description: 'Hantera remisser, prioriteringar och tillgängliga behandlingsplatser.',
    actionNames: ['Ny remiss', 'Prioriteringslista', 'Styrdokument', 'Statistik & Kvalitet'],
    moduleIds: ['ect', 'rtms', 'acuteEct'],
  };
}

const ECT_CAPACITY = 12;
const RTMS_CAPACITY = 13;

function buildLiveModules(
  bookings: { date: string; status: string; priority: string; treatmentType: number }[],
): ModuleCardData[] {
  const today = new Date().toISOString().slice(0, 10);
  const todayActive = bookings.filter((b) => b.date.slice(0, 10) === today && b.status !== 'Cancelled');

  const ect = todayActive.filter((b) => isEctType(b.treatmentType));
  const rtms = todayActive.filter((b) => isRtmsType(b.treatmentType));

  function stats(list: typeof ect) {
    const akut = list.filter((b) => b.priority === 'Red').length;
    const ok = list.filter((b) => b.status === 'Confirmed' && b.priority !== 'Red').length;
    const warn = list.length - akut - ok;
    return { booked: list.length, akut, ok, warn: Math.max(warn, 0) };
  }

  const es = stats(ect);
  const rs = stats(rtms);

  return landingMock.modules.map((m) => {
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
      };
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
      };
    }
    return m;
  });
}

export default function LandingPage() {
  // useNavigate används för att byta sida när användaren klickar på kort/knappar.
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleView = getRoleView(user?.role);

  const { data: bookings = [] } = useQuery({ queryKey: ['bookings'], queryFn: getBookings });

  const liveModules = buildLiveModules(bookings);

  const visibleActions = landingMock.quickActions.filter((action) => roleView.actionNames.includes(action.label));
  const visibleModules = liveModules.filter((module) => roleView.moduleIds.includes(module.id));
  const acuteModule = visibleModules.find((module) => module.id === 'acuteEct');
  const regularModules = visibleModules.filter((module) => module.id !== 'acuteEct');

  return (
    <div style={styles.page}>
      {/* Fast toppnavigation med systemnamn, roll, datum och remissnotiser. */}
      <TopNav
        systemName="ECT & rTMS · Sahlgrenska"
        role={roleView.roleLabel}
        dateLabel={todayLabel()}
        unreadCount={landingMock.tessa.unreadRemisser}
        notifications={landingMock.notifications}
        onNotificationOpen={(route) => navigate(route)}
      />

      <main style={styles.main}>
        {/* TESSA-status visas först eftersom bemanning påverkar dagens behandlingsflöde. */}
        <TessaBar data={landingMock.tessa} />

        {acuteModule && <AcuteModuleBanner module={acuteModule} onOpen={(route) => navigate(route)} />}

        {/* De vanligaste arbetsflödena ska nås direkt utan att användaren behöver scrolla. */}
        <QuickActions
          actions={visibleActions}
          label={roleView.actionLabel}
          onNavigate={(route) => navigate(route)}
        />

        {/* Modulvalet är startsidans viktigaste del: ECT eller rTMS. */}
        <section aria-labelledby="module-heading">
          <div style={styles.heading}>
            <div style={styles.sectionLabel}>Din arbetsvy</div>
            <h1 id="module-heading" style={styles.title}>
              {roleView.title}
            </h1>
            <p style={styles.body}>{roleView.description}</p>
          </div>

          <div style={styles.moduleGrid}>
            {/* Varje modul i mockData blir ett klickbart ModuleCard. */}
            {regularModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                // Klick på hela kortet går till modulens huvudvy.
                onOpen={(route) => navigate(route)}
                // Klick på en statusrad går direkt till filtrerad vy.
                onStatusOpen={(route) => navigate(route)}
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
