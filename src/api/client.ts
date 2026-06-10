import axios from 'axios';
import { clearAuthToken, getAuthToken } from '../utils/authToken';

// ─── Gemensam API-klient ──────────────────────────────────────────────────────
// Den här axios-klienten används av alla filer i src/api.
// På så sätt slipper vi skriva backend-adress och headers i varje API-fil.

// baseURL '/api' betyder att frontend skickar anrop via Vite-proxyn.
// Vite skickar sedan vidare anropet till backend-servern.
const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor körs innan varje API-anrop skickas.
client.interceptors.request.use((config) => {
  // Hämta JWT-token om användaren är inloggad.
  const token = getAuthToken();

  // Om token finns skickas den med i Authorization-headern.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Returnera config så axios kan fortsätta med anropet.
  return config;
});

// Response interceptor körs efter att backend har svarat.
client.interceptors.response.use(
  // Om svaret är OK returneras det som vanligt.
  (res) => res,

  // Om backend returnerar fel hanteras det här.
  (err) => {
    if (err.response) {
      console.error('[API ERROR]', err.config?.method?.toUpperCase(), err.config?.url, err.response.status);
      console.error('[API ERROR body]', JSON.stringify(err.response.data, null, 2));
    }
    // 401 betyder att användaren inte längre är behörig/inloggad.
    if (err.response?.status === 401) {
      // Ta bort token eftersom den inte längre fungerar.
      clearAuthToken();

      // Skicka användaren tillbaka till login-sidan.
      window.location.href = '/login';
    }

    // Skicka vidare felet så sidan som gjorde anropet kan visa felmeddelande.
    return Promise.reject(err);
  }
);

// Exportera klienten så andra API-filer kan återanvända den.
export default client;
