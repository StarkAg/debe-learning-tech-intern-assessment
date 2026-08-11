import SessionList from "@/components/SessionList";
import { mockSessions } from "@/lib/mock-sessions";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SessionList initialSessions={mockSessions} />
    </main>
  );
}
