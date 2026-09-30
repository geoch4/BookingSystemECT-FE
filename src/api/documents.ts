import client from './client';
import type { DocumentDto, CreateDocumentDto } from '../types';

// ─── Document API ─────────────────────────────────────────────────────────────
// This file handles governing documents and document records.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDocument(document: any): DocumentDto {
  return {
    ...document,
    documentId: document.documentId ?? document.id,
    fileName: document.fileName ?? document.title ?? document.titel ?? 'Dokument',
    verified: document.verified ?? (document.status ? document.status === 'giltig' : true),
    uploadedByUserId: document.uploadedByUserId ?? document.uploadedBy ?? 0,
    title: document.title ?? document.titel ?? document.fileName,
    documentType: document.documentType ?? document.typ,
    businessArea: document.businessArea ?? document.verksamhet,
    version: document.version,
    owner: document.owner ?? document.ansvarig,
    validFrom: document.validFrom ?? document.giltigFran,
    validTo: document.validTo ?? document.giltigTill,
    externalDocumentId: document.externalDocumentId ?? document.dokumentId,
    description: document.description ?? document.beskrivning,
    link: document.link ?? document.lank,
  };
}

// Fetches all documents.
export const getDocuments = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.get<any[]>('/document').then((r) => r.data.map(normalizeDocument));

// Creates a new document record.
export const createDocument = (dto: CreateDocumentDto) =>
  client.post<DocumentDto>('/document', dto).then((r) => r.data);

// Deletes a document record.
export const deleteDocument = (id: number) =>
  client.delete(`/document/${id}`);
