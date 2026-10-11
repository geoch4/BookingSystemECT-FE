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
import { getAllowedPortalMode } from '../config/portal';
import { DEMO_MODE } from '../config/demo';
import { getDemoBookings } from '../utils/demoBookings';
import type { AppRole } from '../utils/permissions';
import { useLanguage } from '../context/LanguageContext';

// Formats today's date as a long Swedish date string for the header.
function todayLabel(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());
}

// ─── Inline styles ────────────────────────────────────────────────────────────

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
    border: '1px solid var(--border)',
    borderRadius: 16,
    background: 'rgba(255, 252, 247, 0.74)',
    boxShadow: '0 5px 14px rgba(23, 32, 51, 0.08)',
  },
  introCard: {
    background: 'linear-gradient(135deg, #FFFCF7 0%, #F7F4FF 52%, #F2FAF8 100%)',
    border: '1px solid var(--border)',
    borderRadius: 18,
    padding: '22px 24px',
    boxShadow: '0 10px 28px rgba(23, 32, 51, 0.08)',
    marginBottom: 20,
  },
  body: {
    margin: '8px 0 0',
    color: 'var(--text-muted)',
    fontSize: 14.5,
    lineHeight: 1.6,
    maxWidth: 760,
  },
  rolePanel: {
    marginTop: 18,
    marginBottom: 20,
    border: '1px solid var(--border)',
    borderRadius: 16,
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F6FAFF 55%, #F7FBF8 100%)',
    boxShadow: '0 12px 30px rgba(23, 32, 51, 0.10)',
    padding: '18px 20px',
  },
  roleHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  roleEyebrow: {
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color: 'var(--ect-color)',
  },
  focusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 10,
    marginTop: 14,
  },
  focusButton: {
    textAlign: 'left',
    border: '1px solid #CFE0F2',
    borderRadius: 12,
    background: '#FFFFFF',
    padding: '12px 14px',
    color: 'var(--text-main)',
    boxShadow: '0 6px 14px rgba(21, 99, 170, 0.08)',
    cursor: 'pointer',
    transition: 'transform 0.14s, box-shadow 0.14s, border-color 0.14s',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
};

// ─── Role-based landing view ──────────────────────────────────────────────────
// Different roles see a different title, description, and set of modules/quick
// actions on the home page, based on a loose match against the user's role name.

type RoleView = {
  roleLabel: string;
  actionLabel: string;
  title: string;
  description: string;
  actionNames: string[];
  moduleIds: ModuleTone[];
  focusActions: { label: string; detail: string; route: string }[];
};

// Picks the landing page content for the current user's role.
// Falls back to the ECT coordinator view if the role doesn't match a known pattern.
function getRoleView(role?: string, appRole?: AppRole | null): RoleView {
  const normalizedRole = role?.trim().toLowerCase() ?? '';

  if (appRole === 'admin') {
    return {
      roleLabel: 'Admin',
      actionLabel: 'Systemverktyg',
      title: 'Administrativ översikt',
      description: 'Hantera de delar som behövs för att MVP-flödet ska fungera stabilt.',
      actionNames: [],
      moduleIds: [],
      focusActions: [
        { label: 'Remisskö', detail: 'Se inkomna ärenden och rolltesta behandlingsflödet', route: '/remissko' },
        { label: 'Dagens lista', detail: 'Kontrollera aktuell behandlingsdag och utskrift', route: '/dagens-lista' },
        { label: 'Användare', detail: 'Hantera konton och roller', route: '/admin/users' },
        { label: 'Spårbarhet', detail: 'Granska loggar inför produktion', route: '/admin/audit' },
      ],
    };
  }

  if (
    appRole === 'medical-responsible'
    ||
    normalizedRole.includes('överläk') || normalizedRole.includes('overlak')
    || normalizedRole === 'öl' || normalizedRole.includes('doctor')
  ) {
    return {
      roleLabel: 'Överläkare',
      actionLabel: 'Remissarbete',
      title: 'Remisser att bedöma',
      description: 'Granska prioriteringar, akuta ECT-ärenden och medicinska underlag.',
      actionNames: [],
      moduleIds: ['ect', 'rtms'],
      focusActions: [
        { label: 'Prioriteringslista', detail: 'Remisser som behöver medicinskt beslut', route: '/remissko' },
        { label: 'Dagens lista', detail: 'Patienter i dagens behandlingsflöde', route: '/dagens-lista' },
      ],
    };
  }

  if (normalizedRole.includes('narkos') || normalizedRole.includes('anestesi')) {
    return {
      roleLabel: 'Narkossjuksköterska',
      actionLabel: 'Inför behandling',
      title: 'Dagens lista',
      description: 'Se dagens behandlingsflöde och vilka patienter som behöver förberedas.',
      actionNames: [],
      moduleIds: ['ect'],
      focusActions: [
        { label: 'Dagens lista', detail: 'Patienter som ska behandlas idag', route: '/dagens-lista' },
        { label: 'ECT-dashboard', detail: 'Bemanning, status och slotar', route: '/dashboard?module=ect' },
      ],
    };
  }

  return {
    roleLabel: 'ECT-koordinator',
    actionLabel: 'Koordinatorverktyg',
    title: 'Dagens behandlingsflöde',
    description: 'Översikt över beläggning och bemanning. Välj en modul för att arbeta vidare.',
    actionNames: ['Prioriteringslista'],
    moduleIds: ['ect', 'rtms'],
    focusActions: [
      { label: 'Ny bokning', detail: 'Lägg patient i ledig behandlingsslot', route: '/bookings?action=new' },
      { label: 'Prioriteringslista', detail: 'Fånga upp remisser som behöver åtgärd', route: '/remissko' },
      { label: 'Dagens lista', detail: 'Se aktuellt flöde för ECT och rTMS', route: '/dagens-lista' },
    ],
  };
}

