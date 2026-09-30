import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function AdminRoute() {
  const { token, user, hasAnyPermission } = useAuth();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (!hasAnyPermission(['manageUsers', 'manageSettings'])) return <Navigate to="/" replace />;

  return <Outlet />;
}
