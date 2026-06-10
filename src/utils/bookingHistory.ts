import type { BookingStatus, BookingPriority } from '../types';

export interface BookingHistoryEntry {
  timestamp: string;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  fromPriority: BookingPriority;
  toPriority: BookingPriority;
  cancellationReason?: string;
}

const STORAGE_KEY = 'bookingStatusHistory';
type HistoryMap = Record<number, BookingHistoryEntry[]>;

function readHistoryMap(): HistoryMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryMap) : {};
  } catch {
    return {};
  }
}

function writeHistoryMap(map: HistoryMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function addHistoryEntry(bookingId: number, entry: BookingHistoryEntry) {
  const map = readHistoryMap();
  map[bookingId] = [entry, ...(map[bookingId] ?? [])];
  writeHistoryMap(map);
}

export function getBookingHistory(bookingId: number): BookingHistoryEntry[] {
  return readHistoryMap()[bookingId] ?? [];
}

export function getAllBookingHistory(): HistoryMap {
  return readHistoryMap();
}

export function deleteBookingHistory(bookingId: number) {
  const map = readHistoryMap();
  delete map[bookingId];
  writeHistoryMap(map);
}
