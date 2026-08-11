import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";

admin.initializeApp();
const db = admin.firestore();

interface BookingRequest {
  studentId: string;
  teacherId: string;
  slot: string; // ISO datetime string
  subject: string;
}

// Bug 3 (typing): `data: BookingRequest` on a callable function is a compile-time-only
// annotation. At runtime `data` is whatever JSON the client sent — Firebase never
// validates it against the interface. The original code trusted the shape blindly, so
// a malformed or malicious payload (missing fields, wrong types, extra fields) would
// flow straight into a Firestore write. Validate at the boundary instead of trusting TS.
const bookingRequestSchema = z.object({
  studentId: z.string().min(1),
  teacherId: z.string().min(1),
  slot: z.string().datetime(),
  subject: z.string().min(1),
});

export const bookSession = functions.https.onCall(
  // Bug 2 (async/await): the original handler wasn't `async`, so `teacherRef
  // .collection("bookings")...get()` — which returns a Promise<QuerySnapshot> — was
  // never awaited. `existing` was a pending Promise, not a snapshot, so
  // `existing.docs` was `undefined` and `.length` would throw a runtime TypeError on
  // every single call. This would fail 100% of requests in production, not just edge cases.
  async (data: unknown, context) => {
    // Bug 4 (security): the original function never checked `context.auth`. Firebase
    // callable functions are reachable by anyone who can hit the HTTPS endpoint —
    // authenticated or not — unless you check this yourself. Without it, any
    // anonymous caller could create bookings for arbitrary students/teachers.
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to book a session."
      );
    }

    const parsed = bookingRequestSchema.safeParse(data);
    if (!parsed.success) {
      throw new functions.https.HttpsError("invalid-argument", "Malformed booking request.");
    }
    const bookingData = parsed.data;

    // Also part of bug 4: even an authenticated caller could pass someone else's
    // studentId and book on their behalf. Pin the booking to the caller's own uid.
    if (context.auth.uid !== bookingData.studentId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You can only book sessions for yourself."
      );
    }

    const booking = {
      studentId: bookingData.studentId,
      teacherId: bookingData.teacherId,
      slot: bookingData.slot,
      subject: bookingData.subject,
      status: "confirmed",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const teacherRef = db.collection("teachers").doc(bookingData.teacherId);
    const teacherBookings = teacherRef.collection("bookings");

    // Bug 2 continued: `.get()` must be awaited before its result can be read.
    const existing = await teacherBookings.where("slot", "==", bookingData.slot).get();

    if (!existing.empty) {
      return { success: false, message: "Slot already booked" };
    }

    // Bug 1 (logic): the original code checked for double-bookings by querying
    // `teacherRef.collection("bookings")`, but then wrote the new booking into a
    // completely separate, unrelated top-level `bookings` collection. Every future
    // call would query a subcollection that never received any writes, so the
    // duplicate-slot guard above could never actually catch anything — it always
    // passed, and the same slot could be booked with any number of students. Write
    // to the same location the check reads from.
    await teacherBookings.add(booking);

    return { success: true };
  }
);
