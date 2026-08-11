import type { TutoringSession } from "@/types/reschedule";

// Mock data standing in for a Firestore query of the signed-in parent's next
// 3 sessions. Seeded relative to "now" (rather than hardcoded ISO strings)
// so the widget still demos as genuinely upcoming whenever it's actually run,
// instead of drifting into the past a few days after this was written.
function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export const mockSessions: TutoringSession[] = [
  {
    id: "sess_1",
    subject: "Algebra II",
    teacherName: "Ms. Patel",
    datetime: hoursFromNow(20),
    status: "confirmed",
  },
  {
    id: "sess_2",
    subject: "Spoken English",
    teacherName: "Mr. Okafor",
    datetime: hoursFromNow(48),
    status: "confirmed",
  },
  {
    id: "sess_3",
    subject: "Physics",
    teacherName: "Dr. Singh",
    datetime: hoursFromNow(96),
    status: "confirmed",
  },
];
