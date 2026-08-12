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
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/95 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-200/70 backdrop-blur">
        <div className="border-b border-slate-200 bg-linear-to-r from-indigo-600 via-sky-600 to-cyan-500 px-6 py-8 text-white sm:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/80">Parent Portal</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Upcoming Sessions</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                View your scheduled tutoring sessions, request a new time, and keep every booking aligned across time zones.
              </p>
            </div>
            <div className="rounded-2xl bg-white/14 px-4 py-3 text-sm text-white/90 ring-1 ring-white/20 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Scheduled</p>
              <p className="mt-1 text-2xl font-semibold">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 bg-slate-50/80 px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Times are shown in your local timezone</p>
              <p className="text-sm text-slate-500">When submitted, the app converts them to UTC so the real appointment time stays consistent for everyone.</p>
            </div>
            <div className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Rescheduling requires 2 hours notice
            </div>
          </div>

          {confirmedId && (
            <p
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm"
            >
              Reschedule request sent — you&apos;ll hear back once the teacher confirms.
            </p>
          )}

          <ul className="space-y-4">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                        {session.subject}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          session.status === "pending_reschedule"
                            ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                            : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                        }`}
                      >
                        {session.status.replace("_", " ")}
                      </span>
                    </div>

                    <div>
                      <p className="text-lg font-semibold text-slate-900">{session.teacherName}</p>
                      <p className="text-sm text-slate-500">Tutor session</p>
                    </div>

                    {/* Every displayed time is the viewer's local time — the value
                        stored on the session itself is always UTC. */}
                    <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                        <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">Teacher</span>
                        {session.teacherName}
                      </p>
                      <p className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                        <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">Scheduled for</span>
                        {formatLocal(session.datetime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end lg:self-stretch">
                    <button
                      onClick={() => setActiveSessionId(session.id)}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 lg:w-auto"
                    >
                      Request Reschedule
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

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
