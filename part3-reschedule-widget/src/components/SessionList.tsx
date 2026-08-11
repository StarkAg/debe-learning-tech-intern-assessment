"use client";

import { useState } from "react";
import type { TutoringSession } from "@/types/reschedule";
import { formatLocal } from "@/lib/datetime";
import RescheduleForm from "./RescheduleForm";

interface SessionListProps {
  initialSessions: TutoringSession[];
}

export default function SessionList({ initialSessions }: SessionListProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  function handleSuccess(sessionId: string, newSlotUtc: string) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, datetime: newSlotUtc, status: "pending_reschedule" } : s
      )
    );
    setActiveSessionId(null);
    setConfirmedId(sessionId);
    // Purely cosmetic auto-dismiss for the confirmation banner — not a data change.
    setTimeout(() => setConfirmedId((id) => (id === sessionId ? null : id)), 4000);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Upcoming Sessions</h1>
        <p className="text-sm text-slate-500">Your next {sessions.length} tutoring sessions</p>
      </div>

      {confirmedId && (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          Reschedule request sent — you&apos;ll hear back once the teacher confirms.
        </p>
      )}

      <ul className="space-y-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{session.subject}</p>
              <p className="text-sm text-slate-500">with {session.teacherName}</p>
              {/* Every displayed time is the viewer's local time — the value
                  stored on the session itself is always UTC. */}
              <p className="text-sm text-slate-500">{formatLocal(session.datetime)}</p>
              <span
                className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  session.status === "pending_reschedule"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {session.status.replace("_", " ")}
              </span>
            </div>

            <button
              onClick={() => setActiveSessionId(session.id)}
              className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Request Reschedule
            </button>
          </li>
        ))}
      </ul>

      {activeSession && (
        <RescheduleForm
          session={activeSession}
          onClose={() => setActiveSessionId(null)}
          onSuccess={(newSlotUtc) => handleSuccess(activeSession.id, newSlotUtc)}
        />
      )}
    </div>
  );
}
