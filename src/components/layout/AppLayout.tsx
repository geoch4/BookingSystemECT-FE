import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { token, user } = useAuth();

  if (!token || !user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
