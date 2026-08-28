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
      <div style={{ maxWidth: "1200px", margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ height: "32px", width: "220px", background: "var(--panel-2)", margin: "0 auto 16px", borderRadius: "8px" }} />
        <div style={{ height: "260px", background: "var(--panel)", borderRadius: "12px", border: "1px solid var(--border-soft)" }} />
      </div>
    );
  }

  // Auth Guard: Require Login to view & edit project board
  if (!session?.user) {
    return (
      <div className="auth-required-card">
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "rgba(94, 234, 212, 0.12)",
            border: "1px solid rgba(94, 234, 212, 0.25)",
            color: "var(--accent-progress)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "24px",
          }}
        >
          🔒
        </div>
        <span className="brand-eyebrow" style={{ display: "block", marginBottom: "4px" }}>
          Dominus 4D Board
        </span>
        <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px", color: "var(--text)" }}>
          Sign In to Access Board
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 16px", lineHeight: "1.5" }}>
          Collaborate in real-time, organize features and bugs, and track releases with live sync.
        </p>

        {/* Feature preview bullets */}
        <div className="auth-features-list">
          <div className="auth-feature-item">
            <span style={{ color: "var(--accent-progress)" }}>✓</span>
            <span>Real-time collaborative Kanban card & table views</span>
          </div>
          <div className="auth-feature-item">
            <span style={{ color: "var(--accent-progress)" }}>✓</span>
            <span>Optimistic Concurrency Control (OCC) conflict protection</span>
          </div>
          <div className="auth-feature-item">
            <span style={{ color: "var(--accent-progress)" }}>✓</span>
            <span>Instant cross-tab live synchronization & CSV/JSON import</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="btn primary"
          style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: "14px" }}
        >
          Sign In / Sign Up to Continue
        </button>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      {/* Main Dominus 4D Project Board Component */}
      <ProjectBoard />
    </div>
  );
}
