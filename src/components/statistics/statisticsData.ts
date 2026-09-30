import type { CSSProperties } from 'react';
import type { BookingDto } from '../../types';
import { isEctType, isRtmsType } from '../../types';

export type ModuleFilter = 'all' | 'ect' | 'rtms';
export type Tone = 'ect' | 'rtms' | 'ok' | 'warn' | 'akut';

export interface Metric {
  module: ModuleFilter;
  label: string;
  value: string;
  detail: string;
  trend: string;
  trendGood: boolean;
  tone: Tone;
}

export interface Improvement {
  module: ModuleFilter;
  title: string;
  count: number;
  impact: string;
  nextStep: string;
  owner: string;
  tone: Tone;
}

export interface RegistryItem {
  module: ModuleFilter;
  label: string;
  completed: number;
  total: number;
  status: string;
  tone: Tone;
}

export const metrics: Metric[] = [
  { module: 'ect',  label: 'ECT genomförda',  value: '42',      detail: 'senaste 30 dagarna',            trend: '+8% mot förra månaden', trendGood: true,  tone: 'ect'  },
  { module: 'rtms', label: 'rTMS genomförda', value: '68',      detail: 'senaste 30 dagarna',            trend: '+5% mot förra månaden', trendGood: true,  tone: 'rtms' },
  { module: 'all',  label: 'Medelväntetid',   value: '6 dagar', detail: 'remiss till första behandling', trend: '-2 dagar',              trendGood: true,  tone: 'ok'   },
  { module: 'all',  label: 'Akuta ärenden',   value: '7',       detail: 'krävde prioritering',           trend: '+3 ärenden',            trendGood: false, tone: 'akut' },
];

