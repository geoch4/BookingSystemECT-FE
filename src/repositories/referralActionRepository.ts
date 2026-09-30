import {
  confirmReferralTime,
  getReferralActions,
  prioritizeReferral,
  requestReferralCompletion,
  submitReferralCompletion,
} from '../api/referrals';
import type { ReferralActionDto } from '../types';
import {
  getAllReferralActionNotes,
  getAllReferralActionEvents,
  referralIdForBooking,
  saveReferralActionNote,
  saveReferralCompletionResponse,
  type ReferralActionEvent,
  type ReferralActionEventMap,
  type ReferralActionMap,
  type ReferralActionNote,
  type ReferralActionType,
} from '../utils/referralActions';

// Temporary repository for referral actions while the backend endpoints are not
// available in this workspace. The pages should use this file instead of
// touching localStorage utilities directly, so the implementation can later be
// swapped to src/api/referrals.ts without changing the UI flow.

export function getReferralActionSnapshot(): ReferralActionMap {
  return getAllReferralActionNotes();
}

export function getReferralActionEventSnapshot(): ReferralActionEventMap {
  return getAllReferralActionEvents();
}

export function createReferralIdFromBooking(bookingId: number) {
  return referralIdForBooking(bookingId);
}

export function recordReferralAction(referralId: string, note: ReferralActionNote): ReferralActionMap {
  return saveReferralActionNote(referralId, note);
}

export function recordReferralCompletionResponse(referralId: string, responseComment: string): ReferralActionMap {
  return saveReferralCompletionResponse(referralId, responseComment);
}

function localTypeForApiAction(actionType: ReferralActionDto['actionType'] | number): ReferralActionType {
  if (actionType === 'CompletionRequested' || actionType === 0) return 'completion';
  if (actionType === 'CompletionSubmitted' || actionType === 1) return 'completion';
  if (actionType === 'Prioritized' || actionType === 2) return 'prioritize';
  if (actionType === 'TimeConfirmed' || actionType === 3) return 'prioritize';
  return 'completion';
}

function noteFromApiAction(action: ReferralActionDto): ReferralActionEvent {
  return {
    id: String(action.referralActionId),
    type: localTypeForApiAction(action.actionType),
    title: action.title,
    comment: action.comment,
    priority: action.priority,
    confirmedDateTime: action.confirmedDateTime,
    createdAt: action.createdAt,
  };
}

export async function getReferralActionSnapshotsFromApi(referralIds: string[]) {
  const entries = await Promise.all(
    referralIds.map(async (referralId) => {
      const actions = await getReferralActions(referralId);
      const events = actions.map(noteFromApiAction)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return [referralId, events] as const;
    }),
  );

  const eventMap: ReferralActionEventMap = {};
  const noteMap: ReferralActionMap = {};

  entries.forEach(([referralId, events]) => {
    eventMap[referralId] = events;
    const latest = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (latest) noteMap[referralId] = latest;
  });

  return { noteMap, eventMap };
}

export async function persistReferralAction(referralId: string, note: ReferralActionNote) {
  if (note.type === 'completion') {
    await requestReferralCompletion(referralId, note.comment, { auditReason: note.comment });
    return;
  }

  if (note.type === 'prioritize') {
    if (note.confirmedDateTime) {
      await confirmReferralTime(referralId, {
        actionType: 'TimeConfirmed',
        comment: note.comment,
        priority: note.priority,
        confirmedDateTime: note.confirmedDateTime,
      }, { auditReason: note.comment });
      return;
    }

    await prioritizeReferral(referralId, {
      actionType: 'Prioritized',
      comment: note.comment,
      priority: note.priority,
    }, { auditReason: note.comment });
  }
}

export async function persistReferralCompletionResponse(referralId: string, responseComment: string) {
  await submitReferralCompletion(referralId, responseComment, { auditReason: responseComment });
}
