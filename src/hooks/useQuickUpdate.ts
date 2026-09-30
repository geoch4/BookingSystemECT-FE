import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBooking, type AuditRequestOptions } from '../api/bookings';
import type { CreateBookingDto } from '../types';

export function useQuickUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto, auditReason }: { id: number; dto: CreateBookingDto } & AuditRequestOptions) =>
      updateBooking(id, dto, { auditReason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}
