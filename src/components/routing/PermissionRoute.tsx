import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import type { Permission } from '../../utils/permissions';

type PermissionRouteProps = {
  permission?: Permission;
  permissions?: Permission[];
  children?: React.ReactNode;
};

export default function PermissionRoute({ permission, permissions, children }: PermissionRouteProps) {
  const { token, user, hasAnyPermission } = useAuth();
  const requiredPermissions = permissions ?? (permission ? [permission] : []);
  const isAllowed = requiredPermissions.length === 0 || hasAnyPermission(requiredPermissions);

  if (!token || !user) return <Navigate to="/login" replace />;
  if (!isAllowed) return <Navigate to="/" replace />;

  if (children) return <>{children}</>;
  return <Outlet />;
}
