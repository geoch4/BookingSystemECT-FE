import client from './client';
import type { NotificationDto } from '../types';

export async function getNotifications(): Promise<NotificationDto[]> {
  const response = await client.get<NotificationDto[]>('/notification');
  return response.data;
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  await client.patch(`/notification/${notificationId}/read`);
}
