import { useLanguage } from '../../context/LanguageContext';
import type { BookingDto, PatientDto } from '../../types';

const STANDBY_MOCK = [
  { id: 1, name: 'Andersson, Britta', ward: 'Avd 361', urgency: 'hög' as const },
  { id: 2, name: 'Lindqvist, Göran', ward: 'Avd 362', urgency: 'medel' as const },
  { id: 3, name: 'Svensson, Klara', ward: 'Avd 360', urgency: 'medel' as const },
];

const URGENCY_STYLE: Record<string, string> = {
  hög: 'bg-[#FDEAEA] text-[#C42B2B]',
  medel: 'bg-[#FEF3DC] text-[#D4860A]',
  låg: 'bg-[#F3F4F6] text-[#6B7280]',
};

interface StandbyListProps {
  bookings?: BookingDto[];
  patientMap?: Record<number, PatientDto>;
}

function urgencyFromBooking(booking: BookingDto): 'hög' | 'medel' | 'låg' {
  if (booking.priority === 'Red') return 'hög';
  if (booking.priority === 'Yellow') return 'medel';
  return 'låg';
}

export default function StandbyList({ bookings = [], patientMap = {} }: StandbyListProps) {
  const { t } = useLanguage();
  const liveItems = bookings
    .filter((booking) => booking.status === 'Pending')
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((booking) => {
      const patient = patientMap[booking.patientId];
      return {
        id: booking.bookingId,
        name: patient?.fullName ?? `Patient #${booking.patientId}`,
        ward: booking.referralDepartment ?? 'Avdelning saknas',
        urgency: urgencyFromBooking(booking),
      };
    });
  const items = liveItems.length > 0 ? liveItems : STANDBY_MOCK;
  const usingLiveItems = liveItems.length > 0;

  return (
    <div className="bg-white rounded-xl border border-[#DDE3EC]">
      <div className="px-3 py-2.5 border-b border-[#DDE3EC]">
        <h2 className="font-semibold text-[#1A2332]">{t('standbyList')}</h2>
        <p className="text-xs text-[#8494AA] mt-0.5">
          {items.length} {t('patientsWaiting')}
          {!usingLiveItems && <span className="ml-1 text-[#185FA5]">(exempel)</span>}
        </p>
      </div>
      <div className="divide-y divide-[#DDE3EC]">
        {items.map((p) => (
          <div key={p.id} className="px-3 py-2.5 flex items-center justify-between hover:bg-[#F8FAFC]">
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
