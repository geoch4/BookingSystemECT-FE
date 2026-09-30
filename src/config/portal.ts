import { getAllowedPortalByPermissions } from '../utils/permissions';

export type PortalMode = 'admin' | 'department';

const STORAGE_KEY = 'ect-rtms-portal-mode';

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
}

export function getPortalMode(): PortalMode {
  if (typeof window === 'undefined') return 'admin';

  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal');

  if (portalParam === 'admin' || portalParam === 'department') {
    localStorage.setItem(STORAGE_KEY, portalParam);
    return portalParam;
  }

  const hostname = window.location.hostname.toLowerCase();
  const firstLabel = hostname.split('.')[0];

  if (firstLabel === 'admin') return 'admin';
  if (firstLabel === 'avdelning' || firstLabel === 'department') return 'department';

  if (isLocalHost(hostname)) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'admin' || stored === 'department') return stored;
  }

  return 'department';
}

export function getAllowedPortalMode(role?: string): PortalMode {
  return getAllowedPortalByPermissions(role);
}

export function getPortalHomePath(portalMode: PortalMode) {
  return `/?portal=${portalMode}`;
}

export const portalLabels: Record<PortalMode, { eyebrow: string; title: string; subtitle: string }> = {
  admin: {
    eyebrow: 'Adminportal',
    title: 'ECT / rTMS',
    subtitle: 'Behandlingsenhet',
  },
  department: {
    eyebrow: 'Avdelningsportal',
    title: 'ECT / rTMS',
    subtitle: 'Remisser och tider',
  },
};
