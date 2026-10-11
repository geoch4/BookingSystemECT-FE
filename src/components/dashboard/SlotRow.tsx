import { useAuth } from '../../context/useAuth';
import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { BookingDto, BookingPriority, BookingStatus, PatientDto } from '../../types';
import type { BookingReferralMeta } from '../../utils/bookingMeta';
import { addHistoryEntry } from '../../utils/bookingHistory';
import { DEMO_MODE } from '../../config/demo';
import CancelBookingDialog from '../common/CancelBookingDialog';
import { useLanguage } from '../../context/LanguageContext';
import { getRtmsSessionPlan, rtmsSessionPlanShortLabel } from '../../utils/rtmsTreatmentPlan';
import { maskPersonnummer } from '../../utils/personnummer';

export interface Slot {
  time: string;
  type: 'ECT' | 'rTMS';
  booking?: BookingDto;
  patient?: PatientDto;
  treatmentTypeName?: string;
}

function slotStatus(b?: BookingDto): { label: string; bg: string; text: string; border: string } {
  if (!b || b.status === 'Cancelled') return { label: 'Ledig', bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', border: 'border-[#D1D5DB]' };
  if (b.priority === 'Red')    return { label: 'AKUT',           bg: 'bg-[#FCEBEC]', text: 'text-[#B4232A]', border: 'border-[#B4232A]' };
  if (b.priority === 'Yellow') return { label: 'Åtgärd behövs', bg: 'bg-[#FFF3D8]', text: 'text-[#875100]', border: 'border-[#C77A06]' };
  if (b.status === 'Confirmed') return { label: 'Klar',          bg: 'bg-[#E8F6EE]', text: 'text-[#147A4B]', border: 'border-[#147A4B]' };
  return                              { label: 'Väntande',       bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', border: 'border-[#93C5FD]' };
}

interface SlotRowProps {
  slot: Slot;
  showAnesthesia?: boolean;
  onStatusChange: (b: BookingDto, status: BookingStatus, priority: BookingPriority, cancellationReason?: string) => void;
  referralMeta?: BookingReferralMeta;
}

export default function SlotRow({ slot, showAnesthesia = true, onStatusChange, referralMeta }: SlotRowProps) {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [pendingCancel, setPendingCancel] = useState(false);
  const b = slot.booking;
  const cfg = slotStatus(b);
  const rtmsPlan = b ? getRtmsSessionPlan(b) : null;

  const visibleStatus = !b || b.status === 'Cancelled'
    ? t('free')
    : b.priority === 'Red'    ? 'AKUT'
    : b.priority === 'Yellow' ? t('actionNeeded')
    : b.status === 'Confirmed' ? t('ready')
    : t('waiting');

  function handleDropdownChange(status: BookingStatus, priority: BookingPriority) {
    if (!isAdmin) return;
    if (DEMO_MODE && b && (status !== b.status || priority !== b.priority)) {
      addHistoryEntry(b.bookingId, {
        timestamp: new Date().toISOString(),
        fromStatus: b.status,
        toStatus: status,
        fromPriority: b.priority,
        toPriority: priority,
      });
    }
    onStatusChange(b!, status, priority);
  }

  function handleConfirmCancel(reason: string) {
    if (!isAdmin) return;
    setPendingCancel(false);
    if (b) {
      if (DEMO_MODE) {
      addHistoryEntry(b.bookingId, {
        timestamp: new Date().toISOString(),
        fromStatus: b.status,
        toStatus: 'Cancelled',
        fromPriority: b.priority,
        toPriority: b.priority,
        cancellationReason: reason || undefined,
      });
      }
      onStatusChange(b, 'Cancelled', b.priority, reason || undefined);
    }
  }

  return (
    <tr className={`border-b border-[#DDE3EC] hover:bg-[#F8FAFC] transition-colors ${cfg.bg}`}>
      <td className="px-2.5 py-2 text-sm font-mono font-semibold text-[#4B5770] whitespace-nowrap">{slot.time}</td>

      {b && b.status !== 'Cancelled' ? (
        <>
          <td className="px-2.5 py-2">
            <div className="text-sm font-medium text-[#1A2332] leading-tight">{slot.patient?.fullName ?? `#${b.patientId}`}</div>
            <div className="text-xs text-[#8494AA] font-mono">{maskPersonnummer(slot.patient?.socialSecurityNumber)}</div>
            <div className="text-xs text-[#4B5770] mt-0.5">
              {t('department')}: <span className="font-semibold text-[#1A2332]">{referralMeta?.department || t('notSpecified')}</span>
            </div>
            {(referralMeta?.contactName || referralMeta?.contactPhone) && (
              <div className="text-[11px] text-[#8494AA] mt-0.5">
                {referralMeta.contactName || 'Kontakt'}{referralMeta.contactPhone ? ` · ${referralMeta.contactPhone}` : ''}
              </div>
            )}
          </td>
          <td className="px-2.5 py-2 text-sm text-[#4B5770]">
            <div>{slot.treatmentTypeName ?? '–'}</div>
            {rtmsPlan && (
              <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                rtmsPlan === 'double'
                  ? 'border-[#C4B5FD] bg-[#F7F4FF] text-[#4F46E5]'
                  : 'border-[#A7D8CE] bg-[#F2FAF8] text-[#0F766E]'
              }`}>
                rTMS {rtmsSessionPlanShortLabel(rtmsPlan)}
              </span>
            )}
          </td>

          <td className="px-2.5 py-2 text-center">
            <span className="text-xs font-semibold text-[#526174]">
              {rtmsPlan ? 'Kontroll' : t('notReady')}
            </span>
          </td>
          {showAnesthesia && (
            <td className="px-2.5 py-2 text-center">
              <span className="text-xs font-semibold text-[#526174]">{t('notReady')}</span>
            </td>
          )}

          <td className="px-2.5 py-2">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              {visibleStatus}
            </span>
          </td>

          <td className="px-2.5 py-2">
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <select disabled={!isAdmin}
                  aria-label={`Ändra status för ${slot.patient?.fullName ?? `patient ${b.patientId}`}`}
                  value={`${b.status}:${b.priority}`}
                  onChange={(e) => {
                    const [status, priority] = e.target.value.split(':') as [BookingStatus, BookingPriority];
                    handleDropdownChange(status, priority);
                  }}
                  className="h-8 w-full appearance-none rounded-md border border-[#8FB4D8] bg-[#EAF4FC] pl-2 pr-7 text-xs font-semibold text-[#185FA5] shadow-sm transition-all hover:border-[#185FA5] hover:bg-[#DCECF9] focus:outline-none focus:ring-3 focus:ring-[#185FA5]/20"
                >
                  <option value="Pending:Green">{t('waiting')} · {t('green')}</option>
                  <option value="Pending:Yellow">{t('waiting')} · {t('yellow')}</option>
                  <option value="Pending:Red">{t('waiting')} · {t('red')}</option>
                  <option value="Confirmed:Green">{t('confirmed')} · {t('green')}</option>
                  <option value="Confirmed:Yellow">{t('confirmed')} · {t('yellow')}</option>
                  <option value="Confirmed:Red">{t('confirmed')} · {t('red')}</option>
                </select>
                <ChevronDown size={15} aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#185FA5]" />
              </div>
              <button
                type="button"
                aria-label={`Avboka ${slot.patient?.fullName ?? `patient ${b.patientId}`} klockan ${slot.time}`}
                disabled={!isAdmin}
                onClick={() => setPendingCancel(true)}
                className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[#E5A3A6] bg-[#FFF7F7] px-2 text-xs font-semibold text-[#B4232A] shadow-sm transition-all hover:border-[#B4232A] hover:bg-[#FCEBEC] active:shadow-none focus:outline-none focus:ring-3 focus:ring-[#B4232A]/20"
              >
                <X size={14} strokeWidth={2.25} aria-hidden="true" />
                {t('cancel')}
              </button>
              {pendingCancel && (
                <CancelBookingDialog
                  patientName={slot.patient?.fullName ?? `Patient #${b.patientId}`}
                  time={slot.time}
                  onConfirm={handleConfirmCancel}
                  onCancel={() => setPendingCancel(false)}
                />
              )}
            </div>
          </td>
        </>
      ) : (
        <>
          <td colSpan={showAnesthesia ? 5 : 4} className="px-2.5 py-2 text-sm text-[#8494AA] italic">{t('free')}</td>
          <td className="px-2.5 py-2" />
        </>
      )}
    </tr>
  );
}
