import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function AdminRoute() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
