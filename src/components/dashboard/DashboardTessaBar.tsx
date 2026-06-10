import { useLanguage } from '../../context/LanguageContext';

const TESSA_MOCK = {
  narkos: { available: 3, required: 3, ok: true },
  sjukskoterska: { available: 4, required: 4, ok: true },
  lastFetch: '07:42',
};

export default function DashboardTessaBar() {
  const { t } = useLanguage();
  const { narkos, sjukskoterska, lastFetch } = TESSA_MOCK;
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
