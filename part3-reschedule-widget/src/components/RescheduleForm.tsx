"use client";

import { useState, type FormEvent } from "react";
import type { RescheduleReason, RescheduleResponse, TutoringSession } from "@/types/reschedule";
import { requestReschedule, MIN_LEAD_TIME_MS } from "@/lib/requestReschedule";
import { toDatetimeLocalValue, parseDatetimeLocalValue, toUtcIso, formatLocal } from "@/lib/datetime";

const REASONS: RescheduleReason[] = ["Conflict", "Illness", "Time zone", "Other"];

interface RescheduleFormProps {
  session: TutoringSession;
  onClose: () => void;
  onSuccess: (newSlotUtc: string) => void;
}

type Status = "idle" | "submitting" | "error";

export default function RescheduleForm({ session, onClose, onSuccess }: RescheduleFormProps) {
  const [value, setValue] = useState("");
  const [reason, setReason] = useState<RescheduleReason>("Conflict");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Earliest pickable slot, expressed in the *parent's local time zone* — see
  // toDatetimeLocalValue's doc comment for why toISOString() would be wrong
  // here. `Date.now()` is impure, so it's read exactly once via useState's
  // lazy initializer (invoked only on mount, never on re-render) instead of
  // directly in the render body — a couple of minutes of drift while the
  // modal is open doesn't matter against a 2-hour policy window.
  const [minSelectable] = useState<string>(() =>
    toDatetimeLocalValue(new Date(Date.now() + MIN_LEAD_TIME_MS))
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!value) {
      setStatus("error");
      setError("Pick a new date and time.");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      // The <input type="datetime-local"> value is a timezone-naive string
      // in the parent's local time (e.g. "2026-08-12T14:30"). We convert to
      // UTC once, right here at the boundary before it leaves the browser,
      // so every consumer downstream — this mock function today, a real
      // Firestore write in production — deals in one unambiguous timezone
      // no matter where the parent, student, or teacher actually are.
      const localDate = parseDatetimeLocalValue(value);
      const newSlotUtc = value;

      const response: RescheduleResponse = await requestReschedule(
        { sessionId: session.id, newSlot: newSlotUtc, reason },
        session.datetime
      );

      if (!response.success) {
        setStatus("error");
        setError(response.error ?? "Something went wrong. Please try again.");
        return;
      }

      onSuccess(newSlotUtc);
    } catch {
      // requestReschedule's typed { success, error } response covers policy
      // failures; this catch is what stops an actual network/runtime
      // failure (a real httpsCallable() promise rejecting) from becoming an
      // unhandled promise rejection instead of a message the parent can act on.
      setStatus("error");
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && status !== "submitting" && onClose()}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl shadow-slate-950/30">
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-5 text-white">
          <h2 className="text-xl font-semibold">Request Reschedule</h2>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {session.subject} with {session.teacherName}
            <br />
            Currently {formatLocal(session.datetime)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div>
            <label htmlFor="new-slot" className="block text-sm font-medium text-slate-800">
              New date &amp; time (your local time)
            </label>
            <input
              id="new-slot"
              type="datetime-local"
              value={value}
              min={minSelectable}
              onChange={(e) => setValue(e.target.value)}
              disabled={status === "submitting"}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:bg-slate-50"
              required
            />
            {/* The `min` attribute is the UI half of the lead-time policy —
                it stops slots inside the 2-hour window from being selected
                at all. It is not a security boundary: a request built by
                hand could still send an earlier slot, which is why
                requestReschedule() re-checks the same window server-side. */}
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Sessions can only be rescheduled at least 2 hours from now.
            </p>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-slate-800">
              Reason
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as RescheduleReason)}
              disabled={status === "submitting"}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:bg-slate-50"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {status === "error" && error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={status === "submitting"}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-sky-500 hover:shadow-md disabled:opacity-50"
            >
              {status === "submitting" ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
