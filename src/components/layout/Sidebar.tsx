import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const navItems = [
  { to: '/',           label: 'Start',         icon: '⚡', end: true },
  { to: '/referral',   label: 'Ny remiss',      icon: '📨', end: false },
  { to: '/bookings',   label: 'Bokningar',      icon: '📅', end: false },
  { to: '/documents',  label: 'Styrdokument',   icon: '📄', end: false },
  { to: '/statistik',  label: 'Statistik & Kvalitet', icon: '📊', end: false },
];

const adminItems = [
  { to: '/admin', label: 'Administration', icon: '⚙️', end: false },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="w-56 flex-shrink-0 bg-[#172033] text-white flex flex-col min-h-screen">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="text-xs font-semibold text-[#8494AA] uppercase tracking-widest mb-1">
          Psykiatri Affektiva
        </div>
        <div className="text-base font-bold text-white">ECT / rTMS</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#EAF4FC] text-[#185FA5]'
                  : 'text-[#8494AA] hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs font-semibold text-[#4B5770] uppercase tracking-widest">
              Admin
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[#EAF4FC] text-[#185FA5]'
                      : 'text-[#8494AA] hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-xs text-[#8494AA] mb-0.5 truncate">{user?.name}</div>
        <div className="text-xs text-[#4B5770] mb-3 truncate">{user?.email}</div>
        <button
          onClick={logout}
          className="w-full text-left text-xs text-[#8494AA] hover:text-white transition-colors"
        >
          Logga ut →
        </button>
      </div>
    </aside>
  );
}
