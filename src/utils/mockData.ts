import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, BarChart3, CheckCircle2, Clock, FileText, ListChecks, Plus, RadioTower } from 'lucide-react';

// StatusTone beskriver vilken typ av status en rad eller badge har.
// ok = klart, warn = behöver bevakas, akut = kräver snabb åtgärd.
export type StatusTone = 'ok' | 'warn' | 'akut';

// ModuleTone används för att skilja mellan ECT och rTMS i komponenterna.
export type ModuleTone = 'ect' | 'rtms' | 'acuteEct';

// Beskriver en bemanningsrad i TESSA-baren.
export interface StaffStatus {
  label: string;
  value: string;
  tone: StatusTone;
  detail: string;
}

// Samlad typ för TESSA-statusen på startsidan.
export interface TessaMockData {
  summary: string;
  lastUpdated: string;
  rast: string;
  unreadRemisser: number;
  staff: StaffStatus[];
}

// En statusrad inne i ett modulkort, till exempel "2 akuta ECT-fall".
export interface ModuleStatusRow {
  tone: StatusTone;
  count: number;
  label: string;
  route: string;
}

// Data som behövs för ett klickbart ECT/rTMS-kort.
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

// Data som behövs för varje snabbknapp på startsidan.
export interface QuickActionData {
  label: string;
  route: string;
  ariaLabel: string;
  tone: 'default' | 'akut';
  icon: LucideIcon;
}

