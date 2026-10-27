import { useQuery } from '@tanstack/react-query';
import { getReferralClinicalDetails } from '../../api/referrals';
import type { ReferralClinicalDetails } from '../../types';
import { rtmsSessionPlanLabel } from '../../utils/rtmsTreatmentPlan';

const DOCUMENT_LABELS: Record<string, string> = {
  healthDeclaration: 'Hälsodeklaration',
  anesthesiaAssessment: 'Anestesi-/narkosunderlag',
  medicationReview: 'Läkemedelsgenomgång',
  somaticAssessment: 'Somatisk bedömning',
  contraindicationChecklist: 'Kontraindikationschecklista',
  implantCheck: 'Implantatkontroll',
  treatmentHistory: 'Behandlingshistorik',
  patientInformation: 'Patientinformation',
};

function yesNo(value: boolean | null | undefined) {
  if (value === true) return 'Ja';
  if (value === false) return 'Nej';
  return null;
}

type Row = { label: string; value: string | null | undefined; multiline?: boolean };

function rowsFor(details: ReferralClinicalDetails, track: 'ECT' | 'rTMS'): Row[] {
  if (track === 'ECT') {
    return [
      { label: 'Indikation', value: details.indication, multiline: true },
      { label: 'Narkos/anestesi', value: details.anesthesiaInfo, multiline: true },
      { label: 'Somatisk risk', value: details.somaticRisk, multiline: true },
      { label: 'Fasta bekräftad', value: yesNo(details.fastingConfirmed) },
      { label: 'Blodtryck', value: details.bloodPressure },
      { label: 'Vikt (kg)', value: details.weightKg },
      { label: 'Allergier', value: details.allergies },
      { label: 'Läkemedel', value: details.medications, multiline: true },
      { label: 'Övrigt', value: details.additionalInfo, multiline: true },
    ];
  }
  return [
    { label: 'Upplägg', value: rtmsSessionPlanLabel(details.rtmsSessionPlan ?? null) || null },
    { label: 'Indikation', value: details.indication, multiline: true },
    { label: 'Tidigare behandlingar', value: details.previousTreatments, multiline: true },
    { label: 'Behandlingsmål', value: details.treatmentGoal, multiline: true },
    { label: 'Kontraindikationschecklista klar', value: yesNo(details.contraindicationChecklistComplete) },
    { label: 'Implantat/medicinteknisk utrustning', value: yesNo(details.metalImplantsOrDevices) },
    { label: 'Epilepsi/krampanamnes', value: yesNo(details.seizureHistory) },
  ];
}

export default function ReferralClinicalSection({ bookingId, track, enabled }: {
  bookingId: number;
  track: 'ECT' | 'rTMS';
  enabled: boolean;
}) {
  const query = useQuery({
    queryKey: ['referral-clinical', bookingId],
    queryFn: () => getReferralClinicalDetails(bookingId),
    enabled,
    // Health information: fetch when the referral is opened, never poll.
    staleTime: Infinity,
  });

  if (!enabled) return null;

  return (
    <section aria-labelledby="clinical-heading" className="mt-5 rounded-2xl border border-[#DDE3EC] bg-white p-4">
      <h2 id="clinical-heading" className="text-sm font-bold text-[#1A2332]">Kliniskt underlag</h2>

      {query.isLoading && <p className="mt-2 text-sm text-[#526174]">Hämtar underlag…</p>}
      {query.isError && (
        <p role="alert" className="mt-2 text-sm text-[#C42B2B]">Underlaget kunde inte hämtas.</p>
      )}
      {query.isSuccess && query.data === null && (
        <p className="mt-2 text-sm text-[#526174]">
          Remissen skickades innan kliniskt underlag sparades. Begär komplettering vid behov.
        </p>
      )}
      {query.isSuccess && query.data && (
        <>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
            {rowsFor(query.data, track).filter((row) => row.value).map((row) => (
              <div key={row.label} className={row.multiline ? 'md:col-span-2' : undefined}>
                <dt className="text-xs font-bold text-[#526174]">{row.label}</dt>
                <dd className="mt-1 whitespace-pre-line text-sm text-[#1A2332]">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <div className="text-xs font-bold text-[#526174]">Bifogat underlag</div>
            {query.data.completedDocuments.length === 0 ? (
              <p className="mt-1 text-sm text-[#7A4E16]">Inget underlag markerat som bifogat.</p>
            ) : (
              <ul className="mt-1 flex flex-wrap gap-2">
                {query.data.completedDocuments.map((key) => (
                  <li key={key} className="rounded-full bg-[#E8F6EE] px-3 py-1 text-xs font-semibold text-[#147A4B]">
                    {DOCUMENT_LABELS[key] ?? key}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
