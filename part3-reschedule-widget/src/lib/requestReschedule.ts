import type { RescheduleRequest, RescheduleResponse } from "@/types/reschedule";

// Matches Debe's tutoring lead-time policy: tutors need at least 2 hours'
// notice to rework their schedule around a moved session.
export const MIN_LEAD_TIME_MS = 2 * 60 * 60 * 1000;

/**
 * Stand-in for the `requestReschedule` Firebase Callable Function. Same
 * request/response shape a real `httpsCallable<RescheduleRequest,
 * RescheduleResponse>()` client would get back, so swapping this out for the
 * real call later is a one-line change in RescheduleForm, not a rewrite.
 */
export async function requestReschedule(
  req: RescheduleRequest,
  currentSlotUtc: string
): Promise<RescheduleResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500)); // simulate network latency

  const newSlotMs = new Date(req.newSlot).getTime();
  const now = Date.now();

  if (Number.isNaN(newSlotMs)) {
    return { success: false, error: "Invalid date/time." };
  }

  if (newSlotMs <= now) {
    return { success: false, error: "You can't reschedule to a time in the past." };
  }

  // Defense in depth: the form already disables slots inside the 2-hour
  // window, but a real Cloud Function can never trust that the client
  // actually enforced it — same lesson as the missing-validation bug in
  // Part 2. Re-check the policy here, server-side, regardless of what the
  // UI allowed the parent to submit.
  if (newSlotMs - now < MIN_LEAD_TIME_MS) {
    return {
      success: false,
      error: "Sessions can only be rescheduled at least 2 hours in advance.",
    };
  }

  if (req.newSlot === currentSlotUtc) {
    return { success: false, error: "That's already the current time for this session." };
  }

  return { success: true };
}
