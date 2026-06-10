import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBooking } from '../api/bookings';
import type { CreateBookingDto } from '../types';

export function useQuickUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CreateBookingDto }) => updateBooking(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}
