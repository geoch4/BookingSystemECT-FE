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
  breakAfter?: string;
  onStatusChange: (b: BookingDto, s: BookingStatus, p: BookingPriority) => void;
  referralMetaByBookingId: Record<number, BookingReferralMeta>;
}

export default function SlotTable({ title, slots, breakAfter, onStatusChange, referralMetaByBookingId }: SlotTableProps) {
  const { t } = useLanguage();
  const occupied = slots.filter((s) => s.booking && s.booking.status !== 'Cancelled').length;
  const total = slots.length;
  const percent = bookingPercent(occupied, total);

  return (
    <div className="bg-white rounded-xl border border-[#DDE3EC] mb-4">
      <div className="px-4 py-3 border-b border-[#DDE3EC] flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-[#1A2332]">{title}</h2>
        <div className="min-w-[150px] rounded-lg border border-[#B8CBE0] bg-[#F6FAFE] px-3 py-2 shadow-sm">
          <div className="text-lg font-bold text-[#185FA5]">{occupied}/{total} {t('booked')}</div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#DDE7F2]">
            <div className="h-full rounded-full bg-[#185FA5] transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] table-fixed">
          <colgroup>
            <col className="w-[100px]" />
            <col className="w-[190px]" />
            <col className="w-[110px]" />
            <col className="w-[145px]" />
            <col className="w-[175px]" />
            <col className="w-[100px]" />
            <col className="w-[170px]" />
          </colgroup>
          <thead>
            <tr className="text-left text-xs font-medium text-[#8494AA] uppercase tracking-wider border-b border-[#DDE3EC]">
              <th scope="col" className="px-3 py-2.5">{t('time')}</th>
              <th scope="col" className="px-3 py-2.5">{t('patient')}</th>
              <th scope="col" className="px-3 py-2.5">{t('treatment')}</th>
              <th scope="col" className="px-3 py-2.5 whitespace-nowrap text-center">{t('healthDeclaration')}</th>
              <th scope="col" className="px-3 py-2.5 whitespace-nowrap text-center">{t('anesthesiaAssessment')}</th>
              <th scope="col" className="px-3 py-2.5">{t('status')}</th>
              <th scope="col" className="px-3 py-2.5">{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <SlotRow
                key={slot.time}
                slot={slot}
                isBreak={slot.time === breakAfter}
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
