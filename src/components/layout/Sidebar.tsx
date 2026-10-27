import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { BarChart3, CalendarCheck, CalendarDays, ClipboardList, FileText, ListChecks, PauseCircle, Plus, Settings, Users, Zap } from 'lucide-react';
import LanguageSwitch from '../common/LanguageSwitch';
import { useLanguage } from '../../context/LanguageContext';
import { getAllowedPortalMode, portalLabels } from '../../config/portal';
import { roleDisplayName, type AppRole, type Permission } from '../../utils/permissions';

type NavItem = {
  to: string;
  labelKey: Parameters<ReturnType<typeof useLanguage>['t']>[0];
  icon: typeof Zap;
  end: boolean;
  permission?: Permission;
};

const departmentNavItems: NavItem[] = [
  { to: '/', labelKey: 'start', icon: Zap, end: true },
  { to: '/ny-remiss', labelKey: 'newReferral', icon: Plus, end: false, permission: 'createReferral' },
  { to: '/referrals', labelKey: 'referrals', icon: ClipboardList, end: false, permission: 'viewOwnPatients' },
  { to: '/bekraftade-tider', labelKey: 'bookedTimes', icon: CalendarCheck, end: false, permission: 'viewConfirmedTimes' },
  { to: '/patient-atgard', labelKey: 'patientAction', icon: PauseCircle, end: false, permission: 'recordPatientAction' },
];

const coordinatorNavItems: NavItem[] = [
  { to: '/', labelKey: 'start', icon: Zap, end: true },
  { to: '/remissko', labelKey: 'referralQueue', icon: ClipboardList, end: false, permission: 'viewReferralQueue' },
  { to: '/dagens-lista', labelKey: 'dailyList', icon: CalendarCheck, end: false, permission: 'viewDailyList' },
  { to: '/bookings?action=new', labelKey: 'newBooking', icon: Plus, end: false, permission: 'confirmElvisBooking' },
];

const doctorNavItems: NavItem[] = [
  { to: '/', labelKey: 'start', icon: Zap, end: true },
  { to: '/remissko', labelKey: 'referralsToAssess', icon: ClipboardList, end: false, permission: 'viewReferralQueue' },
  { to: '/dagens-lista', labelKey: 'dailyList', icon: CalendarCheck, end: false, permission: 'viewDailyList' },
];

const adminNavItems: NavItem[] = [
  { to: '/', labelKey: 'start', icon: Zap, end: true },
  { to: '/remissko', labelKey: 'referralQueue', icon: ClipboardList, end: false, permission: 'viewReferralQueue' },
  { to: '/dagens-lista', labelKey: 'dailyList', icon: CalendarCheck, end: false, permission: 'viewDailyList' },
  { to: '/bookings?action=new', labelKey: 'newBooking', icon: Plus, end: false, permission: 'confirmElvisBooking' },
  { to: '/calendar', labelKey: 'calendar', icon: CalendarDays, end: false, permission: 'viewCalendar' },
  { to: '/documents', labelKey: 'documents', icon: FileText, end: false, permission: 'viewDocuments' },
  { to: '/statistik', labelKey: 'statistics', icon: BarChart3, end: false, permission: 'viewStatistics' },
  { to: '/admin/users', labelKey: 'users', icon: Users, end: false, permission: 'manageUsers' },
  { to: '/admin/audit', labelKey: 'auditLog', icon: ListChecks, end: false, permission: 'viewAuditLog' },
  { to: '/admin/settings', labelKey: 'settings', icon: Settings, end: false, permission: 'manageSettings' },
];

function getNavItems(portalMode: 'admin' | 'department', appRole: AppRole | null | undefined) {
  if (portalMode === 'department') return departmentNavItems;
  if (appRole === 'admin') return adminNavItems;
  if (appRole === 'medical-responsible') return doctorNavItems;
  return coordinatorNavItems;
}

function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function Sidebar({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const { user, logout, hasPermission, appRole } = useAuth();
  const { t } = useLanguage();
  const portalMode = getAllowedPortalMode(user?.role);
  const baseNavItems = getNavItems(portalMode, appRole);
  const navItems = baseNavItems.filter((item) => !item.permission || hasPermission(item.permission));
  const portal = portalLabels[portalMode];
  const roleLabel = roleDisplayName(user?.role);

  return (
    <aside id="app-sidebar" aria-label="Sidopanel" className={`${mobileOpen ? 'flex' : 'hidden'} flex-col md:flex`} style={{
      width: 220, flexShrink: 0,
      background: 'linear-gradient(180deg, #1F2937 0%, #111827 58%, #0F172A 100%)', color: '#fff',
      flexDirection: 'column',
      position: 'fixed', top: 0, bottom: 0, left: 0,
      height: '100dvh', zIndex: 30,
      boxShadow: '8px 0 28px rgba(17, 24, 39, 0.16)',
    }}>
      <button type="button" onClick={onNavigate} className="m-3 self-end rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white md:hidden">Stäng meny</button>
      <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8494AA' }}>
          {portal.eyebrow}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--ect-color), var(--rtms-color))', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 750, color: '#fff', lineHeight: 1.1 }}>{portal.title}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8494AA' }}>{portal.subtitle}</div>
          </div>
        </div>
        <div style={{
          marginTop: 12,
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.06)',
          padding: '8px 10px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA8B8' }}>
            Inloggad roll
          </div>
          <div style={{ marginTop: 2, fontSize: 12.5, fontWeight: 750, color: '#F8FAFC' }}>{roleLabel}</div>
        </div>
      </div>

      <nav aria-label="Huvudnavigation" style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        {navItems.map((item) => (
          <NavLink
            onClick={onNavigate}
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 9,
              fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
              background: isActive ? 'rgba(255,255,255,0.13)' : 'transparent',
              color: isActive ? '#FFFFFF' : '#C4CEDB',
              boxShadow: isActive ? 'inset 3px 0 0 var(--ect-color)' : 'inset 3px 0 0 transparent',
              transition: 'background 0.14s, color 0.14s, box-shadow 0.14s',
            })}
          >
            <item.icon size={18} />
            {t(item.labelKey)}
          </NavLink>
        ))}

      </nav>

      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <LanguageSwitch dark />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 999,
            background: 'linear-gradient(135deg, var(--ect-color), var(--rtms-color))', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12.5, fontWeight: 800, flexShrink: 0,
          }}>
            {initials(user?.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: '#7A8797', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.role ? roleDisplayName(user.role) : user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{ marginTop: 14, background: 'transparent', border: 0, color: '#8494AA', fontSize: 12, fontWeight: 600, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
        >
          {t('logout')} →
        </button>
      </div>
    </aside>
  );
}
