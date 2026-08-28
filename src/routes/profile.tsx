import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession, signOut } from "../lib/auth-client";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

export function ProfilePage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px" }}>
        <div style={{ height: "140px", background: "var(--panel)", borderRadius: "12px", border: "1px solid var(--border-soft)" }} />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div
        style={{
          maxWidth: "420px",
          margin: "80px auto",
          padding: "32px 24px",
          background: "var(--panel)",
          border: "1px solid var(--border-soft)",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>👤</div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px", color: "var(--text)" }}>
          Sign In Required
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 24px" }}>
          Please sign in to view your profile details and session settings.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="btn primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Return to Board
        </button>
      </div>
    );
  }

  const { user } = session;

  return (
    <div style={{ maxWidth: "1100px", margin: "24px auto", padding: "0 20px" }}>
      {/* Profile Header */}
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border-soft)",
          borderRadius: "12px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "12px",
              background: "var(--accent-planned)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                style={{ width: "100%", height: "100%", borderRadius: "12px", objectFit: "cover" }}
              />
            ) : (
              (user.name || user.email || "U")[0].toUpperCase()
            )}
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--text)" }}>
              {user.name || "User"}
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "3px 0 8px" }}>{user.email}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  background: "rgba(52, 211, 153, 0.12)",
                  color: "var(--feature)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Active Collaborator
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "monospace" }}>
                ID: {user.id}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
          className="btn danger"
          style={{ fontSize: "13px", padding: "7px 16px" }}
        >
          Sign Out
        </button>
      </div>

      {/* Profile Details Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Account Info */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border-soft)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-faint)",
              margin: "0 0 16px",
              borderBottom: "1px solid var(--border-soft)",
              paddingBottom: "10px",
            }}
          >
            ⚙️ Account Details
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-dim)" }}>Full Name</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{user.name || "Not set"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-dim)" }}>Email Address</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{user.email}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-dim)" }}>Email Verified</span>
              <span style={{ fontWeight: 600, color: "var(--feature)" }}>
                {user.emailVerified ? "Yes ✓" : "Yes (Pre-verified)"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-dim)" }}>Account Created</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Active Session */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border-soft)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-faint)",
              margin: "0 0 16px",
              borderBottom: "1px solid var(--border-soft)",
              paddingBottom: "10px",
            }}
          >
            🔒 Security & Session
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-dim)" }}>Session Status</span>
              <span style={{ fontWeight: 600, color: "var(--feature)" }}>Active</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-dim)" }}>Auth Provider</span>
              <span style={{ fontWeight: 600, color: "var(--accent-planned)" }}>Better Auth Credentials / OAuth</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-dim)" }}>Account Target</span>
              <span style={{ fontWeight: 600, color: "var(--accent-blocked)" }}>arzakyo20@gmail.com</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-dim)" }}>Realtime Sync</span>
              <span style={{ fontWeight: 600, color: "var(--accent-staging)" }}>Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
