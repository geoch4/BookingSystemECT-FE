const STORAGE_KEY = 'ect-department-priorities';

export type DepartmentPriorityMap = Record<number, number>;

function readPriorityMap(): DepartmentPriorityMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePriorityMap(map: DepartmentPriorityMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getAllDepartmentPriorities(): DepartmentPriorityMap {
  return readPriorityMap();
}

export function getDepartmentPriorityForBooking(bookingId: number): number | undefined {
  return readPriorityMap()[bookingId];
}

export function saveDepartmentPriority(bookingId: number, priority?: number): DepartmentPriorityMap {
  const map = readPriorityMap();

  if (!priority) {
    delete map[bookingId];
  } else {
    map[bookingId] = priority;
  }

  writePriorityMap(map);
  return map;
}
