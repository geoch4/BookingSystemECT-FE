import { useLanguage } from '../../context/LanguageContext';

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

export default function StandbyList() {
  const { t } = useLanguage();
  return (
    <div className="bg-white rounded-xl border border-[#DDE3EC]">
      <div className="px-3 py-2.5 border-b border-[#DDE3EC]">
        <h2 className="font-semibold text-[#1A2332]">{t('standbyList')}</h2>
        <p className="text-xs text-[#8494AA] mt-0.5">{STANDBY_MOCK.length} {t('patientsWaiting')}</p>
      </div>
      <div className="divide-y divide-[#DDE3EC]">
        {STANDBY_MOCK.map((p) => (
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
