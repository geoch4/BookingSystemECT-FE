import {
  saveBookingReferralMeta,
  getBookingReferralMeta,
  getAllBookingReferralMeta,
  deleteBookingReferralMeta,
  getReferralMetaForBooking,
} from '../../utils/bookingMeta';
import type { BookingDto } from '../../types';

const meta1 = { department: 'Avdelning 361', contactName: 'Anna Sjöberg', contactPhone: '031-342 10 61' };
const meta2 = { department: 'Avdelning 362', contactName: 'Erik Lund', contactPhone: '031-342 10 62' };

describe('bookingMeta', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns undefined for unknown bookingId', () => {
    expect(getBookingReferralMeta(99)).toBeUndefined();
  });

  it('saves and retrieves meta for a booking', () => {
    saveBookingReferralMeta(1, meta1);
    expect(getBookingReferralMeta(1)).toEqual(meta1);
  });

  it('overwrites existing meta on save', () => {
    saveBookingReferralMeta(1, meta1);
    saveBookingReferralMeta(1, meta2);
    expect(getBookingReferralMeta(1)?.department).toBe('Avdelning 362');
  });

  it('getAllBookingReferralMeta returns all saved entries', () => {
    saveBookingReferralMeta(1, meta1);
    saveBookingReferralMeta(2, meta2);
    const all = getAllBookingReferralMeta();
    expect(all[1]).toEqual(meta1);
    expect(all[2]).toEqual(meta2);
  });

  it('deleteBookingReferralMeta removes entry', () => {
    saveBookingReferralMeta(1, meta1);
    deleteBookingReferralMeta(1);
    expect(getBookingReferralMeta(1)).toBeUndefined();
  });

  it('deleteBookingReferralMeta does not affect other entries', () => {
    saveBookingReferralMeta(1, meta1);
    saveBookingReferralMeta(2, meta2);
    deleteBookingReferralMeta(1);
    expect(getBookingReferralMeta(2)).toEqual(meta2);
  });

  describe('getReferralMetaForBooking', () => {
    it('returns undefined when no data available', () => {
      const booking = { bookingId: 1 } as BookingDto;
      expect(getReferralMetaForBooking(booking, undefined)).toBeUndefined();
    });

    it('prefers booking fields over legacy meta', () => {
      const booking = {
        bookingId: 1,
        referralDepartment: 'Från bokning',
        referralContactName: 'Bokningskontakt',
        referralContactPhone: '031-000',
      } as BookingDto;
      const legacy = { department: 'Legacy', contactName: 'Legacy kontakt', contactPhone: '000' };
      const result = getReferralMetaForBooking(booking, legacy);
      expect(result?.department).toBe('Från bokning');
      expect(result?.contactName).toBe('Bokningskontakt');
    });

    it('falls back to legacy meta when booking fields are absent', () => {
      const booking = { bookingId: 1 } as BookingDto;
      const legacy = { department: 'Legacy avd', contactName: 'Legacy namn', contactPhone: '031-999' };
      const result = getReferralMetaForBooking(booking, legacy);
      expect(result?.department).toBe('Legacy avd');
    });
  });
});
