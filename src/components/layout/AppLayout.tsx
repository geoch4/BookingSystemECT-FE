import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { token, user } = useAuth();

  if (!token || !user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <a href="#main-content" className="skip-link">Hoppa till innehåll</a>
      <Sidebar />
      <main
        id="main-content"
        className="min-w-0 overflow-x-hidden"
        style={{ marginLeft: 220, minHeight: '100dvh' }}
      >
        <Outlet />
      </main>
    </div>
  );
}
