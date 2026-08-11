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
      const newSlotUtc = toUtcIso(localDate);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Request Reschedule</h2>
        <p className="mt-1 text-sm text-slate-500">
          {session.subject} with {session.teacherName}
          <br />
          Currently {formatLocal(session.datetime)}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="new-slot" className="block text-sm font-medium text-slate-700">
              New date &amp; time (your local time)
            </label>
            <input
              id="new-slot"
              type="datetime-local"
              value={value}
              min={minSelectable}
              onChange={(e) => setValue(e.target.value)}
              disabled={status === "submitting"}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
            {/* The `min` attribute is the UI half of the lead-time policy —
                it stops slots inside the 2-hour window from being selected
                at all. It is not a security boundary: a request built by
                hand could still send an earlier slot, which is why
                requestReschedule() re-checks the same window server-side. */}
            <p className="mt-1 text-xs text-slate-400">
              Sessions can only be rescheduled at least 2 hours from now.
            </p>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
              Reason
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as RescheduleReason)}
              disabled={status === "submitting"}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {status === "error" && error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={status === "submitting"}
              className="rounded-md px-3 py-2 text-sm text-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {status === "submitting" ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