// landingMock är tillfällig testdata.
// När backend/API är redo kan samma struktur ersättas med riktig data.
export const landingMock = {
  // Rollen visas i toppnavigationen.
  role: 'ECT-koordinator',

  // TESSA visar bemanning, rast och antal olästa remisser.
  tessa: {
    summary: 'Narkos redo · SSK bemannad · Rast 12:15-12:45',
    lastUpdated: '08:42',
    rast: '12:15-12:45',
    unreadRemisser: 4,
    staff: [
      { label: 'Narkos', value: 'Redo', tone: 'ok', detail: '2 av 2 tillgängliga' },
      { label: 'Sjuksköterska', value: 'Bemannad', tone: 'ok', detail: '3 av 3 tillgängliga' },
      { label: 'Läkare', value: 'Jour kontaktad', tone: 'warn', detail: '1 väntar bekräftelse' },
      { label: 'Rast', value: '12:15-12:45', tone: 'ok', detail: 'Buffert kvar 15 min' },
    ],
  } satisfies TessaMockData,

  notifications: [
    { id: 'acute-review', title: 'Akut ECT behöver bedömas', detail: '1 ny akut remiss väntar på prioritering.', fullMessage: 'En ny remiss med röd prioritet har registrerats för akut ECT. Remissen behöver medicinsk bedömning och placering i akutflödet innan dagens behandlingsplan kan fastställas.', time: 'För 8 min sedan', route: '/prioritering?status=Pending', urgent: true },
    { id: 'orbit', title: 'Orbit-underlag saknas', detail: '2 ECT-patienter behöver kompletteras.', fullMessage: 'Två patienter i förmiddagens ECT-block saknar komplett Orbit-underlag. Kontrollera att nödvändiga uppgifter finns registrerade innan patienterna markeras som behandlingsklara.', time: 'För 24 min sedan', route: '/dashboard?module=ect&filter=attention' },
    { id: 'doctor', title: 'Läkarbekräftelse väntar', detail: 'Bemanningen för förmiddagsblocket är inte klar.', fullMessage: 'Jourläkaren är kontaktad men har ännu inte bekräftat tillgänglighet för förmiddagens behandlingsblock. Bekräftelsen behöver följas upp före första patientens planerade tid.', time: 'För 37 min sedan', route: '/dashboard?module=ect&filter=attention' },
    { id: 'referral', title: 'Ny remiss registrerad', detail: 'En elektiv ECT-remiss har kommit in.', fullMessage: 'En ny elektiv ECT-remiss har registrerats och väntar på första prioritering. Kontrollera remissuppgifter, önskad behandlingsstart och att kontaktuppgifter till remitterande enhet är kompletta.', time: 'För 52 min sedan', route: '/prioritering?status=Pending' },
  ],

  // Modulerna styr de två stora korten på startsidan.
  modules: [
    {
      id: 'ect',
      title: 'ECT',
      description: 'Elektrokonvulsiv behandling · Förmiddagsblock 09:00-12:00',
      route: '/dashboard?module=ect',
      statusTone: 'warn',
      capacityLabel: '9 bokade av 12 platser',
      operationalAlert: {
        label: 'Läkare väntar bekräftelse',
        detail: '1 bemanningsbesked behöver hanteras före behandlingsblocket.',
        route: '/dashboard?module=ect&filter=attention',
      },
      statusRows: [
        // Varje statusrad har en egen route så användaren kan gå direkt till rätt filter.
        { tone: 'ok', count: 7, label: 'klara för behandling', route: '/dashboard?module=ect&filter=ok' },
        { tone: 'warn', count: 2, label: 'väntar Orbit', route: '/dashboard?module=ect&filter=attention' },
        { tone: 'akut', count: 2, label: 'akuta ECT-fall', route: '/dashboard?module=ect&filter=akut' },
      ],
    },
    {
      id: 'rtms',
      title: 'rTMS',
      description: 'Repetitiv transkraniell magnetstimulering · Eftermiddag 13:00-',
      route: '/rtms?module=rtms',
      statusTone: 'ok',
      capacityLabel: '7 bokade av 13 platser',
      statusRows: [
        // rTMS-raderna går till rTMS-vyn och skickar med filter i URL:en.
        { tone: 'ok', count: 6, label: 'klara för behandling', route: '/rtms?module=rtms&filter=ok' },
        { tone: 'warn', count: 1, label: 'väntar bedömning', route: '/rtms?module=rtms&filter=attention' },
        { tone: 'akut', count: 0, label: 'akuta ärenden', route: '/rtms?module=rtms&filter=akut' },
      ],
    },
    {
      id: 'acuteEct',
      title: 'Akut ECT',
      description: 'Akut elektrokonvulsiv behandling · Prioriterat flöde för omedelbar handläggning',
      route: '/dashboard?module=ect&filter=akut',
      statusTone: 'akut',
      capacityLabel: '2 aktuella akuta ärenden',
      statusRows: [
        { tone: 'ok', count: 1, label: 'klar för akut behandling', route: '/dashboard?module=ect&filter=akut&status=ok' },
        { tone: 'warn', count: 1, label: 'väntar bedömning', route: '/dashboard?module=ect&filter=akut&status=attention' },
        { tone: 'akut', count: 2, label: 'kräver omedelbar åtgärd', route: '/dashboard?module=ect&filter=akut' },
      ],
    },
  ] satisfies ModuleCardData[],

  // Snabbåtgärderna visas som knappar under modulkorten.
  quickActions: [
    { label: 'Ny remiss', route: '/bokning', ariaLabel: 'Skapa ny remiss', tone: 'default', icon: Plus },
    { label: 'Prioriteringslista', route: '/prioritering', ariaLabel: 'Öppna prioriteringslista', tone: 'default', icon: ListChecks },
    { label: 'Styrdokument', route: '/dokument', ariaLabel: 'Öppna styrdokument', tone: 'default', icon: FileText },
    { label: 'Statistik & Kvalitet', route: '/statistik', ariaLabel: 'Öppna statistik och kvalitet', tone: 'default', icon: BarChart3 },
  ] satisfies QuickActionData[],
};

// Kopplar varje status till en ikon från lucide-react.
export const statusIconByTone: Record<StatusTone, LucideIcon> = {
  ok: CheckCircle2,
  warn: Clock,
  akut: AlertTriangle,
};

// Ikonen kan användas när TESSA sammanfattas.
export const tessaSummaryIcon = RadioTower;
