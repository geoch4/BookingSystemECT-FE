import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookings, updateBooking } from '../api/bookings';
import { getPatients } from '../api/patients';
import type { BookingDto, BookingPriority, BookingStatus, CreateBookingDto, PatientDto } from '../types';
import { TREATMENT_TYPE_LABELS, isEctType, isRtmsType } from '../types';
// Hämtar remissmetadata från bokningen, med lokal fallback för äldre bokningar.
import { getAllBookingReferralMeta, getReferralMetaForBooking, type BookingReferralMeta } from '../utils/bookingMeta';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slot {
  time: string; // "HH:MM"
  type: 'ECT' | 'rTMS';
  booking?: BookingDto;
  patient?: PatientDto;
  treatmentTypeName?: string;
}

type ModuleView = 'all' | 'ect' | 'rtms';

// ─── Mock data for features not yet in backend ────────────────────────────────

const TESSA_MOCK = {
  narkos: { available: 3, required: 3, ok: true },
  sjukskoterska: { available: 4, required: 4, ok: true },
  lastFetch: '07:42',
};

const STANDBY_MOCK = [
  { id: 1, name: 'Andersson, Britta', ward: 'Avd 361', urgency: 'hög' as const },
  { id: 2, name: 'Lindqvist, Göran', ward: 'Avd 362', urgency: 'medel' as const },
  { id: 3, name: 'Svensson, Klara', ward: 'Avd 360', urgency: 'medel' as const },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const ECT_TIMES = ['09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45'];
const RTMS_TIMES = ['13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45','16:00'];
const BREAK_OPTIONS = ['12:15–12:45', '12:30–13:00'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatFullDate(ymd: string) {
  return new Date(ymd + 'T12:00:00').toLocaleDateString('sv-SE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}


function getModuleView(pathname: string, search: string): ModuleView {
  const moduleParam = new URLSearchParams(search).get('module');

  if (pathname === '/rtms' || moduleParam === 'rtms') return 'rtms';
  if (moduleParam === 'ect') return 'ect';
  return 'all';
}

function slotStatus(b?: BookingDto): { label: string; bg: string; text: string; border: string } {
  if (!b || b.status === 'Cancelled') return { label: 'Ledig', bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', border: 'border-[#D1D5DB]' };
  if (b.priority === 'Red') return { label: 'AKUT', bg: 'bg-[#FCEBEC]', text: 'text-[#B4232A]', border: 'border-[#B4232A]' };
  if (b.priority === 'Yellow') return { label: 'Obs', bg: 'bg-[#FFF3D8]', text: 'text-[#A86405]', border: 'border-[#A86405]' };
  if (b.status === 'Confirmed') return { label: 'Klar', bg: 'bg-[#E8F6EE]', text: 'text-[#147A4B]', border: 'border-[#147A4B]' };
  return { label: 'Väntande', bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', border: 'border-[#93C5FD]' };
}

function bookingPercent(occupied: number, total: number) {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}

// ─── Quick-status updater ─────────────────────────────────────────────────────

function useQuickUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CreateBookingDto }) => updateBooking(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

// ─── Slot row ─────────────────────────────────────────────────────────────────

function SlotRow({ slot, isBreak, onStatusChange, referralMeta }: {
  slot: Slot;
  isBreak?: boolean;
  onStatusChange: (b: BookingDto, status: BookingStatus, priority: BookingPriority) => void;
  // Metadata visas i patientcellen så koordinatorn ser remitterande avdelning.
  referralMeta?: BookingReferralMeta;
}) {
  const b = slot.booking;
  const cfg = slotStatus(b);

  if (isBreak) {
    return (
      <tr className="border-b border-[#DDE3EC]">
        <td className="px-4 py-3 text-sm font-mono font-semibold text-[#8494AA]">{slot.time}</td>
        <td colSpan={6} className="px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-[#8494AA] italic">
            <span className="w-2 h-2 rounded-full bg-[#8494AA] inline-block" />
            Rast
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`border-b border-[#DDE3EC] hover:bg-[#F8FAFC] transition-colors ${cfg.bg}`}>
      <td className="px-4 py-3 text-sm font-mono font-semibold text-[#4B5770] whitespace-nowrap">{slot.time}</td>

      {b && b.status !== 'Cancelled' ? (
        <>
          <td className="px-4 py-3">
            <div className="text-sm font-medium text-[#1A2332] leading-tight">{slot.patient?.fullName ?? `#${b.patientId}`}</div>
            <div className="text-xs text-[#8494AA] font-mono">{slot.patient?.socialSecurityNumber ?? '–'}</div>
            {/* Avdelning visas direkt under patienten för att snabbt hitta varifrån bokningen kommer. */}
            <div className="text-xs text-[#4B5770] mt-1">
              Avdelning: <span className="font-semibold text-[#1A2332]">{referralMeta?.department || 'Ej angiven'}</span>
            </div>
            {(referralMeta?.contactName || referralMeta?.contactPhone) && (
              <div className="text-[11px] text-[#8494AA] mt-0.5">
                {referralMeta.contactName || 'Kontakt'}{referralMeta.contactPhone ? ` · ${referralMeta.contactPhone}` : ''}
              </div>
            )}
          </td>
          <td className="px-4 py-3 text-sm text-[#4B5770]">{slot.treatmentTypeName ?? '–'}</td>

          {/* Hälsodeklaration – mock placeholder */}
          <td className="px-4 py-3 text-center">
            <span className="text-xs font-semibold text-[#526174]">Ej klar</span>
          </td>

          {/* Anestesi – mock placeholder */}
          <td className="px-4 py-3 text-center">
            <span className="text-xs font-semibold text-[#526174]">Ej klar</span>
          </td>

          <td className="px-4 py-3">
            <div className="flex items-center gap-1">
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                {cfg.label}
              </span>
            </div>
          </td>

          <td className="px-4 py-3">
            <select
              value={`${b.status}:${b.priority}`}
              onChange={(e) => {
                const [status, priority] = e.target.value.split(':') as [BookingStatus, BookingPriority];
                onStatusChange(b, status, priority);
              }}
              className="text-xs border border-[#DDE3EC] rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1A4F8A]"
            >
              <option value="Pending:Green">Väntande – Grön</option>
              <option value="Pending:Yellow">Väntande – Gul</option>
              <option value="Pending:Red">Väntande – Röd</option>
              <option value="Confirmed:Green">Bekräftad – Grön</option>
              <option value="Confirmed:Yellow">Bekräftad – Gul</option>
              <option value="Confirmed:Red">Bekräftad – Röd</option>
              <option value="Cancelled:Green">Avboka</option>
            </select>
          </td>
        </>
      ) : (
        <>
          <td colSpan={5} className="px-4 py-3 text-sm text-[#8494AA] italic">Ledig</td>
          <td className="px-4 py-3" />
        </>
      )}
    </tr>
  );
}

// ─── Slot table ───────────────────────────────────────────────────────────────

function SlotTable({ title, slots, breakAfter, onStatusChange, referralMetaByBookingId }: {
  title: string;
  slots: Slot[];
  breakAfter?: string;
  onStatusChange: (b: BookingDto, s: BookingStatus, p: BookingPriority) => void;
  // Lookup-tabell där bookingId används för att hitta rätt avdelningsinfo.
  referralMetaByBookingId: Record<number, BookingReferralMeta>;
}) {
  const occupied = slots.filter((s) => s.booking && s.booking.status !== 'Cancelled').length;
  const total = slots.length;
  const percent = bookingPercent(occupied, total);

  return (
    <div className="bg-white rounded-xl border border-[#DDE3EC] mb-5">
      <div className="px-5 py-4 border-b border-[#DDE3EC] flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-semibold text-[#1A2332]">{title}</h2>
        <div className="min-w-[170px] rounded-lg border border-[#B8CBE0] bg-[#F6FAFE] px-4 py-3 shadow-sm">
          <div className="text-xl font-bold text-[#185FA5]">{occupied}/{total} bokade</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#DDE7F2]">
            <div
              className="h-full rounded-full bg-[#185FA5] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] table-fixed">
          <colgroup>
            <col className="w-[80px]" />
            <col className="w-[210px]" />
            <col className="w-[110px]" />
            <col className="w-[150px]" />
            <col className="w-[160px]" />
            <col className="w-[90px]" />
            <col className="w-[80px]" />
          </colgroup>
          <thead>
            <tr className="text-left text-xs font-medium text-[#8494AA] uppercase tracking-wider border-b border-[#DDE3EC]">
              <th className="px-4 py-3">Tid</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Behandling</th>
              <th className="px-4 py-3 whitespace-nowrap text-center">Hälsodeklaration</th>
              <th className="px-4 py-3 whitespace-nowrap text-center">Anestesibedömning</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Åtgärd</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <SlotRow
                key={slot.time}
                slot={slot}
                isBreak={slot.time === breakAfter}
                onStatusChange={onStatusChange}
                // Skickar bara metadata till raden om sloten faktiskt har en bokning.
                referralMeta={slot.booking ? getReferralMetaForBooking(slot.booking, referralMetaByBookingId[slot.booking.bookingId]) : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TESSA topbar ─────────────────────────────────────────────────────────────

function TessaBar() {
  const { narkos, sjukskoterska, lastFetch } = TESSA_MOCK;
  return (
    <div className="flex items-center gap-6 bg-[#0F62A8] text-white rounded-xl px-5 py-3 mb-5 text-sm">
      <span className="font-semibold tracking-wide text-xs uppercase opacity-80">TESSA</span>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${narkos.ok ? 'bg-[#34D399]' : 'bg-[#FCA5A5]'}`} />
        <span>Narkos {narkos.available}/{narkos.required}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${sjukskoterska.ok ? 'bg-[#34D399]' : 'bg-[#FCA5A5]'}`} />
        <span>Sjuksköterska {sjukskoterska.available}/{sjukskoterska.required}</span>
      </div>
      <div className="ml-auto text-xs opacity-60">Hämtat {lastFetch}</div>
    </div>
  );
}

// ─── Standby list ─────────────────────────────────────────────────────────────

function StandbyList() {
  const URGENCY_STYLE = {
    hög: 'bg-[#FDEAEA] text-[#C42B2B]',
    medel: 'bg-[#FEF3DC] text-[#D4860A]',
    låg: 'bg-[#F3F4F6] text-[#6B7280]',
  };

  return (
    <div className="bg-white rounded-xl border border-[#DDE3EC]">
      <div className="px-4 py-3 border-b border-[#DDE3EC]">
        <h2 className="font-semibold text-[#1A2332]">Standby-lista</h2>
        <p className="text-xs text-[#8494AA] mt-0.5">{STANDBY_MOCK.length} patienter väntar</p>
      </div>
      <div className="divide-y divide-[#DDE3EC]">
        {STANDBY_MOCK.map((p) => (
          <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-[#F8FAFC]">
            <div>
              <div className="text-sm font-medium text-[#1A2332]">{p.name}</div>
              <div className="text-xs text-[#8494AA]">{p.ward}</div>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${URGENCY_STYLE[p.urgency]}`}>
              {p.urgency}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [breakTime, setBreakTime] = useState(BREAK_OPTIONS[0]);
  const moduleView = getModuleView(location.pathname, location.search);
  // Läser alla lokalt sparade avdelningar en gång när dashboarden renderas.
  const referralMetaByBookingId = getAllBookingReferralMeta();

  const { data: bookings = [] } = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: getPatients });

  const quickUpdate = useQuickUpdate();

  const patientMap: Record<number, PatientDto> = Object.fromEntries(patients.map((p) => [p.patientId, p]));

  // Filter and map bookings for selected date
  const todayBookings = bookings.filter((b) => b.date.slice(0, 10) === selectedDate);

  function buildSlots(times: string[], typeHint: 'ECT' | 'rTMS'): Slot[] {
    const filterFn = typeHint === 'ECT' ? isEctType : isRtmsType;
    const moduleBookings = todayBookings
      .filter((b) => filterFn(b.treatmentType))
      .sort((a, b) => a.date.localeCompare(b.date));

    return times.map((time, i) => {
      const booking = moduleBookings[i];
      return {
        time,
        type: typeHint,
        booking,
        patient: booking ? patientMap[booking.patientId] : undefined,
        treatmentTypeName: booking ? (TREATMENT_TYPE_LABELS[booking.treatmentType] ?? `Typ ${booking.treatmentType}`) : undefined,
      };
    });
  }

  const ectSlots = buildSlots(ECT_TIMES, 'ECT');
  const rtmsSlots = buildSlots(RTMS_TIMES, 'rTMS');

  function handleStatusChange(b: BookingDto, status: BookingStatus, priority: BookingPriority) {
    const dto: CreateBookingDto = {
      date: b.date,
      patientId: b.patientId,
      treatmentType: b.treatmentType,
      createdById: b.createdById,
      createdAt: b.createdAt,
      priority,
      status,
      referralDepartment: b.referralDepartment,
      referralContactName: b.referralContactName,
      referralContactPhone: b.referralContactPhone,
    };
    quickUpdate.mutate({ id: b.bookingId, dto });
  }

  function navigate(delta: number) {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(toYMD(d));
  }

  const visibleBookings = todayBookings.filter((b) => {
    if (moduleView === 'all') return true;
    if (moduleView === 'ect') return isEctType(b.treatmentType);
    return isRtmsType(b.treatmentType);
  });
  const redToday = visibleBookings.filter((b) => b.priority === 'Red' && b.status !== 'Cancelled').length;
  const dashboardTitle =
    moduleView === 'ect' ? 'ECT-dashboard' : moduleView === 'rtms' ? 'rTMS-dashboard' : 'Koordinator-dashboard';

  return (
    <div className="p-5 max-w-7xl mx-auto">
      {/* Header + date nav */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1A2332]">{dashboardTitle}</h1>
          <p className="text-sm text-[#8494AA] capitalize">{formatFullDate(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#DDE3EC] bg-white hover:bg-[#F0F4F8] text-[#4B5770] transition-colors">
            ‹
          </button>
          <button onClick={() => setSelectedDate(toYMD(new Date()))}
            className="px-3 py-1.5 text-xs font-medium border border-[#DDE3EC] bg-white hover:bg-[#F0F4F8] rounded-lg text-[#4B5770] transition-colors">
            Idag
          </button>
          <button onClick={() => navigate(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#DDE3EC] bg-white hover:bg-[#F0F4F8] text-[#4B5770] transition-colors">
            ›
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        {redToday > 0 && (
          <div className="flex items-center gap-2 bg-[#FDEAEA] border border-[#C42B2B] rounded-lg px-3 py-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-[#C42B2B]" />
            <span className="text-[#C42B2B] font-semibold">{redToday} akut</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-[#8494AA]">Rast:</label>
          <select
            value={breakTime}
            onChange={(e) => setBreakTime(e.target.value)}
            className="text-xs border border-[#DDE3EC] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1A4F8A]"
          >
            {BREAK_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* TESSA */}
      <TessaBar />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-5">
        <div>
          {(moduleView === 'all' || moduleView === 'ect') && (
            <SlotTable
              title="ECT — Förmiddagsblock"
              slots={ectSlots}
              onStatusChange={handleStatusChange}
              referralMetaByBookingId={referralMetaByBookingId}
            />
          )}
          {(moduleView === 'all' || moduleView === 'rtms') && (
            <SlotTable
              title="rTMS — Eftermiddagsblock"
              slots={rtmsSlots}
              onStatusChange={handleStatusChange}
              referralMetaByBookingId={referralMetaByBookingId}
            />
          )}
        </div>

        <div className="space-y-5">
          <StandbyList />

          {/* Info panel */}
          <div className="bg-white rounded-xl border border-[#DDE3EC] p-4">
            <h3 className="text-sm font-semibold text-[#1A2332] mb-3">Dagens rast</h3>
            <div className="text-sm text-[#4B5770] bg-[#F0F4F8] rounded-lg px-3 py-2 font-mono">
              {breakTime}
            </div>
            <p className="text-xs text-[#8494AA] mt-2">Bufferttid 12:00–13:00</p>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl border border-[#DDE3EC] p-4">
            <h3 className="text-xs font-semibold text-[#8494AA] uppercase tracking-wider mb-3">Förklaring</h3>
            <div className="space-y-2 text-xs">
              {[
                { color: 'bg-[#1A9E5F]', label: 'Klar – alla förutsättningar ok' },
                { color: 'bg-[#D4860A]', label: 'Obs – åtgärd behövs' },
                { color: 'bg-[#C42B2B]', label: 'Akut – hög prioritet' },
                { color: 'bg-[#2563EB]', label: 'Väntande bekräftelse' },
                { color: 'bg-[#6B7280]', label: 'Ledig slot' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
                  <span className="text-[#4B5770]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
