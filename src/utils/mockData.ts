import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Clock, ListChecks, Plus, RadioTower } from 'lucide-react';

// StatusTone describes what kind of status a row or badge has.
// ok = done, warn = needs monitoring, akut = requires immediate action.
export type StatusTone = 'ok' | 'warn' | 'akut';

// ModuleTone is used to distinguish between ECT and rTMS in the components.
export type ModuleTone = 'ect' | 'rtms' | 'acuteEct';

// Describes a staffing row in the TESSA bar.
export interface StaffStatus {
  label: string;
  value: string;
  tone: StatusTone;
  detail: string;
}

// Combined type for the TESSA status on the home page.
export interface TessaMockData {
  summary: string;
  lastUpdated: string;
  unreadRemisser: number;
  staff: StaffStatus[];
}

// A status row inside a module card, for example "2 acute ECT cases".
export interface ModuleStatusRow {
  tone: StatusTone;
  count: number;
  label: string;
  route: string;
}

// Data needed for a clickable ECT/rTMS card.
export interface ModuleCardData {
  id: ModuleTone;
  title: string;
  description: string;
  route: string;
  statusTone: StatusTone;
  capacityLabel: string;
  operationalAlert?: {
    label: string;
    detail: string;
    route: string;
  };
  statusRows: ModuleStatusRow[];
}

// Data needed for each quick-action button on the home page.
export interface QuickActionData {
  label: string;
  route: string;
  ariaLabel: string;
  tone: 'default' | 'akut';
  icon: LucideIcon;
}

