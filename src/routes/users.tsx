import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "../lib/auth-client";
import { AuthModal } from "../components/Auth/AuthModal";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute("/users")({
  component: UsersPage,
});

export function UsersPage() {
  const { data: session, isPending } = useSession();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data: UserRecord[] = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchUsers();
    }
  }, [session]);

  if (isPending) {
    return (
      <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ height: "30px", width: "200px", background: "var(--panel-2)", margin: "0 auto 16px", borderRadius: "8px" }} />
        <div style={{ height: "200px", background: "var(--panel)", borderRadius: "12px", border: "1px solid var(--border-soft)" }} />
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
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>👥</div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px", color: "var(--text)" }}>
          Sign In Required
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 24px" }}>
          User management is available for authenticated team members only.
        </p>
        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="btn primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Sign In to View Users
        </button>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1400px", margin: "24px auto", padding: "0 20px" }}>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
          borderBottom: "1px solid var(--border-soft)",
          paddingBottom: "16px",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            Team Directory
          </span>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "2px 0 0", color: "var(--text)" }}>
            User Management
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "4px 0 0" }}>
            Registered team members and board collaborators
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "var(--panel-2)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "7px 12px",
              color: "var(--text)",
              fontSize: "13px",
              width: "220px",
            }}
          />
          <button type="button" onClick={fetchUsers} className="btn small">
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table matching Dominus 4D table-wrap */}
      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-faint)" }}>
          Loading team members...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            color: "var(--text-faint)",
            background: "var(--panel)",
            borderRadius: "12px",
            border: "1px solid var(--border-soft)",
          }}
        >
          No registered users found matching "{search}".
        </div>
      ) : (
        <div className="table-wrap">
          <table className="roadmap-table">
            <thead>
              <tr>
                <th style={{ padding: "12px 16px" }}>User</th>
                <th style={{ padding: "12px 16px" }}>Email</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Joined Date</th>
                <th style={{ padding: "12px 16px" }}>ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: "var(--accent-planned)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "12px",
                          flexShrink: 0,
                        }}
                      >
                        {u.image ? (
                          <img
                            src={u.image}
                            alt={u.name}
                            style={{ width: "100%", height: "100%", borderRadius: "6px", objectFit: "cover" }}
                          />
                        ) : (
                          (u.name || u.email || "U")[0].toUpperCase()
                        )}
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{u.name || "User"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-dim)", fontFamily: "monospace" }}>
                    {u.email}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
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
                      Verified Member
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-faint)", fontSize: "12px" }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Seed Date"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-faint)", fontSize: "11px", fontFamily: "monospace" }}>
                    {u.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
