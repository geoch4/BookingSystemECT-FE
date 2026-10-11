import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import LanguageDomTranslator from '../components/common/LanguageDomTranslator';

export type Language = 'sv' | 'en';

const STORAGE_KEY = 'medquick-language';

const translations = {
  sv: {
    start: 'Start',
    dailyList: 'Dagens lista',
    myPatients: 'Mina patienter',
    newReferral: 'Ny remiss',
    newBooking: 'Ny bokning',
    referrals: 'Mina remisser',
    referralQueue: 'Remisskö',
    referralsToAssess: 'Remisser att bedöma',
    confirmedBookings: 'Bekräftade tider',
    bookedTimes: 'Bokade tider',
    patientAction: 'Patientåtgärd',
    bookings: 'Dagens lista',
    calendar: 'Kalender',
    documents: 'Styrdokument',
    statistics: 'Statistik & Kvalitet',
    administration: 'Administration',
    users: 'Användare',
    settings: 'Inställningar',
    auditLog: 'Auditlogg',
    logout: 'Logga ut',
    signIn: 'Logga in',
    createAccount: 'Skapa konto',
    register: 'Registrera',
    email: 'E-post',
    password: 'Lösenord',
    fullName: 'Fullständigt namn',
    role: 'Roll',
    chooseRole: 'Välj roll...',
    signingIn: 'Loggar in...',
    creatingAccount: 'Skapar konto...',
    bookingSystem: 'ECT/rTMS Bokningssystem',
    previousDay: 'Föregående dag',
    today: 'Idag',
    nextDay: 'Nästa dag',
    break: 'Rast',
    coordinatorDashboard: 'Koordinator-dashboard',
    ectDashboard: 'ECT-dashboard',
    rtmsDashboard: 'rTMS-dashboard',
    morningBlock: 'ECT — Förmiddagsblock',
    afternoonBlock: 'rTMS — Eftermiddagsblock',
    booked: 'bokade',
    time: 'Tid',
    patient: 'Patient',
    treatment: 'Behandling',
    healthDeclaration: 'Hälsodeklaration',
    anesthesiaAssessment: 'Anestesibedömning',
    status: 'Status',
    action: 'Åtgärd',
    notReady: 'Ej klar',
    department: 'Avdelning',
    notSpecified: 'Ej angiven',
    free: 'Ledig',
    waiting: 'Väntande',
    confirmed: 'Bekräftad',
    green: 'Grön',
    yellow: 'Gul',
    red: 'Röd',
    cancel: 'Avboka',
    actionNeeded: 'Åtgärd behövs',
    ready: 'Klar',
    standbyList: 'Standby-lista',
    patientsWaiting: 'patienter väntar',
    tessaFetched: 'Hämtat',
    nurse: 'Sjuksköterska',
    anesthesia: 'Narkos',
    loadingSchedule: 'Laddar schema...',
    language: 'Språk',
  },
  en: {
    start: 'Home',
    dailyList: 'Today list',
    myPatients: 'My patients',
    newReferral: 'New referral',
    newBooking: 'New booking',
    referrals: 'My referrals',
    referralQueue: 'Referral queue',
    referralsToAssess: 'Referrals to assess',
    confirmedBookings: 'Confirmed times',
    bookedTimes: 'Booked times',
    patientAction: 'Patient action',
    bookings: 'Today list',
    calendar: 'Calendar',
    documents: 'Clinical documents',
    statistics: 'Statistics & Quality',
    administration: 'Administration',
    users: 'Users',
    settings: 'Settings',
    auditLog: 'Audit log',
    logout: 'Log out',
    signIn: 'Sign in',
    createAccount: 'Create account',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    role: 'Role',
    chooseRole: 'Select role...',
    signingIn: 'Signing in...',
    creatingAccount: 'Creating account...',
    bookingSystem: 'ECT/rTMS Booking System',
    previousDay: 'Previous day',
    today: 'Today',
    nextDay: 'Next day',
    break: 'Break',
    coordinatorDashboard: 'Coordinator dashboard',
    ectDashboard: 'ECT dashboard',
    rtmsDashboard: 'rTMS dashboard',
    morningBlock: 'ECT — Morning block',
    afternoonBlock: 'rTMS — Afternoon block',
    booked: 'booked',
    time: 'Time',
    patient: 'Patient',
    treatment: 'Treatment',
    healthDeclaration: 'Health declaration',
    anesthesiaAssessment: 'Anesthesia assessment',
    status: 'Status',
    action: 'Action',
    notReady: 'Not ready',
    department: 'Department',
    notSpecified: 'Not specified',
    free: 'Available',
    waiting: 'Pending',
    confirmed: 'Confirmed',
    green: 'Green',
    yellow: 'Yellow',
    red: 'Red',
    cancel: 'Cancel',
    actionNeeded: 'Action needed',
    ready: 'Ready',
    standbyList: 'Standby list',
    patientsWaiting: 'patients waiting',
    tessaFetched: 'Fetched',
    nurse: 'Nurse',
    anesthesia: 'Anesthesia',
    loadingSchedule: 'Loading schedule...',
    language: 'Language',
  },
} as const;

type TranslationKey = keyof typeof translations.sv;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  tr: (swedish: string, english: string) => string;
  locale: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'sv',
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key) => translations[language][key],
    tr: (swedish, english) => language === 'sv' ? swedish : english,
    locale: language === 'sv' ? 'sv-SE' : 'en-GB',
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      <LanguageDomTranslator language={language} />
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
