import type { BookingDto, BookingPriority, BookingStatus } from '../../types';
import type { BookingReferralMeta } from '../../utils/bookingMeta';
import { getReferralMetaForBooking } from '../../utils/bookingMeta';
import { useLanguage } from '../../context/LanguageContext';
import SlotRow from './SlotRow';
import type { Slot } from './SlotRow';

function bookingPercent(occupied: number, total: number) {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}

interface SlotTableProps {
  title: string;
  slots: Slot[];
  onStatusChange: (b: BookingDto, s: BookingStatus, p: BookingPriority, cancellationReason?: string) => void;
  referralMetaByBookingId: Record<number, BookingReferralMeta>;
}

export default function SlotTable({ title, slots, onStatusChange, referralMetaByBookingId }: SlotTableProps) {
  const { t } = useLanguage();
  const occupied = slots.filter((s) => s.booking && s.booking.status !== 'Cancelled').length;
  const total = slots.length;
  const percent = bookingPercent(occupied, total);
  const isRtmsOnly = slots.length > 0 && slots.every((slot) => slot.type === 'rTMS');
  const showAnesthesia = !isRtmsOnly;

  return (
    <div className="bg-white rounded-xl border border-[#DDE3EC] mb-3 shadow-sm">
      <div className="px-3 py-2.5 border-b border-[#DDE3EC] flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-[#1A2332]">{title}</h2>
        <div className="min-w-[136px] rounded-lg border border-[#B8CBE0] bg-[#F6FAFE] px-3 py-1.5 shadow-sm">
          <div className="text-base font-bold text-[#185FA5]">{occupied}/{total} {t('booked')}</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#DDE7F2]">
            <div className="h-full rounded-full bg-[#185FA5] transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className={`w-full table-fixed ${showAnesthesia ? 'min-w-[860px]' : 'min-w-[720px]'}`}>
          <colgroup>
            <col className="w-[78px]" />
            <col className="w-[170px]" />
            <col className="w-[105px]" />
            <col className="w-[130px]" />
            {showAnesthesia && <col className="w-[150px]" />}
            <col className="w-[90px]" />
            <col className="w-[150px]" />
          </colgroup>
          <thead>
            <tr className="text-left text-xs font-medium text-[#8494AA] uppercase tracking-wider border-b border-[#DDE3EC]">
              <th scope="col" className="px-2.5 py-2">{t('time')}</th>
              <th scope="col" className="px-2.5 py-2">{t('patient')}</th>
              <th scope="col" className="px-2.5 py-2">{t('treatment')}</th>
              <th scope="col" className="px-2.5 py-2 whitespace-nowrap text-center">
                {isRtmsOnly ? 'rTMS-kontroll' : t('healthDeclaration')}
              </th>
              {showAnesthesia && (
                <th scope="col" className="px-2.5 py-2 whitespace-nowrap text-center">{t('anesthesiaAssessment')}</th>
              )}
              <th scope="col" className="px-2.5 py-2">{t('status')}</th>
              <th scope="col" className="px-2.5 py-2">{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <SlotRow
                key={slot.time}
                slot={slot}
                showAnesthesia={showAnesthesia}
                onStatusChange={onStatusChange}
                referralMeta={slot.booking ? getReferralMetaForBooking(slot.booking, referralMetaByBookingId[slot.booking.bookingId]) : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
