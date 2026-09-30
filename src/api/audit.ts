import client from './client';

export interface AuditLogDto {
  auditLogId: number;
  entityName: string;
  entityId: string;
  action: string;
  createdAt: string;
  userId?: number;
  userName?: string;
  role?: string;
  careUnitId?: string;
  ipAddress?: string;
  requestMethod?: string;
  requestPath?: string;
  reason?: string;
  changedFields?: string;
}

export interface AuditLogQuery {
  entityName?: string;
  entityId?: string;
  limit?: number;
}

export async function getAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogDto[]> {
  const params = new URLSearchParams();
  if (query.entityName) params.set('entityName', query.entityName);
  if (query.entityId) params.set('entityId', query.entityId);
  if (query.limit) params.set('limit', String(query.limit));

  const response = await client.get<AuditLogDto[]>(`/audit${params.size ? `?${params.toString()}` : ''}`);
  return response.data;
}
