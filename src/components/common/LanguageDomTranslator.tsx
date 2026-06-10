import { useEffect } from 'react';
import type { Language } from '../../context/LanguageContext';

const translations: Array<[string, string]> = [
  ['Följ kapacitet, väntetider, flaskhalsar och kvalitetsregister i samma vy.', 'Track capacity, waiting times, bottlenecks and quality registries in one view.'],
  ['Orbit-kontroll som obligatorisk punkt i remissflödet.', 'Orbit check as a mandatory step in the referral workflow.'],
  ['Skapa automatisk akut-signal till narkos vid röd prioritet.', 'Create an automatic urgent alert to anesthesia for red priority.'],
  ['Lägg till fasta avbokningsorsaker i bokningsvyn.', 'Add predefined cancellation reasons to the booking view.'],
  ['Fördröjer ECT-beslut och gör prioritering osäker.', 'Delays ECT decisions and makes prioritization uncertain.'],
  ['Akuta patienter riskerar att flyttas sent i schemat.', 'Urgent patients risk being moved late in the schedule.'],
  ['Svårt att se om bortfall beror på patient, kapacitet eller förberedelser.', 'It is difficult to see whether cancellations are caused by the patient, capacity or preparations.'],
  ['Registerluckor visas tillsammans med orsaken som behöver förbättras.', 'Registry gaps are shown together with the cause that needs improvement.'],
  ['Kopplat till förbättringsarbetet', 'Linked to quality improvement'],
  ['Orbit-status saknas före beslut', 'Orbit status missing before decision'],
  ['Sen anestesibedömning', 'Late anesthesia assessment'],
  ['Otydlig orsak till avbokning', 'Unclear cancellation reason'],
  ['ECT genomförda', 'ECT treatments completed'],
  ['rTMS genomförda', 'rTMS treatments completed'],
  ['Medelväntetid', 'Average waiting time'],
  ['Akuta ärenden', 'Urgent cases'],
  ['senaste 30 dagarna', 'last 30 days'],
  ['remiss till första behandling', 'referral to first treatment'],
  ['mot förra månaden', 'compared with last month'],
  ['krävde prioritering', 'required prioritization'],
  ['ECT registrerade behandlingar', 'ECT registered treatments'],
  ['rTMS registrerade behandlingar', 'rTMS registered treatments'],
  ['Uppföljningsskattningar', 'Follow-up assessments'],
  ['Ofullständig kvalitetsdata', 'Incomplete quality data'],
  ['saknar komplettering', 'need completion'],
  ['På god väg', 'On track'],
  ['kvar att följa upp', 'remaining to follow up'],
  ['Kräver åtgärd', 'Requires action'],
  ['Nästa steg', 'Next step'],
  ['Prioritera nu', 'Prioritize now'],
  ['Filtrera statistik', 'Filter statistics'],
  ['Nyckeltal', 'Key metrics'],
  ['Uppföljning', 'Follow-up'],
  ['Exportera kvalitetsregister', 'Export quality registry'],
  ['Rutin för ECT-behandling inkl. indikationer, kontraindikationer, anestesiprotokoll och uppföljning.', 'Procedure for ECT treatment including indications, contraindications, anesthesia protocol and follow-up.'],
  ['Rutin för remisshantering, urvalskriterier och prioriteringsordning vid rTMS-behandling.', 'Procedure for referral management, selection criteria and prioritization for rTMS treatment.'],
  ['Checklista för hälsodeklaration inkl. fastekrav, läkemedel, allergi och anestesibedömning.', 'Health declaration checklist including fasting requirements, medication, allergies and anesthesia assessment.'],
  ['Rutin för akut ECT vid vitalindikation, inkl. larmkedja, anestesijour och dokumentationskrav.', 'Procedure for urgent ECT with vital indication, including alert chain, on-call anesthesia and documentation requirements.'],
  ['Nationella kliniska riktlinjer för ECT. Indikatorer, indikationer och kvalitetskrav.', 'National clinical guidelines for ECT, including indicators, indications and quality requirements.'],
  ['Beskriver behöriga remittenter, remisskriterier och ansvar vid remittering.', 'Describes authorized referrers, referral criteria and responsibilities.'],
  ['Driftrutin för Thymatron System IV inkl. daglig kontroll, felhantering och servicekontakter.', 'Operating procedure for Thymatron System IV including daily checks, troubleshooting and service contacts.'],
  ['Rutin för rapportering till Nationellt Kvalitetsregister ECT inkl. tidpunkter och ansvarig.', 'Procedure for reporting to the National ECT Quality Registry, including timing and ownership.'],
  ['Hälsodeklaration inför ECT', 'Health declaration before ECT'],
  ['Akut ECT', 'Urgent ECT'],
  ['Kliniska riktlinjer', 'Clinical guidelines'],
  ['Remissvägar till ECT', 'ECT referral pathways'],
  ['driftrutin och underhåll', 'operating procedure and maintenance'],
  ['rapporteringsrutin', 'reporting procedure'],
  ['elektrokonvulsiv behandling', 'electroconvulsive therapy'],
  ['remisshantering och prioritering', 'referral management and prioritization'],
  ['checklista', 'checklist'],
  ['vitalindikation och larmrutin', 'vital indication and emergency procedure'],
  ['Svenska Psykiatriska Föreningen', 'Swedish Psychiatric Association'],
  ['Nationell', 'National'],
  ['Rutin', 'Procedure'],
  ['Checklista', 'Checklist'],
  ['Riktlinje', 'Guideline'],
  ['Remissväg', 'Referral pathway'],
  ['Giltig', 'Valid'],
  ['Utgången', 'Expired'],
  ['Utgick', 'Expired'],
  ['Utgår om', 'Expires in'],
  ['dagar', 'days'],
  ['Öppna', 'Open'],
  ['Översikt över beläggning och bemanning. Välj en modul för att arbeta vidare.', 'Overview of occupancy and staffing. Select a module to continue working.'],
  ['Dagens behandlingsflöde', 'Today treatment flow'],
  ['Koordinatorverktyg', 'Coordinator tools'],
  ['Remisser att bedöma', 'Referrals to assess'],
  ['Granska prioriteringar, akuta ECT-ärenden och medicinska underlag.', 'Review priorities, urgent ECT cases and medical documentation.'],
  ['Behandlingsberedskap', 'Treatment readiness'],
  ['Se dagens ECT-flöde, akuta patienter och relevanta styrdokument.', 'View today ECT flow, urgent patients and relevant clinical documents.'],
  ['Prioriteringslista', 'Priority list'],
  ['Boka tid', 'Book time'],
  ['Öppna ECT', 'Open ECT'],
  ['Öppna rTMS', 'Open rTMS'],
  ['platser bokade', 'slots booked'],
  ['bokade av', 'booked out of'],
  ['platser', 'slots'],
  ['klara', 'ready'],
  ['väntar', 'waiting'],
  ['lediga', 'available'],
  ['Inga akuta', 'No urgent cases'],
  ['Bemanning idag', 'Staffing today'],
  ['Jour kontaktad', 'On-call doctor contacted'],
  ['Uppdaterad', 'Updated'],
  ['Rast', 'Break'],
  ['Narkos', 'Anesthesia'],
  ['Sjuksköterska', 'Nurse'],
  ['Bevaka', 'Monitor'],
  ['Stabil', 'Stable'],
  ['Förmiddagsblock', 'Morning block'],
  ['Eftermiddag', 'Afternoon'],
  ['förmiddag', 'morning'],
  ['eftermiddag', 'afternoon'],
  ['någon annan', 'someone else'],
  ['Den valda tiden är redan bokad. Välj en annan ledig slot.', 'The selected time is already booked. Select another available slot.'],
  ['Tiden hann bokas av någon annan. Välj en annan ledig slot.', 'The time was booked by someone else. Select another available slot.'],
  ['Det finns inga lediga tider kvar på valt datum.', 'There are no available times left on the selected date.'],
  ['Kunde inte spara bokning. Kontrollera att alla fält är ifyllda.', 'Could not save the booking. Check that all fields are completed.'],
  ['Vald behandling', 'Selected treatment'],
  ['Upptagna slotar är låsta.', 'Occupied slots are locked.'],
  ['välj en ECT-behandling', 'select an ECT treatment'],
  ['välj en rTMS-behandling', 'select an rTMS treatment'],
  ['Fastekrav', 'Fasting requirement'],
  ['Ja – minst 6 h', 'Yes – at least 6 h'],
  ['Nej – bruten fasta', 'No – fasting broken'],
  ['Bruten fasta', 'Fasting broken'],
  ['kontakta anestesiansvarig innan behandling.', 'contact the anesthesia clinician before treatment.'],
  ['Blodtryck', 'Blood pressure'],
  ['Vikt', 'Weight'],
  ['Allergi', 'Allergy'],
  ['Inga kända', 'None known'],
  ['Lista relevanta läkemedel...', 'List relevant medication...'],
  ['eller annat relevant...', 'or other relevant information...'],
  ['Kontrollera uppgifterna och försök igen.', 'Check the information and try again.'],
  ['Servern svarar inte. Kontrollera att backend är startad och att nätverksanslutningen fungerar.', 'The server is not responding. Check that the backend is running and that the network connection works.'],
  ['Informationen kan inte hämtas just nu. Försök igen.', 'The information cannot be loaded right now. Try again.'],
  ['Bokningen tas bort permanent och kan inte återställas.', 'The booking will be permanently deleted and cannot be restored.'],
  ['Remissen är registrerad med status Väntande och granskas av ECT-koordinator.', 'The referral has been registered with Pending status and will be reviewed by the ECT coordinator.'],
  ['Sök befintlig patient på personnummer eller namn, eller registrera ny.', 'Search for an existing patient by personal identity number or name, or register a new patient.'],
  ['Fyll i patientens aktuella status inför behandlingen.', 'Enter the patient current status before treatment.'],
  ['Ange behandlingstyp, urgensgrad och önskat datum.', 'Select treatment type, urgency and preferred date.'],
  ['Data visas igen när anslutningen fungerar.', 'Data will be shown again when the connection is restored.'],
  ['Patientdata visas igen när anslutningen fungerar.', 'Patient data will be shown again when the connection is restored.'],
  ['Kunde inte hämta patientlistan.', 'Could not load the patient list.'],
  ['Kunde inte spara patient.', 'Could not save the patient.'],
  ['Inga bokningar hittades.', 'No bookings found.'],
  ['Inga patienter registrerade.', 'No patients registered.'],
  ['Inga patienter matchar sökningen.', 'No patients match the search.'],
  ['Inga dokument matchar sökningen.', 'No documents match the search.'],
  ['Sök befintlig patient', 'Search existing patient'],
  ['Personnummer eller namn', 'Personal identity number or name'],
  ['Fullständigt namn', 'Full name'],
  ['Datum & behandlingsslot', 'Date & treatment slot'],
  ['Datum & tid', 'Date & time'],
  ['Behandling & prioritet', 'Treatment & priority'],
  ['Behandlingstyp', 'Treatment type'],
  ['Hälsodeklaration', 'Health declaration'],
  ['Anestesibedömning', 'Anesthesia assessment'],
  ['Remitterande avdelning', 'Referring department'],
  ['Avdelning/enhet', 'Department/unit'],
  ['Kontaktperson', 'Contact person'],
  ['Önskat datum', 'Preferred date'],
  ['Önskad tid', 'Preferred time'],
  ['Aktuella läkemedel', 'Current medication'],
  ['Övrig information', 'Additional information'],
  ['Fastekrav uppfyllt?', 'Fasting requirement met?'],
  ['Avbokningsorsak', 'Cancellation reason'],
  ['Prioritet / Status', 'Priority / Status'],
  ['Statushistorik', 'Status history'],
  ['Statistik & Kvalitet', 'Statistics & Quality'],
  ['Behöver utvecklas', 'Needs improvement'],
  ['Kvalitetsregister', 'Quality registry'],
  ['Styrdokument', 'Clinical documents'],
  ['Rutiner, riktlinjer och remissvägar', 'Procedures, guidelines and referral pathways'],
  ['Alla typer', 'All types'],
  ['Utgår snart', 'Expires soon'],
  ['Utgångna', 'Expired'],
  ['Giltiga', 'Valid'],
  ['Ansvarig', 'Owner'],
  ['Giltig t.o.m.', 'Valid through'],
  ['Ny bokning', 'New booking'],
  ['Redigera bokning', 'Edit booking'],
  ['Skapa bokning', 'Create booking'],
  ['Spara ändringar', 'Save changes'],
  ['Radera bokning', 'Delete booking'],
  ['Ny remiss', 'New referral'],
  ['Skicka remiss', 'Submit referral'],
  ['Skickar remiss...', 'Submitting referral...'],
  ['Remiss inskickad', 'Referral submitted'],
  ['Visa bokningar', 'View bookings'],
  ['Ny patient', 'New patient'],
  ['Redigera patient', 'Edit patient'],
  ['Radera patient', 'Delete patient'],
  ['Patienter', 'Patients'],
  ['registrerade', 'registered'],
  ['Bokningar', 'Bookings'],
  ['bokningar', 'bookings'],
  ['totalt', 'total'],
  ['Exempeldata', 'Sample data'],
  ['Laddar bokningar...', 'Loading bookings...'],
  ['Laddar patienter...', 'Loading patients...'],
  ['Laddar...', 'Loading...'],
  ['Sparar...', 'Saving...'],
  ['Försök igen', 'Try again'],
  ['Välj behandling...', 'Select treatment...'],
  ['Välj patient...', 'Select patient...'],
  ['Välj roll...', 'Select role...'],
  ['Välj tid...', 'Select time...'],
  ['Inga lediga tider', 'No available times'],
  ['Upptagen', 'Occupied'],
  ['Ledig', 'Available'],
  ['Alla', 'All'],
  ['Väntande', 'Pending'],
  ['Bekräftad', 'Confirmed'],
  ['Avbokad', 'Cancelled'],
  ['Grön', 'Green'],
  ['Gul', 'Yellow'],
  ['Röd', 'Red'],
  ['Prioritet', 'Priority'],
  ['Status', 'Status'],
  ['Patient', 'Patient'],
  ['Behandling', 'Treatment'],
  ['Avdelning', 'Department'],
  ['Personnummer', 'Personal identity number'],
  ['Namn', 'Name'],
  ['Roll', 'Role'],
  ['Åtgärder', 'Actions'],
  ['Åtgärd', 'Action'],
  ['Redigera', 'Edit'],
  ['Radera', 'Delete'],
  ['Avboka', 'Cancel booking'],
  ['Avbryt', 'Cancel'],
  ['Behåll', 'Keep booking'],
  ['Tillbaka', 'Back'],
  ['Nästa', 'Next'],
  ['Historik', 'History'],
  ['Orsak', 'Reason'],
  ['Sök dokument...', 'Search documents...'],
  ['Sök på namn eller personnummer...', 'Search by name or personal identity number...'],
  ['Administration', 'Administration'],
  ['Användare', 'Users'],
  ['Roller', 'Roles'],
  ['Behandlingstyper', 'Treatment types'],
  ['Lägg till', 'Add'],
  ['Skapa', 'Create'],
  ['Stäng dialog', 'Close dialog'],
  ['Språk', 'Language'],
];

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const translatedText = new WeakSet<Text>();
const translatedAttributeNames = new WeakMap<Element, Set<string>>();
const translatedAttributes = ['placeholder', 'aria-label', 'title'];

