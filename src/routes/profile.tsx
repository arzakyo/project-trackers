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
      <div className="max-w-3xl mx-auto py-12 px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/3"></div>
          <div className="h-40 bg-slate-900 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="h-16 w-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-indigo-500/20">
          👤
        </div>
        <h2 className="text-xl font-bold text-slate-100">Sign In Required</h2>
        <p className="text-sm text-slate-400">
          Please sign in to view your profile details and active sessions.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          Return to Board
        </button>
      </div>
    );
  }

  const { user } = session;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Profile Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-indigo-500/25">
            {user.image ? (
              <img src={user.image} alt={user.name || "User"} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              (user.name || user.email || "U")[0].toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{user.name || "User"}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Active Member
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: {user.id}</span>
            </div>
          </div>
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
          className="px-4 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/30 font-semibold text-xs rounded-xl transition shadow-sm"
        >
          Sign Out
        </button>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <span>⚙️</span> Account Details
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-400">Full Name</span>
              <span className="font-semibold text-slate-200">{user.name || "Not set"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-400">Email Address</span>
              <span className="font-semibold text-slate-200">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-400">Email Verified</span>
              <span className="font-semibold text-emerald-400">
                {user.emailVerified ? "Yes ✓" : "Yes (Pre-verified)"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Account Created</span>
              <span className="font-semibold text-slate-200">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Active Session */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <span>🔒</span> Security & Session
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-400">Session Status</span>
              <span className="font-semibold text-emerald-400">Active</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-400">Auth Method</span>
              <span className="font-semibold text-indigo-400">Better Auth Credentials / OAuth</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-400">Target Gmail Account</span>
              <span className="font-semibold text-amber-400">arzakyo20@gmail.com</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Realtime Permissions</span>
              <span className="font-semibold text-purple-400">Full Realtime Collaborator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
