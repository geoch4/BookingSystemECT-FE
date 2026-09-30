import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Home } from 'lucide-react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Sidebar from './Sidebar';
import { getAllowedPortalMode, getPortalHomePath, getPortalMode } from '../../config/portal';
import { getNotifications, markNotificationAsRead } from '../../api/notifications';

export default function AppLayout() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: Boolean(token && user),
    retry: 1,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!token || !user) return <Navigate to="/login" replace />;

  const requestedPortal = getPortalMode();
  const allowedPortal = getAllowedPortalMode(user.role);

  if (requestedPortal !== allowedPortal) {
    return <Navigate to={getPortalHomePath(allowedPortal)} replace />;
  }

  const isHome = location.pathname === '/';
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <a href="#main-content" className="skip-link">Hoppa till innehåll</a>
      <Sidebar />
      <main
        id="main-content"
        className="min-w-0 overflow-x-hidden"
        style={{ marginLeft: 220, minHeight: '100dvh' }}
      >
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#E3D8CB] bg-[#F4F0EA]/90 px-6 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E3D8CB] bg-[#FFFCF7] px-3 py-2 text-sm font-semibold text-[#4B5770] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#CBBBA8] hover:bg-[#FBF7F0]"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Tillbaka
            </button>
            {!isHome && (
              <button
                type="button"
                onClick={() => navigate(getPortalHomePath(allowedPortal))}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E3D8CB] bg-[#FFFCF7] px-3 py-2 text-sm font-semibold text-[#4B5770] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#CBBBA8] hover:bg-[#FBF7F0]"
              >
                <Home size={16} aria-hidden="true" />
                Start
              </button>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              aria-label="Notiser"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E3D8CB] bg-[#FFFCF7] text-[#4B5770] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#CBBBA8] hover:bg-[#FBF7F0]"
              title="Notiser"
            >
              <Bell size={18} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#9F3A38] px-1 text-[11px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <section className="absolute right-0 mt-2 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-[#E3D8CB] bg-[#FFFCF7] p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-[#29374F]">Notiser</h2>
                  <span className="text-xs font-semibold text-[#68738A]">{unreadCount} olästa</span>
                </div>

                {notificationsQuery.isError ? (
                  <p className="rounded-lg bg-[#FFF4E8] px-3 py-2 text-sm text-[#7A4E16]">
                    Notiser kunde inte hämtas just nu.
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="rounded-lg bg-[#F4F0EA] px-3 py-2 text-sm text-[#68738A]">
                    Inga notiser.
                  </p>
                ) : (
                  <ul className="max-h-80 space-y-2 overflow-y-auto">
                    {notifications.slice(0, 8).map((notification) => (
                      <li key={notification.notificationId}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsReadMutation.mutate(notification.notificationId);
                            }
                          }}
                          className="w-full rounded-lg border border-[#ECE2D8] bg-white px-3 py-2 text-left transition hover:border-[#CBBBA8] hover:bg-[#FBF7F0]"
                        >
                          <span className="flex items-start gap-2">
                            <span
                              aria-hidden="true"
                              className={`mt-1.5 h-2 w-2 flex-none rounded-full ${notification.isRead ? 'bg-[#C6B8A6]' : 'bg-[#9F3A38]'}`}
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#29374F]">{notification.message}</span>
                              <span className="mt-1 block text-xs text-[#68738A]">
                                {new Date(notification.sentAt ?? notification.createdAt).toLocaleString('sv-SE', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