function translate(value: string) {
  return translations.reduce(
    (result, [swedish, english]) => result.replaceAll(swedish, english),
    value,
  );
}

function translateElement(root: ParentNode, language: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (parent && !['SCRIPT', 'STYLE'].includes(parent.tagName)) {
      if (!originalText.has(textNode)) originalText.set(textNode, textNode.data);
      const source = originalText.get(textNode) ?? textNode.data;
      const translated = translate(source);
      if (language === 'en' && translated !== source) translatedText.add(textNode);
      const nextValue = language === 'en'
        ? translated
        : translatedText.has(textNode) ? source : textNode.data;
      if (textNode.data !== nextValue) textNode.data = nextValue;
    }
    node = walker.nextNode();
  }

  const elements = root instanceof Element
    ? [root, ...Array.from(root.querySelectorAll('*'))]
    : Array.from(root.querySelectorAll('*'));

  elements.forEach((element) => {
    let saved = originalAttributes.get(element);
    if (!saved) {
      saved = new Map<string, string>();
      originalAttributes.set(element, saved);
    }

    translatedAttributes.forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (current === null) return;
      if (!saved.has(attribute)) saved.set(attribute, current);
      const source = saved.get(attribute) ?? current;
      const translated = translate(source);
      let translatedNames = translatedAttributeNames.get(element);
      if (!translatedNames) {
        translatedNames = new Set<string>();
        translatedAttributeNames.set(element, translatedNames);
      }
      if (language === 'en' && translated !== source) translatedNames.add(attribute);
      const nextValue = language === 'en'
        ? translated
        : translatedNames.has(attribute) ? source : current;
      if (current !== nextValue) element.setAttribute(attribute, nextValue);
    });
  });
}

export default function LanguageDomTranslator({ language }: { language: Language }) {
  useEffect(() => {
    let translating = false;
    const run = (root: ParentNode = document.body) => {
      if (translating) return;
      translating = true;
      translateElement(root, language);
      translating = false;
    };

    run();
    const observer = new MutationObserver((mutations) => {
      if (translating) return;
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' && mutation.target.parentNode) {
          run(mutation.target.parentNode);
        }
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) run(node);
          else if (node.parentNode) run(node.parentNode);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}
