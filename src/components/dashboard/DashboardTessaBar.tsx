import { useLanguage } from '../../context/LanguageContext';
import type { BookingDto } from '../../types';
import { isEctType } from '../../types';

const TESSA_MOCK = {
  narkos: { available: 3, required: 3, ok: true },
  sjukskoterska: { available: 4, required: 4, ok: true },
  lastFetch: '07:42',
};

interface DashboardTessaBarProps {
  bookings?: BookingDto[];
}

export default function DashboardTessaBar({ bookings = [] }: DashboardTessaBarProps) {
  const { t } = useLanguage();
  const activeBookings = bookings.filter((booking) => booking.status !== 'Cancelled');
  const ectBookings = activeBookings.filter((booking) => isEctType(booking.treatmentTypeId));
  const acuteBookings = activeBookings.filter((booking) => booking.priority === 'Red');
  const tessa = activeBookings.length > 0
    ? {
        narkos: {
          available: TESSA_MOCK.narkos.available,
          required: Math.max(1, Math.ceil(ectBookings.length / 5) + acuteBookings.length),
          ok: TESSA_MOCK.narkos.available >= Math.max(1, Math.ceil(ectBookings.length / 5) + acuteBookings.length),
        },
        sjukskoterska: {
          available: TESSA_MOCK.sjukskoterska.available,
          required: Math.max(1, Math.ceil(activeBookings.length / 6)),
          ok: TESSA_MOCK.sjukskoterska.available >= Math.max(1, Math.ceil(activeBookings.length / 6)),
        },
        lastFetch: 'bokningsdata',
      }
    : TESSA_MOCK;
  const { narkos, sjukskoterska, lastFetch } = tessa;

  return (
    <div className="flex items-center gap-5 bg-[#0F62A8] text-white rounded-lg px-4 py-2.5 mb-4 text-sm">
      <span className="font-semibold tracking-wide text-xs uppercase opacity-80">TESSA</span>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${narkos.ok ? 'bg-[#34D399]' : 'bg-[#FCA5A5]'}`} />
        <span>{t('anesthesia')} {narkos.available}/{narkos.required}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${sjukskoterska.ok ? 'bg-[#34D399]' : 'bg-[#FCA5A5]'}`} />
        <span>{t('nurse')} {sjukskoterska.available}/{sjukskoterska.required}</span>
      </div>
      <div className="ml-auto text-xs opacity-60">{t('tessaFetched')} {lastFetch}</div>
    </div>
  );
}
