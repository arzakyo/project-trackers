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
      <div className="max-w-3xl mx-auto py-16 px-6 text-center space-y-4">
        <div className="h-8 bg-slate-800 animate-pulse rounded w-1/3 mx-auto"></div>
        <div className="h-48 bg-slate-900 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-6 shadow-2xl">
        <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl font-extrabold shadow-lg shadow-indigo-500/25">
          👥
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-sans">Sign In Required</h2>
          <p className="text-xs text-slate-400 mt-1">
            User management is available for authenticated team members only.
          </p>
        </div>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95 w-full"
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
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Registered team members & board collaborators
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64 transition"
          />
          <button
            onClick={fetchUsers}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 animate-pulse text-sm">
          Loading team members...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-sm">
          No registered users found matching "{search}".
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/60 shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {u.image ? (
                          <img src={u.image} alt={u.name} className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          (u.name || u.email || "U")[0].toUpperCase()
                        )}
                      </div>
                      <span className="font-semibold text-slate-100">{u.name || "User"}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                      Verified Member
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Seed Date"}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[10px]">{u.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
