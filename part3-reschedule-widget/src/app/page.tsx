import SessionList from "@/components/SessionList";
import { mockSessions } from "@/lib/mock-sessions";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <SessionList initialSessions={mockSessions} />
    </main>
  );
}
