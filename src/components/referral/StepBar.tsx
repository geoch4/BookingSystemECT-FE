const STEPS = [
  { n: 1, label: 'Patient' },
  { n: 2, label: 'Behandling & prioritet' },
  { n: 3, label: 'Klinisk information' },
  { n: 4, label: 'Granska & skicka' },
];

export default function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1 last:flex-none">
          <div className={`flex items-center gap-2 ${current >= s.n ? 'text-[#1A4F8A]' : 'text-[#8494AA]'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              current > s.n
                ? 'bg-[#1A4F8A] border-[#1A4F8A] text-white'
                : current === s.n
                ? 'border-[#1A4F8A] text-[#1A4F8A]'
                : 'border-[#DDE3EC] text-[#8494AA]'
            }`}>
              {current > s.n ? '✓' : s.n}
            </div>
            <span className="text-sm font-medium">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 ${current > s.n ? 'bg-[#1A4F8A]' : 'bg-[#DDE3EC]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
