// Shared between the frontend and the (mocked) requestReschedule Cloud
// Function, the same way a real app would share these via a common package —
// one source of truth for the wire shape instead of two structurally-similar
// but independently-maintained types.

export type RescheduleReason = "Conflict" | "Illness" | "Time zone" | "Other";

export type SessionStatus = "confirmed" | "pending_reschedule";

export interface TutoringSession {
  id: string;
  subject: string;
  teacherName: string;
  /** ISO 8601 UTC datetime string. Always stored/transmitted in UTC — see
   * lib/datetime.ts for where/why the local <-> UTC conversion happens. */
  datetime: string;
  status: SessionStatus;
}

export interface RescheduleRequest {
  sessionId: string;
  /** ISO 8601 UTC datetime string for the requested new slot. */
  newSlot: string;
  reason: RescheduleReason;
}

export interface RescheduleResponse {
  success: boolean;
  error?: string;
}
