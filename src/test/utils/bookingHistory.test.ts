import {
  addHistoryEntry,
  getBookingHistory,
  getAllBookingHistory,
  deleteBookingHistory,
} from '../../utils/bookingHistory';
import type { BookingHistoryEntry } from '../../utils/bookingHistory';

const entry1: BookingHistoryEntry = {
  timestamp: '2026-06-10T08:00:00.000Z',
  fromStatus: 'Pending',
  toStatus: 'Confirmed',
  fromPriority: 'Green',
  toPriority: 'Green',
};

const entry2: BookingHistoryEntry = {
  timestamp: '2026-06-10T09:00:00.000Z',
  fromStatus: 'Confirmed',
  toStatus: 'Cancelled',
  fromPriority: 'Green',
  toPriority: 'Green',
  cancellationReason: 'Patienten avböjde',
};

describe('bookingHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array for unknown bookingId', () => {
    expect(getBookingHistory(999)).toEqual([]);
  });

  it('adds and retrieves a single entry', () => {
    addHistoryEntry(1, entry1);
    const history = getBookingHistory(1);
    expect(history).toHaveLength(1);
    expect(history[0].toStatus).toBe('Confirmed');
    expect(history[0].fromStatus).toBe('Pending');
  });

  it('prepends entries so newest is first', () => {
    addHistoryEntry(1, entry1);
    addHistoryEntry(1, entry2);
    const history = getBookingHistory(1);
    expect(history[0].toStatus).toBe('Cancelled');
    expect(history[1].toStatus).toBe('Confirmed');
  });

  it('stores cancellationReason correctly', () => {
    addHistoryEntry(1, entry2);
    const history = getBookingHistory(1);
    expect(history[0].cancellationReason).toBe('Patienten avböjde');
  });

  it('keeps entries for different bookings separate', () => {
    addHistoryEntry(1, entry1);
    addHistoryEntry(2, entry2);
    expect(getBookingHistory(1)).toHaveLength(1);
    expect(getBookingHistory(2)).toHaveLength(1);
    expect(getBookingHistory(1)[0].toStatus).toBe('Confirmed');
    expect(getBookingHistory(2)[0].toStatus).toBe('Cancelled');
  });

  it('deleteBookingHistory removes entries for the given id', () => {
    addHistoryEntry(1, entry1);
    deleteBookingHistory(1);
    expect(getBookingHistory(1)).toEqual([]);
  });

  it('deleteBookingHistory does not affect other bookings', () => {
    addHistoryEntry(1, entry1);
    addHistoryEntry(2, entry2);
    deleteBookingHistory(1);
    expect(getBookingHistory(2)).toHaveLength(1);
  });

  it('getAllBookingHistory returns all entries keyed by bookingId', () => {
    addHistoryEntry(1, entry1);
    addHistoryEntry(2, entry2);
    const all = getAllBookingHistory();
    expect(all[1]).toHaveLength(1);
    expect(all[2]).toHaveLength(1);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('bookingStatusHistory', 'not-valid-json{{{');
    expect(() => getBookingHistory(1)).not.toThrow();
    expect(getBookingHistory(1)).toEqual([]);
  });
});
