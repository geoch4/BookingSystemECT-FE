import type { BookingPriority } from '../types';

export type ReferralActionType = 'completion' | 'prioritize' | 'pause' | 'cancel' | 'end';

export interface ReferralActionNote {
  type: ReferralActionType;
  title: string;
  comment: string;
  priority?: BookingPriority;
  confirmedDateTime?: string;
  createdAt: string;
  responseComment?: string;
  respondedAt?: string;
}

export interface ReferralActionEvent extends ReferralActionNote {
  id: string;
}

export type ReferralActionMap = Record<string, ReferralActionNote>;
export type ReferralActionEventMap = Record<string, ReferralActionEvent[]>;

const STORAGE_KEY = 'referralActionNotes';
const EVENT_STORAGE_KEY = 'referralActionEvents';

function readActionMap(): ReferralActionMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeActionMap(map: ReferralActionMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function readEventMap(): ReferralActionEventMap {
  try {
    const raw = localStorage.getItem(EVENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ReferralActionEventMap;
    return parsed;
  } catch {
    return {};
  }
}

function writeEventMap(map: ReferralActionEventMap) {
  localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(map));
}

function eventFromNote(note: ReferralActionNote): ReferralActionEvent {
  return {
    id: `${note.createdAt}-${note.type}`,
    ...note,
  };
}

function syncLegacyNote(referralId: string, note: ReferralActionNote) {
  const map = readActionMap();
  map[referralId] = note;
  writeActionMap(map);
  return map;
}

export function getAllReferralActionNotes(): ReferralActionMap {
  const legacyMap = readActionMap();
  const eventMap = getAllReferralActionEvents();
  const latestFromEvents = Object.fromEntries(
    Object.entries(eventMap)
      .filter(([, events]) => events.length > 0)
      .map(([referralId, events]) => [
        referralId,
        [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
      ]),
  );

  return { ...legacyMap, ...latestFromEvents };
}

export function getAllReferralActionEvents(): ReferralActionEventMap {
  const events = readEventMap();
  const legacyMap = readActionMap();

  Object.entries(legacyMap).forEach(([referralId, note]) => {
    if (!events[referralId]?.length) {
      events[referralId] = [eventFromNote(note)];
    }
  });

  return events;
}

export function saveReferralActionNote(referralId: string, note: ReferralActionNote) {
  const events = readEventMap();
  events[referralId] = [...(events[referralId] ?? []), eventFromNote(note)]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  writeEventMap(events);
  return syncLegacyNote(referralId, note);
}

export function saveReferralCompletionResponse(referralId: string, responseComment: string) {
  const map = getAllReferralActionNotes();
  const current = map[referralId];
  const responseEvent: ReferralActionNote = {
    type: 'completion',
    title: 'Komplettering skickad från avdelningen',
    comment: responseComment,
    createdAt: new Date().toISOString(),
  };

  const events = readEventMap();
  events[referralId] = [...(events[referralId] ?? []), eventFromNote(responseEvent)]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  writeEventMap(events);

  if (!current) return syncLegacyNote(referralId, responseEvent);

  const updatedCurrent = {
    ...current,
    title: 'Komplettering skickad från avdelningen',
    responseComment,
    respondedAt: new Date().toISOString(),
  };

  return syncLegacyNote(referralId, updatedCurrent);
}

export function referralIdForBooking(bookingId: number) {
  return `referral-${bookingId}`;
}
