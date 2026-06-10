import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSwitch({ dark = false }: { dark?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      aria-label={t('language')}
      className={`inline-flex items-center gap-1 rounded-lg border p-1 ${
        dark ? 'border-white/15 bg-white/5' : 'border-[#C7D3E0] bg-[#F3F6FA]'
      }`}
    >
      <Languages size={14} className={dark ? 'ml-1 text-[#C4CEDB]' : 'ml-1 text-[#526174]'} aria-hidden="true" />
      {(['sv', 'en'] as const).map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={language === item}
          onClick={() => setLanguage(item)}
          className={`rounded-md px-2 py-1 text-xs font-bold transition-colors ${
            language === item
              ? 'bg-[#185FA5] text-white shadow-sm'
              : dark ? 'text-[#C4CEDB] hover:bg-white/10' : 'text-[#526174] hover:bg-white'
          }`}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
