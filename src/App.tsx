import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import AdminRoute from './components/routing/AdminRoute';
import PermissionRoute from './components/routing/PermissionRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import PatientsPage from './pages/PatientsPage';
import DocumentsPage from './pages/DocumentsPage';
import ReferralPage from './pages/ReferralPage';
import AdminPage from './pages/AdminPage';
import StatisticsPage from './pages/StatisticsPage';
import CalendarOverviewPage from './pages/CalendarOverviewPage';
import DepartmentReferralsPage from './pages/DepartmentReferralsPage';
import DepartmentConfirmedBookingsPage from './pages/DepartmentConfirmedBookingsPage';
import PrintDailyListPage from './pages/PrintDailyListPage';
import AdminReferralQueuePage from './pages/AdminReferralQueuePage';
import ReferralDetailPage from './pages/ReferralDetailPage';
import AuditLogPage from './pages/AuditLogPage';
import { LanguageProvider } from './context/LanguageContext';

// The React Query client controls how API data is fetched and cached across the app.
const queryClient = new QueryClient({
  defaultOptions: {
    // retry: 1 makes one extra attempt on a network error.
    // staleTime means fetched data is considered fresh for 30 seconds.
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <LanguageProvider>
      {/* QueryClientProvider makes React Query available to all pages. */}
      <QueryClientProvider client={queryClient}>
      {/* AuthProvider keeps track of the logged-in user and roles. */}
      <AuthProvider>
        {/* BrowserRouter enables URL-based navigation in React. */}
        <BrowserRouter>
          {/* Routes contains all pages the user can navigate to. */}
          <Routes>
            {/* Login sits outside the layout since it shouldn't show the sidebar. */}
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/print/daily-list"
              element={(
                <PermissionRoute permission="viewDailyList">
                  <PrintDailyListPage />
                </PermissionRoute>
              )}
            />

            {/* All routes inside AppLayout share a common layout and sidebar. */}
            <Route element={<AppLayout />}>
              {/* The home page is the first page the user sees. */}
              <Route path="/" element={<LandingPage />} />
              {/* Dashboard can show all blocks or be filtered via the query string. */}
              <Route
                path="/dashboard"
                element={(
                  <PermissionRoute permission="viewDailyList">
                    <DashboardPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/dagens-lista"
                element={(
                  <PermissionRoute permission="viewDailyList">
                    <DashboardPage />
                  </PermissionRoute>
                )}
              />

              {/* rTMS uses the same dashboard component but is filtered to the rTMS view. */}
              <Route
                path="/rtms"
                element={(
                  <PermissionRoute permission="viewDailyList">
                    <DashboardPage />
                  </PermissionRoute>
                )}
              />

              {/* Swedish routes for the main workflows. */}
              <Route
                path="/bokning"
                element={(
                  <PermissionRoute permission="createReferral">
                    <ReferralPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/dokument"
                element={(
                  <PermissionRoute permission="viewDocuments">
                    <DocumentsPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/prioritering"
                element={(
                  <PermissionRoute permissions={['viewReferralQueue', 'confirmElvisBooking']}>
                    <BookingsPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/statistik"
                element={(
                  <PermissionRoute permission="viewStatistics">
                    <StatisticsPage />
                  </PermissionRoute>
                )}
              />

              {/* English aliases are kept so old links don't break. */}
              <Route
                path="/referral"
                element={(
                  <PermissionRoute permission="createReferral">
                    <ReferralPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/ny-remiss"
                element={(
                  <PermissionRoute permission="createReferral">
                    <ReferralPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/bookings"
                element={(
                  <PermissionRoute permissions={['viewReferralQueue', 'confirmElvisBooking']}>
                    <BookingsPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/admin-referrals"
                element={(
                  <PermissionRoute permission="viewReferralQueue">
                    <AdminReferralQueuePage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/remissko"
                element={(
                  <PermissionRoute permission="viewReferralQueue">
                    <AdminReferralQueuePage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/referrals/:referralId"
                element={(
                  <PermissionRoute permissions={['viewReferralQueue', 'viewOwnPatients', 'viewConfirmedTimes']}>
                    <ReferralDetailPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/referrals"
                element={(
                  <PermissionRoute permission="viewOwnPatients">
                    <DepartmentReferralsPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/mina-patienter"
                element={(
                  <PermissionRoute permission="viewOwnPatients">
                    <DepartmentReferralsPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/confirmed-bookings"
                element={(
                  <PermissionRoute permission="viewConfirmedTimes">
                    <DepartmentConfirmedBookingsPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/bekraftade-tider"
                element={(
                  <PermissionRoute permission="viewConfirmedTimes">
                    <DepartmentConfirmedBookingsPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/calendar"
                element={(
                  <PermissionRoute permission="viewCalendar">
                    <CalendarOverviewPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/patients"
                element={(
                  <PermissionRoute permissions={['manageUsers', 'manageSettings']}>
                    <PatientsPage />
                  </PermissionRoute>
                )}
              />
              <Route
                path="/documents"
                element={(
                  <PermissionRoute permission="viewDocuments">
                    <DocumentsPage />
                  </PermissionRoute>
                )}
              />

              {/* The admin page requires the admin role even if someone types the URL directly. */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/users" element={<AdminPage />} />
                <Route path="/admin/settings" element={<AdminPage />} />
                <Route path="/admin/audit" element={<AuditLogPage />} />
              </Route>
            </Route>

            {/* If the user enters an unknown URL, redirect them back to the home page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}
