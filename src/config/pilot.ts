const defaultCareUnits = [
  'Psykiatri affektiva, Sahlgrenska',
  'Psykiatri psykos, Sahlgrenska',
  'Psykiatri beroende, Sahlgrenska',
  'Psykiatri NU-sjukvarden',
  'Psykiatri Sodra Alvsborg',
];

function readString(name: string, fallback: string) {
  const value = import.meta.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readList(name: string, fallback: string[]) {
  const value = import.meta.env[name];
  if (typeof value !== 'string' || !value.trim()) return fallback;

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const PILOT_REGION_CODE = readString('VITE_PILOT_REGION_CODE', 'VGR');
export const PILOT_SOURCE_SYSTEM = readString('VITE_PILOT_SOURCE_SYSTEM', 'Manual');
export const PILOT_CARE_UNITS = readList('VITE_PILOT_CARE_UNITS', defaultCareUnits);