export const improvements: Improvement[] = [
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

export const registry: RegistryItem[] = [
  { module: 'ect',  label: 'ECT registrerade behandlingar',  completed: 38, total: 42,  status: '4 saknar komplettering',  tone: 'warn' },
  { module: 'rtms', label: 'rTMS registrerade behandlingar', completed: 64, total: 68,  status: 'På god väg',              tone: 'ok'   },
  { module: 'all',  label: 'Uppföljningsskattningar',         completed: 91, total: 110, status: '19 kvar att följa upp',   tone: 'warn' },
  { module: 'all',  label: 'Ofullständig kvalitetsdata',      completed: 2,  total: 110, status: 'Kräver åtgärd',           tone: 'akut' },
];

export const toneStyles: Record<Tone, { color: string; bg: string }> = {
  ect:  { color: 'var(--ect-color)',  bg: 'var(--ect-bg)'  },
  rtms: { color: 'var(--rtms-color)', bg: 'var(--rtms-bg)' },
  ok:   { color: 'var(--ok-color)',   bg: 'var(--ok-bg)'   },
  warn: { color: 'var(--warn-color)', bg: 'var(--warn-bg)' },
  akut: { color: 'var(--akut-color)', bg: 'var(--akut-bg)' },
};

export const styles: Record<string, CSSProperties> = {
  page:         { padding: 24, maxWidth: 1180, margin: '0 auto' },
  top:          { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24 },
  eyebrow:      { color: 'var(--text-subtle)', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title:        { margin: 0, color: 'var(--text-main)', fontSize: 24, fontWeight: 600, lineHeight: 1.2 },
  body:         { margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5 },
  filterBar:    { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  filterButton: { minHeight: 44, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text-muted)', padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 750, cursor: 'pointer' },
  insight:      { border: '1px solid rgba(168, 100, 5, 0.28)', background: 'var(--warn-bg)', color: 'var(--text-main)', borderRadius: 8, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 },
  metricGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 },
  card:         { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 },
  sectionGrid:  { display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap: 24 },
  sectionTitle: { margin: '0 0 16px', color: 'var(--text-main)', fontSize: 18, fontWeight: 700 },
  row:          { minHeight: 76, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, borderTop: '1px solid var(--border)', padding: '16px 0' },
  chip:         { minHeight: 32, borderRadius: 999, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' },
};

export function appliesToFilter(itemModule: ModuleFilter, filter: ModuleFilter) {
  return filter === 'all' || itemModule === filter || itemModule === 'all';
}

export function filterLabel(filter: ModuleFilter) {
  if (filter === 'ect') return 'ECT';
  if (filter === 'rtms') return 'rTMS';
  return 'Alla';
}

export function completionPercent(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

function countByModule(bookings: BookingDto[], predicate: (booking: BookingDto) => boolean) {
  const matching = bookings.filter(predicate);
  return {
    ect: matching.filter((booking) => isEctType(booking.treatmentTypeId)).length,
    rtms: matching.filter((booking) => isRtmsType(booking.treatmentTypeId)).length,
    all: matching.length,
  };
}

function averageWaitingDays(bookings: BookingDto[]) {
  const confirmed = bookings.filter((booking) => booking.status === 'Confirmed');
  if (confirmed.length === 0) return 0;

  const totalDays = confirmed.reduce((sum, booking) => {
    const created = new Date(booking.createdAt).getTime();
    const scheduled = new Date(booking.date).getTime();
    if (!Number.isFinite(created) || !Number.isFinite(scheduled)) return sum;
    return sum + Math.max(0, Math.round((scheduled - created) / (1000 * 60 * 60 * 24)));
  }, 0);

  return Math.round(totalDays / confirmed.length);
}

export function buildMetricsFromBookings(bookings: BookingDto[]): Metric[] {
  const active = bookings.filter((booking) => booking.status !== 'Cancelled');
  const confirmed = countByModule(active, (booking) => booking.status === 'Confirmed');
  const acute = active.filter((booking) => booking.priority === 'Red').length;
  const waitingDays = averageWaitingDays(active);

  return [
    { module: 'ect',  label: 'ECT bekräftade',  value: String(confirmed.ect),  detail: 'bokningar från backend', trend: 'Live från bokningsdata', trendGood: true, tone: 'ect' },
    { module: 'rtms', label: 'rTMS bekräftade', value: String(confirmed.rtms), detail: 'bokningar från backend', trend: 'Live från bokningsdata', trendGood: true, tone: 'rtms' },
    { module: 'all',  label: 'Medelväntetid',   value: `${waitingDays} dagar`, detail: 'skapad till bokad tid',   trend: active.length ? 'Beräknad från bokningar' : 'Inga bokningar ännu', trendGood: true, tone: 'ok' },
    { module: 'all',  label: 'Akuta ärenden',   value: String(acute),          detail: 'röd prioritet',           trend: acute > 0 ? 'Kräver bevakning' : 'Inga akuta ärenden', trendGood: acute === 0, tone: 'akut' },
  ];
}

export function buildImprovementsFromBookings(bookings: BookingDto[]): Improvement[] {
  const active = bookings.filter((booking) => booking.status !== 'Cancelled');
  const missingHealth = active.filter((booking) => booking.healthDeclarationStatus !== 'Complete').length;
  const missingAnesthesia = active.filter((booking) => booking.anesthesiaAssessmentStatus === 'Incomplete' || booking.anesthesiaAssessmentStatus === 'NotStarted').length;
  const cancelledWithoutReason = bookings.filter((booking) => booking.status === 'Cancelled' && !booking.cancellationReason).length;

  return [
    {
      module: 'ect',
      title: 'Hälsodeklaration saknas',
      count: missingHealth,
      impact: 'Bokningar utan komplett hälsodeklaration behöver kompletteras före behandling.',
      nextStep: 'Följ upp remisser där hälsodeklarationen inte är markerad komplett.',
      owner: 'Avdelning',
      tone: missingHealth > 0 ? 'warn' : 'ok',
    },
    {
      module: 'ect',
      title: 'Anestesiunderlag saknas',
      count: missingAnesthesia,
      impact: 'ECT-flödet riskerar försening när anestesiunderlag inte är komplett.',
      nextStep: 'Prioritera patienter med röd prioritet och ofullständigt anestesiunderlag.',
      owner: 'Narkos',
      tone: missingAnesthesia > 0 ? 'akut' : 'ok',
    },
    {
      module: 'all',
      title: 'Otydlig orsak till avbokning',
      count: cancelledWithoutReason,
      impact: 'Svårt att se om bortfall beror på patient, kapacitet eller förberedelser.',
      nextStep: 'Registrera avbokningsorsak när en tid avbokas.',
      owner: 'System',
      tone: cancelledWithoutReason > 0 ? 'warn' : 'ok',
    },
  ];
}

export function buildRegistryFromBookings(bookings: BookingDto[]): RegistryItem[] {
  const active = bookings.filter((booking) => booking.status !== 'Cancelled');
  const ect = active.filter((booking) => isEctType(booking.treatmentTypeId));
  const rtms = active.filter((booking) => isRtmsType(booking.treatmentTypeId));
  const completeHealth = active.filter((booking) => booking.healthDeclarationStatus === 'Complete').length;
  const incomplete = active.length - completeHealth;

  return [
    { module: 'ect',  label: 'ECT registrerade behandlingar',  completed: ect.filter((booking) => booking.status === 'Confirmed').length, total: ect.length,  status: `${ect.length} ECT-bokningar`,  tone: ect.length ? 'warn' : 'ok' },
    { module: 'rtms', label: 'rTMS registrerade behandlingar', completed: rtms.filter((booking) => booking.status === 'Confirmed').length, total: rtms.length, status: `${rtms.length} rTMS-bokningar`, tone: 'ok' },
    { module: 'all',  label: 'Kompletta hälsounderlag',        completed: completeHealth, total: active.length, status: `${incomplete} kvar att komplettera`, tone: incomplete > 0 ? 'warn' : 'ok' },
    { module: 'all',  label: 'Ofullständig kvalitetsdata',     completed: incomplete, total: active.length || 1, status: incomplete > 0 ? 'Kräver åtgärd' : 'Ingen lucka hittad', tone: incomplete > 0 ? 'akut' : 'ok' },
  ];
}