// landingMock is temporary test data.
// Once the backend/API is ready, the same structure can be replaced with real data.
export const landingMock = {
  // The role is shown in the top navigation.
  role: 'ECT-koordinator',

  tessa: {
    summary: 'Narkos redo · SSK bemannad',
    lastUpdated: '08:42',
    unreadRemisser: 4,
    staff: [
      { label: 'Narkos', value: 'Redo', tone: 'ok', detail: '2 av 2 tillgÃ¤ngliga' },
      { label: 'SjukskÃ¶terska', value: 'Bemannad', tone: 'ok', detail: '3 av 3 tillgÃ¤ngliga' },
      { label: 'LÃ¤kare', value: 'Jour kontaktad', tone: 'warn', detail: '1 vÃ¤ntar bekrÃ¤ftelse' },
    ],
  } satisfies TessaMockData,

  notifications: [
    { id: 'acute-review', title: 'Akut ECT behÃ¶ver bedÃ¶mas', detail: '1 ny akut remiss vÃ¤ntar pÃ¥ prioritering.', fullMessage: 'En ny remiss med rÃ¶d prioritet har registrerats fÃ¶r akut ECT. Remissen behÃ¶ver medicinsk bedÃ¶mning och placering i akutflÃ¶det innan dagens behandlingsplan kan faststÃ¤llas.', time: 'FÃ¶r 8 min sedan', route: '/prioritering?status=Pending', urgent: true },
    { id: 'orbit', title: 'Orbit-underlag saknas', detail: '2 ECT-patienter behÃ¶ver kompletteras.', fullMessage: 'TvÃ¥ patienter i fÃ¶rmiddagens ECT-block saknar komplett Orbit-underlag. Kontrollera att nÃ¶dvÃ¤ndiga uppgifter finns registrerade innan patienterna markeras som behandlingsklara.', time: 'FÃ¶r 24 min sedan', route: '/dashboard?module=ect&filter=attention' },
    { id: 'doctor', title: 'LÃ¤karbekrÃ¤ftelse vÃ¤ntar', detail: 'Bemanningen fÃ¶r fÃ¶rmiddagsblocket Ã¤r inte klar.', fullMessage: 'JourlÃ¤karen Ã¤r kontaktad men har Ã¤nnu inte bekrÃ¤ftat tillgÃ¤nglighet fÃ¶r fÃ¶rmiddagens behandlingsblock. BekrÃ¤ftelsen behÃ¶ver fÃ¶ljas upp fÃ¶re fÃ¶rsta patientens planerade tid.', time: 'FÃ¶r 37 min sedan', route: '/dashboard?module=ect&filter=attention' },
    { id: 'referral', title: 'Ny remiss registrerad', detail: 'En elektiv ECT-remiss har kommit in.', fullMessage: 'En ny elektiv ECT-remiss har registrerats och vÃ¤ntar pÃ¥ fÃ¶rsta prioritering. Kontrollera remissuppgifter, Ã¶nskad behandlingsstart och att kontaktuppgifter till remitterande enhet Ã¤r kompletta.', time: 'FÃ¶r 52 min sedan', route: '/prioritering?status=Pending' },
  ],

  // The modules drive the two large cards on the home page.
  modules: [
    {
      id: 'ect',
      title: 'ECT',
      description: 'Elektrokonvulsiv behandling Â· FÃ¶rmiddagsblock 09:00-12:00',
      route: '/dashboard?module=ect',
      statusTone: 'warn',
      capacityLabel: '9 bokade av 15 platser',
      operationalAlert: {
        label: 'LÃ¤kare vÃ¤ntar bekrÃ¤ftelse',
        detail: '1 bemanningsbesked behÃ¶ver hanteras fÃ¶re behandlingsblocket.',
        route: '/dashboard?module=ect&filter=attention',
      },
      statusRows: [
        // Each status row has its own route so the user can jump straight to the right filter.
        { tone: 'ok', count: 7, label: 'klara fÃ¶r behandling', route: '/dashboard?module=ect&filter=ok' },
        { tone: 'warn', count: 2, label: 'vÃ¤ntar Orbit', route: '/dashboard?module=ect&filter=attention' },
        { tone: 'akut', count: 2, label: 'akuta ECT-fall', route: '/dashboard?module=ect&filter=akut' },
      ],
    },
    {
      id: 'rtms',
      title: 'rTMS',
      description: 'Repetitiv transkraniell magnetstimulering Â· Eftermiddagsblock 13:00-15:30',
      route: '/rtms?module=rtms',
      statusTone: 'ok',
      capacityLabel: '7 bokade av 15 platser',
      statusRows: [
        // The rTMS rows link to the rTMS view and pass the filter in the URL.
        { tone: 'ok', count: 6, label: 'klara fÃ¶r behandling', route: '/rtms?module=rtms&filter=ok' },
        { tone: 'warn', count: 1, label: 'vÃ¤ntar bedÃ¶mning', route: '/rtms?module=rtms&filter=attention' },
        { tone: 'akut', count: 0, label: 'akuta Ã¤renden', route: '/rtms?module=rtms&filter=akut' },
      ],
    },
    {
      id: 'acuteEct',
      title: 'Akut ECT',
      description: 'Akut elektrokonvulsiv behandling Â· Prioriterat flÃ¶de fÃ¶r omedelbar handlÃ¤ggning',
      route: '/dashboard?module=ect&filter=akut',
      statusTone: 'akut',
      capacityLabel: '2 aktuella akuta Ã¤renden',
      statusRows: [
        { tone: 'ok', count: 1, label: 'klar fÃ¶r akut behandling', route: '/dashboard?module=ect&filter=akut&status=ok' },
        { tone: 'warn', count: 1, label: 'vÃ¤ntar bedÃ¶mning', route: '/dashboard?module=ect&filter=akut&status=attention' },
        { tone: 'akut', count: 2, label: 'krÃ¤ver omedelbar Ã¥tgÃ¤rd', route: '/dashboard?module=ect&filter=akut' },
      ],
    },
  ] satisfies ModuleCardData[],

  // The quick actions are shown as buttons under the module cards.
  quickActions: [
    { label: 'Ny remiss', route: '/bokning', ariaLabel: 'Skapa ny remiss', tone: 'default', icon: Plus },
    { label: 'Prioriteringslista', route: '/prioritering', ariaLabel: 'Ã–ppna prioriteringslista', tone: 'default', icon: ListChecks },
  ] satisfies QuickActionData[],
};

// Maps each status to an icon from lucide-react.
export const statusIconByTone: Record<StatusTone, LucideIcon> = {
  ok: CheckCircle2,
  warn: Clock,
  akut: AlertTriangle,
};

// The icon can be used when TESSA is summarized.
export const tessaSummaryIcon = RadioTower;


