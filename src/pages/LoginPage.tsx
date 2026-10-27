import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import { getRoles } from '../api/roles';
import { useQuery } from '@tanstack/react-query';
import LanguageSwitch from '../components/common/LanguageSwitch';
import { useLanguage } from '../context/LanguageContext';
import { DEMO_MODE } from '../config/demo';

type Mode = 'login' | 'register';

const demoUsers = [
  {
    email: 'admin@test.se',
    password: 'Admin123!',
    name: 'Test Admin',
    role: 'admin',
  },
  {
    email: 'avdelning@test.se',
    password: 'Avdelning123!',
    name: 'Avdelning Test',
    role: 'Avdelning',
  },
  {
    email: 'behandling@test.se',
    password: 'Behandling123!',
    name: 'Behandlingsenhet Test',
    role: 'Behandlingsenhet',
  },
  {
    email: 'lakare@test.se',
    password: 'Lakare123!',
    name: 'Medicinskt ansvarig Test',
    role: 'Medicinskt ansvarig',
  },
];

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createDemoToken(user: { email: string; name: string; role: string }) {
  const header = toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = toBase64Url(JSON.stringify({
    sub: user.email,
    email: user.email,
    name: user.name,
    role: user.role,
    care_unit: user.role === 'Avdelning' ? 'Avdelning 361' : 'ECT-enhet',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  }));

  return `${header}.${payload}.demo`;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regFullname, setRegFullname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRoleId, setRegRoleId] = useState(0);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: mode === 'register',
  });

  // Switches between the login and register forms, clearing any leftover error.
  function switchMode(m: Mode) {
    setMode(m);
    setError('');
  }

  // Logs the user in and redirects to the home page on success.
  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (DEMO_MODE) {
        const demoUser = demoUsers.find((user) => (
          user.email.toLowerCase() === email.trim().toLowerCase()
          && user.password === password
        ));

        if (demoUser) {
          login(createDemoToken(demoUser));
          navigate('/');
          return;
        }
      }

      const result = await apiLogin({ email, password });
      if (result.success && result.data) {
        login(result.data);
        navigate('/');
      } else {
        setError(result.errorMessage ?? 'Fel e-post eller lösenord.');
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const errorMessage = (err as { response?: { data?: { errorMessage?: string } } })?.response?.data?.errorMessage;
      setError(status === 429
        ? 'För många inloggningsförsök. Vänta en minut och försök igen.'
        : errorMessage ?? 'Kunde inte ansluta till servern.');
    } finally {
      setLoading(false);
    }
  }

  // Registers a new account (admin-only) then logs the new user in automatically.
  async function handleRegister(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiRegister({
        fullname: regFullname,
        email: regEmail,
        password: regPassword,
        roleId: regRoleId,
      });
      if (result.success) {
        // Auto-login after registration
        const loginResult = await apiLogin({ email: regEmail, password: regPassword });
        if (loginResult.success && loginResult.data) {
          login(loginResult.data);
          navigate('/');
        } else {
          switchMode('login');
          setEmail(regEmail);
        }
      } else {
        setError(result.errorMessage ?? 'Kunde inte registrera kontot.');
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        setError('Registrering kräver admin-behörighet. Kontakta systemadministratören.');
      } else {
        setError('Kunde inte ansluta till servern.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#F0F4F8]">
      <div className="absolute right-5 top-5">
        <LanguageSwitch />
      </div>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1A4F8A] text-white text-2xl font-bold mb-4">
            ECT
          </div>
          <h1 className="text-2xl font-semibold text-[#1A2332]">
            {mode === 'login' ? t('signIn') : t('createAccount')}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">{t('bookingSystem')}</p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-[#F0F4F8] rounded-lg p-1 mb-6">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-white text-[#1A2332] shadow-sm'
                  : 'text-[#4B5770] hover:text-[#1A2332]'
              }`}
            >
              {m === 'login' ? t('signIn') : t('register')}
            </button>
          ))}
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#4B5770] mb-1">{t('email')}</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
                placeholder="namn@vgregion.se"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[#4B5770] mb-1">{t('password')}</label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-[#C42B2B] bg-[#FDEAEA] px-3 py-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A4F8A] hover:bg-[#1a3f6f] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {loading ? t('signingIn') : t('signIn')}
            </button>
            {DEMO_MODE && (
              <div className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Testkonton</div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {demoUsers.map((user) => (
                    <button
                      key={user.email}
                      type="button"
                      onClick={() => {
                        setEmail(user.email);
                        setPassword(user.password);
                      }}
                      className="rounded-lg border border-[#DDE3EC] bg-white px-3 py-2 text-left text-xs font-semibold text-[#4B5770] hover:border-[#1A4F8A] hover:text-[#1A4F8A]"
                    >
                      {user.role}: {user.email}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="register-fullname" className="block text-sm font-medium text-[#4B5770] mb-1">{t('fullName')}</label>
              <input
                id="register-fullname"
                type="text"
                required
                value={regFullname}
                onChange={(e) => setRegFullname(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
                placeholder="Anna Andersson"
              />
            </div>
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-[#4B5770] mb-1">{t('email')}</label>
              <input
                id="register-email"
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
                placeholder="namn@vgregion.se"
              />
            </div>
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-[#4B5770] mb-1">{t('password')}</label>
              <input
                id="register-password"
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
                placeholder="Minst 6 tecken"
              />
            </div>
            <div>
              <label htmlFor="register-role" className="block text-sm font-medium text-[#4B5770] mb-1">{t('role')}</label>
              <select
                id="register-role"
                required
                value={regRoleId || ''}
                onChange={(e) => setRegRoleId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
              >
                <option value="">{t('chooseRole')}</option>
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-[#C42B2B] bg-[#FDEAEA] px-3 py-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading || !regRoleId}
              className="w-full bg-[#1A4F8A] hover:bg-[#1a3f6f] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {loading ? t('creatingAccount') : t('createAccount')}
            </button>
            <p className="text-xs text-center text-[#64748B]">
              Kräver admin-behörighet. Kontakta systemadmin om du inte kan registrera dig.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
