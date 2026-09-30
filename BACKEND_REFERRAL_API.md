# Backend contract: Referral workflow

This file describes the backend structure needed to replace the current frontend prototype/localStorage referral workflow.

## Core entities

### Referral

Represents the clinical request from a department to the ECT/rTMS treatment unit.

Suggested fields:

- `referralId`
- `bookingId` nullable, when a confirmed booking exists
- `patientId`
- `treatmentTypeId`
- `department`
- `contactName`
- `contactPhone`
- `priority`: `Green | Yellow | Red`
- `status`: `Draft | Submitted | NeedsCompletion | UnderReview | Approved | Scheduled | Paused | Cancelled | Completed | Rejected | NoShow`
- `requestedStartDate`
- `clinicalIndication`
- `createdById`
- `createdAt`
- `updatedAt`

### ReferralAction

Represents a message or decision in the workflow.

Suggested fields:

- `referralActionId`
- `referralId`
- `actionType`: `CompletionRequested | CompletionSubmitted | Prioritized | TimeConfirmed`
- `title`
- `comment`
- `priority` nullable
- `confirmedDateTime` nullable
- `createdById`
- `createdAt`

### ReferralDocument

Represents required documents/checklist items.

Suggested fields:

- `referralDocumentId`
- `referralId`
- `label`
- `required`
- `complete`
- `completedAt`
- `completedById`

### ReferralRiskFlag

Represents clinical/admin warnings, including anesthesia attention.

Suggested fields:

- `referralRiskFlagId`
- `referralId`
- `label`
- `severity`: `Info | Warning | Critical`
- `target`: `TreatmentUnit | Anesthesia`
- `resolved`
- `resolvedAt`
- `resolvedById`
- `resolutionComment`

## API endpoints

### Read

- `GET /api/referrals/queue`
  - Admin/treatment unit queue.
  - Returns referrals visible to the treatment unit.

- `GET /api/referrals/my`
  - Department view.
  - Returns referrals for the logged-in department/user scope.

- `GET /api/referrals/{referralId}/actions`
  - Returns action notes/messages for one referral.

- `GET /api/referrals/{referralId}/timeline`
  - Returns normalized timeline events for UI display.

### Write

- `POST /api/referrals`
  - Creates/submits a referral from the department portal.

- `POST /api/referrals/{referralId}/actions/completion-request`
  - Admin asks the department to complete missing information.
  - Should set referral status to `NeedsCompletion`.

- `POST /api/referrals/{referralId}/actions/completion-response`
  - Department replies after completing missing information.
  - Should set referral status back to `Submitted` or `UnderReview`.

- `POST /api/referrals/{referralId}/actions/prioritize`
  - Treatment unit records priority decision.
  - May set status to `UnderReview` or `Approved`.

- `POST /api/referrals/{referralId}/actions/confirm-time`
  - Treatment unit confirms date/time.
  - Should create or update linked booking and set referral status to `Scheduled`.

## Frontend files prepared for this contract

- `src/types/index.ts`
  - Shared DTO types for referral/action/timeline.

- `src/api/referrals.ts`
  - API functions for the endpoints above.

- `src/utils/referralActions.ts`
  - Current localStorage prototype that should later be replaced by `src/api/referrals.ts`.

## Important access rules

- Department users should only see referrals belonging to their department/scope.
- Admin/treatment unit users can see the full referral queue.
- Patient identifiers and clinical comments must be protected by authentication and authorization.
- Timeline/action entries should be append-only in production; do not silently overwrite clinical history.
