import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import AdminRoute from './components/routing/AdminRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import PatientsPage from './pages/PatientsPage';
import DocumentsPage from './pages/DocumentsPage';
import ReferralPage from './pages/ReferralPage';
import AdminPage from './pages/AdminPage';
import StatisticsPage from './pages/StatisticsPage';
import { LanguageProvider } from './context/LanguageContext';

// React Query-klienten styr hur API-data hämtas och cachas i hela appen.
const queryClient = new QueryClient({
  defaultOptions: {
    // retry: 1 gör ett extra försök vid nätverksfel.
    // staleTime gör att hämtad data räknas som färsk i 30 sekunder.
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <LanguageProvider>
      {/* QueryClientProvider gör React Query tillgängligt för alla sidor. */}
      <QueryClientProvider client={queryClient}>
      {/* AuthProvider håller koll på inloggad användare och roller. */}
      <AuthProvider>
        {/* BrowserRouter aktiverar URL-baserad navigation i React. */}
        <BrowserRouter>
          {/* Routes innehåller alla sidor som användaren kan navigera till. */}
          <Routes>
            {/* Login ligger utanför layouten eftersom den inte ska visa sidomenyn. */}
            <Route path="/login" element={<LoginPage />} />

            {/* Alla routes inuti AppLayout får gemensam layout och sidomeny. */}
            <Route element={<AppLayout />}>
              {/* Startsidan är första sidan användaren ser. */}
              <Route path="/" element={<LandingPage />} />
              {/* Dashboard kan visa alla block eller filtreras via querystring. */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* rTMS använder samma dashboard-komponent men filtreras till rTMS-vyn. */}
              <Route path="/rtms"      element={<DashboardPage />} />

              {/* Svenska routes för de viktigaste arbetsflödena. */}
              <Route path="/bokning"   element={<ReferralPage />} />
              <Route path="/dokument"  element={<DocumentsPage />} />
              <Route path="/prioritering" element={<BookingsPage />} />
              <Route path="/statistik" element={<StatisticsPage />} />

              {/* Engelska alias finns kvar så gamla länkar inte slutar fungera. */}
              <Route path="/referral"  element={<ReferralPage />} />
              <Route path="/bookings"  element={<BookingsPage />} />
              <Route path="/patients"  element={<PatientsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />

              {/* Adminsidan kräver adminroll även om någon skriver URL:en direkt. */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>

            {/* Om användaren skriver en okänd URL skickas den tillbaka till start. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}