const ECT_CAPACITY = 15;
const RTMS_CAPACITY = 15;

// Merges today's real bookings into the mock module card data (landingMock.modules),
// replacing the static counts/status with live numbers computed from the API.
function buildLiveModules(
  bookings: { date: string; status: string; priority: string; treatmentTypeId: number }[],
): ModuleCardData[] {
  const today = new Date().toISOString().slice(0, 10);
  const todayActive = bookings.filter((b) => b.date.slice(0, 10) === today && b.status !== 'Cancelled');

  const ect  = todayActive.filter((b) => isEctType(b.treatmentTypeId));
  const rtms = todayActive.filter((b) => isRtmsType(b.treatmentTypeId));

  // Buckets a list of bookings into ready (ok), needs-attention (warn), and acute (akut) counts.
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

function DepartmentLandingPage() {
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const bookings = DEMO_MODE ? [...(bookingsQuery.data ?? []), ...getDemoBookings()] : bookingsQuery.data ?? [];
  const liveModules = buildLiveModules(bookings).filter((m) => m.id === 'ect' || m.id === 'rtms');

  return (
    <main style={styles.page}>
      <div style={styles.headRow}>
        <h1 style={styles.title}>Avdelningsportal</h1>
        <div style={styles.date}>
          <CalendarDays size={15} color="var(--ect-color)" aria-hidden="true" />
          {todayLabel(locale)}
        </div>
      </div>

      <section style={styles.introCard}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ect-color)' }}>
          Psykiatrins gemensamma remiss- och bokningsflöde
        </div>
        <h2 style={{ ...styles.title, marginTop: 8 }}>Skicka remisser och hantera patientens behandlingstid</h2>
        <p style={styles.body}>
          Här kan avdelningen skapa remisser för ECT och rTMS, följa sina remisser och se patientens bokade tider.
        </p>
      </section>

      <section style={styles.rolePanel} aria-label="Avdelningens huvuduppgifter">
        <div style={styles.roleHeader}>
          <div>
            <div style={styles.roleEyebrow}>Avdelning</div>
            <h2 style={{ ...styles.title, fontSize: 20, marginTop: 4 }}>Vad behöver du göra?</h2>
          </div>
          <p style={{ ...styles.body, margin: 0, maxWidth: 520 }}>
            Börja med remissen, följ skickade ärenden separat och se bekräftade tider när behandlingsenheten har bokat.
          </p>
        </div>
        <div style={styles.focusGrid}>
          {[
            { label: 'Förbered ny remiss', detail: 'Skapa ECT- eller rTMS-remiss steg för steg', route: '/ny-remiss' },
            { label: 'Mina remisser', detail: 'Utkast, skickade remisser och ärenden som behöver kompletteras', route: '/referrals' },
            { label: 'Bekräftade tider', detail: 'Patienter där behandlingsenheten har bekräftat datum och tid', route: '/bekraftade-tider' },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              style={styles.focusButton}
              onClick={() => navigate(action.route)}
            >
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800 }}>{action.label}</span>
              <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {action.detail}
              </span>
            </button>
          ))}
        </div>
      </section>

      {bookingsQuery.isError && !DEMO_MODE && (
        <BackendErrorState
          error={bookingsQuery.error}
          onRetry={() => void bookingsQuery.refetch()}
        />
      )}

      {DEMO_MODE && bookingsQuery.isError && (
        <BackendErrorState
          compact
          title="Backend kan inte nås - visar exempeldata"
          message="Startsidan använder demo-siffror just nu. Kontrollera backend innan skarp drift."
          error={bookingsQuery.error}
          onRetry={() => void bookingsQuery.refetch()}
        />
      )}

      {(!bookingsQuery.isError || DEMO_MODE) && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={styles.sectionLabel}>Behandlingsspår</div>
              <h2 style={{ ...styles.title, fontSize: 22 }}>Behandlingsöversikt</h2>
              <p style={{ ...styles.body, marginTop: 4 }}>
                Välj ECT eller rTMS för att se rätt behandlingsblock och åtgärder för just den behandlingen.
              </p>
            </div>
          </div>

          <div style={styles.grid}>
            {liveModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onOpen={(route) => navigate(route)}
                onStatusOpen={(route) => navigate(route)}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function AdminLandingPage() {
  const navigate = useNavigate();
  const { user, appRole } = useAuth();
  const { locale } = useLanguage();
  const roleView = getRoleView(user?.role, appRole);

  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const bookings = DEMO_MODE ? [...(bookingsQuery.data ?? []), ...getDemoBookings()] : bookingsQuery.data ?? [];
  const liveModules = buildLiveModules(bookings);

  // Only show the modules/actions relevant to the current user's role.
  const visibleActions = landingMock.quickActions.filter((a) => roleView.actionNames.includes(a.label));
  const visibleModules = liveModules.filter((m) => roleView.moduleIds.includes(m.id));

  return (
    <main style={styles.page}>
      <div style={styles.headRow}>
        <h1 style={styles.title}>{roleView.title}</h1>
        <div style={styles.date}>
          <CalendarDays size={15} color="var(--ect-color)" aria-hidden="true" />
          {todayLabel(locale)}
        </div>
      </div>

      <TessaBar data={landingMock.tessa} />

      <section style={styles.rolePanel} aria-label="Rollanpassad arbetsvy">
        <div style={styles.roleHeader}>
          <div>
            <div style={styles.roleEyebrow}>{roleView.roleLabel}</div>
            <h2 style={{ ...styles.title, fontSize: 20, marginTop: 4 }}>{roleView.title}</h2>
          </div>
          <p style={{ ...styles.body, margin: 0, maxWidth: 520 }}>{roleView.description}</p>
        </div>
        <div style={styles.focusGrid}>
          {roleView.focusActions.map((action) => (
            <button
              key={action.label}
              type="button"
              style={styles.focusButton}
              onClick={() => navigate(action.route)}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = 'translateY(-1px)';
                event.currentTarget.style.boxShadow = '0 10px 20px rgba(21, 99, 170, 0.14)';
                event.currentTarget.style.borderColor = '#9FC4EB';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = 'translateY(0)';
                event.currentTarget.style.boxShadow = '0 6px 14px rgba(21, 99, 170, 0.08)';
                event.currentTarget.style.borderColor = '#CFE0F2';
              }}
            >
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800 }}>{action.label}</span>
              <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {action.detail}
              </span>
            </button>
          ))}
        </div>
      </section>

      {bookingsQuery.isError && !DEMO_MODE && (
        <BackendErrorState
          error={bookingsQuery.error}
          onRetry={() => void bookingsQuery.refetch()}
        />
      )}

      {DEMO_MODE && bookingsQuery.isError && (
        <BackendErrorState
          compact
          title="Backend kan inte nås - visar exempeldata"
          message="Startsidan använder demo-siffror just nu. Kontrollera backend innan skarp drift."
          error={bookingsQuery.error}
          onRetry={() => void bookingsQuery.refetch()}
        />
      )}

      {(!bookingsQuery.isError || DEMO_MODE) && <div style={styles.grid}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user } = useAuth();
  const portalMode = getAllowedPortalMode(user?.role);

  if (portalMode === 'department') return <DepartmentLandingPage />;
  return <AdminLandingPage />;
}
