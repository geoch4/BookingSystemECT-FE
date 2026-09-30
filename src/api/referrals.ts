import client from './client';
import type {
  CreateReferralActionDto,
  ReferralActionDto,
  ReferralDto,
  ReferralTimelineEventDto,
} from '../types';

interface AuditRequestOptions {
  auditReason?: string;
}

function auditConfig(options?: AuditRequestOptions) {
  const reason = options?.auditReason?.trim();
  return reason
    ? { headers: { 'X-Audit-Reason': reason } }
    : undefined;
}

export const getReferralQueue = () =>
  client.get<ReferralDto[]>('/referrals/queue').then((response) => response.data);

export const getMyReferrals = () =>
  client.get<ReferralDto[]>('/referrals/my').then((response) => response.data);

export const getReferralActions = (referralId: number | string) =>
  client.get<ReferralActionDto[]>(`/referrals/${referralId}/actions`).then((response) => response.data);

export const getReferralTimeline = (referralId: number | string) =>
  client.get<ReferralTimelineEventDto[]>(`/referrals/${referralId}/timeline`).then((response) => response.data);

export const requestReferralCompletion = (referralId: number | string, comment: string, options?: AuditRequestOptions) =>
  client.post<ReferralActionDto>(`/referrals/${referralId}/actions/completion-request`, {
    actionType: 'CompletionRequested',
    comment,
  } satisfies CreateReferralActionDto, auditConfig(options)).then((response) => response.data);

export const submitReferralCompletion = (referralId: number | string, comment: string, options?: AuditRequestOptions) =>
  client.post<ReferralActionDto>(`/referrals/${referralId}/actions/completion-response`, {
    actionType: 'CompletionSubmitted',
    comment,
  } satisfies CreateReferralActionDto, auditConfig(options)).then((response) => response.data);

export const prioritizeReferral = (referralId: number | string, dto: CreateReferralActionDto, options?: AuditRequestOptions) =>
  client.post<ReferralActionDto>(`/referrals/${referralId}/actions/prioritize`, {
    ...dto,
    actionType: 'Prioritized',
  }, auditConfig(options)).then((response) => response.data);

export const confirmReferralTime = (referralId: number | string, dto: CreateReferralActionDto, options?: AuditRequestOptions) =>
  client.post<ReferralActionDto>(`/referrals/${referralId}/actions/confirm-time`, {
    ...dto,
    actionType: 'TimeConfirmed',
  }, auditConfig(options)).then((response) => response.data);
