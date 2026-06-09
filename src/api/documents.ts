import client from './client';
import type { DocumentDto, CreateDocumentDto } from '../types';

// ─── Document API ─────────────────────────────────────────────────────────────
// Den här filen hanterar styrdokument och dokumentposter.

// Hämtar alla dokument.
export const getDocuments = () =>
  client.get<DocumentDto[]>('/document').then((r) => r.data);

// Skapar en ny dokumentpost.
export const createDocument = (dto: CreateDocumentDto) =>
  client.post<DocumentDto>('/document', dto).then((r) => r.data);

// Raderar en dokumentpost.
export const deleteDocument = (id: number) =>
  client.delete(`/document/${id}`);
