import React, { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useRealtimeChannel } from "../realtime/react-context";
import { RealtimeMessage } from "../realtime/types";
import { useSession } from "../lib/auth-client";
import { ProjectBoard } from "../components/ProjectBoard/ProjectBoard";
import { AuthModal } from "../components/Auth/AuthModal";

export const Route = createFileRoute("/")({
  component: DashboardComponent,
});

export function DashboardComponent() {
  const { data: session, isPending } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [logs, setLogs] = useState<Array<{ id: string; text: string; time: string }>>([]);

  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    setLogs((prev) => [
      {
        id: Math.random().toString(),
        text: `[${message.event}] ${JSON.stringify(message.payload)}`,
        time: timestamp,
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  useRealtimeChannel("project:trackers", handleRealtimeMessage);

  if (isPending) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-6 text-center space-y-4">
        <div className="h-8 bg-slate-800 animate-pulse rounded w-1/3 mx-auto"></div>
        <div className="h-64 bg-slate-900 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  // Auth Guard: Require Login to view & edit project board
  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-6 shadow-2xl">
        <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-extrabold shadow-lg shadow-indigo-500/25">
          🔒
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Authentication Required</h2>
          <p className="text-xs text-slate-400 mt-1">
            Please sign in to view and collaborate on the Dominus 4D Project Board.
          </p>
        </div>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95 w-full"
        >
          Sign In / Sign Up to Continue
        </button>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Dominus 4D Project Board Component */}
      <ProjectBoard />
    </div>
  );
}
