"use client";

import { useState } from "react";
import type { TutoringSession } from "@/types/reschedule";
import { formatLocal } from "@/lib/datetime";

interface SessionListProps {
  initialSessions: TutoringSession[];
}

export default function SessionList({ initialSessions }: SessionListProps) {
  const [sessions] = useState(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold text-slate-900">Upcoming Sessions</h1>

      <ul className="space-y-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="font-medium text-slate-900">{session.subject}</p>
              <p className="text-sm text-slate-500">with {session.teacherName}</p>
              {/* Every displayed time is the viewer's local time — the value
                  stored on the session itself is always UTC. */}
              <p className="text-sm text-slate-500">{formatLocal(session.datetime)}</p>
              <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
                {session.status.replace("_", " ")}
              </span>
            </div>

            <button
              onClick={() => setActiveSessionId(session.id)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              Request Reschedule
            </button>
          </li>
        ))}
      </ul>

      {/* RescheduleForm wiring (mock Cloud Function call, validation,
          loading/error states) lands in the next commit. */}
      {activeSessionId && (
        <p className="text-sm text-slate-400">Reschedule form coming next — closing for now.</p>
      )}
    </div>
  );
}
