import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { BarChart2, CalendarDays, FileText, Plus, Settings, Zap } from 'lucide-react';
import LanguageSwitch from '../common/LanguageSwitch';
import { useLanguage } from '../../context/LanguageContext';

const navItems = [
  { to: '/',           labelKey: 'start' as const,       icon: Zap,          end: true  },
  { to: '/referral',   labelKey: 'newReferral' as const, icon: Plus,         end: false },
  { to: '/bookings',   labelKey: 'bookings' as const,    icon: CalendarDays, end: false },
  { to: '/documents',  labelKey: 'documents' as const,   icon: FileText,     end: false },
  { to: '/statistik',  labelKey: 'statistics' as const,  icon: BarChart2,    end: false },
];

const adminItems = [
  { to: '/admin', labelKey: 'administration' as const, icon: Settings, end: false },
];

function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useLanguage();

  return (
    <aside aria-label="Sidopanel" style={{
      width: 220, flexShrink: 0,
      background: '#172033', color: '#fff',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, bottom: 0, left: 0,
      height: '100dvh', zIndex: 30,
      boxShadow: '2px 0 10px rgba(23, 32, 51, 0.08)',
    }}>
      <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8494AA' }}>
          Psykiatri Affektiva
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'var(--ect-color)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 750, color: '#fff', lineHeight: 1.1 }}>ECT / rTMS</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8494AA' }}>Sahlgrenska</div>
          </div>
        </div>
      </div>

      <nav aria-label="Huvudnavigation" style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 9,
              fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
              background: isActive ? 'var(--ect-bg)' : 'transparent',
              color: isActive ? '#0F5C9F' : '#C4CEDB',
              transition: 'background 0.14s, color 0.14s',
            })}
          >
            <item.icon size={18} />
            {t(item.labelKey)}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5C6B82', padding: '16px 10px 7px' }}>
              Admin
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 9,
                  fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
                  background: isActive ? 'var(--ect-bg)' : 'transparent',
                  color: isActive ? '#0F5C9F' : '#C4CEDB',
                  transition: 'background 0.14s, color 0.14s',
                })}
              >
                <item.icon size={18} />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <LanguageSwitch dark />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 999,
            background: 'var(--ect-color)', color: '#fff',
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
              {user?.role || user?.email}
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
