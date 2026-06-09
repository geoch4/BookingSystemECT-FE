import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import { getRoles } from '../api/roles';
import { useQuery } from '@tanstack/react-query';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login } = useAuth();
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

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
  }

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiLogin({ email, password });
      if (result.success && result.data) {
        login(result.data);
        navigate('/');
      } else {
        setError(result.errorMessage ?? 'Fel e-post eller lösenord.');
      }
    } catch {
      setError('Kunde inte ansluta till servern.');
    } finally {
      setLoading(false);
    }
  }

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
    <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1A4F8A] text-white text-2xl font-bold mb-4">
            ECT
          </div>
          <h1 className="text-2xl font-semibold text-[#1A2332]">
            {mode === 'login' ? 'Logga in' : 'Skapa konto'}
          </h1>
          <p className="text-sm text-[#8494AA] mt-1">ECT/rTMS Bokningssystem</p>
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
                  : 'text-[#8494AA] hover:text-[#4B5770]'
              }`}
            >
              {m === 'login' ? 'Logga in' : 'Registrera'}
            </button>
          ))}
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">E-post</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
                placeholder="namn@vgregion.se"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">Lösenord</label>
              <input
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
              {loading ? 'Loggar in...' : 'Logga in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">Fullständigt namn</label>
              <input
                type="text"
                required
                value={regFullname}
                onChange={(e) => setRegFullname(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
                placeholder="Anna Andersson"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">E-post</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
                placeholder="namn@vgregion.se"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">Lösenord</label>
              <input
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
              <label className="block text-sm font-medium text-[#4B5770] mb-1">Roll</label>
              <select
                required
                value={regRoleId || ''}
                onChange={(e) => setRegRoleId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
              >
                <option value="">Välj roll...</option>
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
              {loading ? 'Skapar konto...' : 'Skapa konto'}
            </button>
            <p className="text-xs text-center text-[#8494AA]">
              Kräver admin-behörighet. Kontakta systemadmin om du inte kan registrera dig.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
