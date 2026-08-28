import React, { useState } from "react";
import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { RealtimeProvider } from "../realtime/react-context";
import { useSession, signOut } from "../lib/auth-client";
import { AuthModal } from "../components/Auth/AuthModal";

export const Route = createRootRoute({
  component: RootLayout,
});

export function RootLayout() {
  const { data: session, isPending } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80 shadow-lg px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold text-white text-lg transition group-hover:scale-105">
                  T
                </div>
                <div>
                  <h1 className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
                    Project Trackers
                  </h1>
                  <p className="text-[10px] text-slate-400">Dominus 4D Realtime Board</p>
                </div>
              </Link>

              {/* Main Nav Links */}
              <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 text-xs">
                <Link
                  to="/"
                  activeProps={{ className: "bg-indigo-600 text-white font-semibold shadow-sm" }}
                  inactiveProps={{ className: "text-slate-400 hover:text-slate-200 hover:bg-slate-900" }}
                  className="px-3.5 py-1.5 rounded-lg transition"
                >
                  📋 Board
                </Link>
                <Link
                  to="/users"
                  activeProps={{ className: "bg-indigo-600 text-white font-semibold shadow-sm" }}
                  inactiveProps={{ className: "text-slate-400 hover:text-slate-200 hover:bg-slate-900" }}
                  className="px-3.5 py-1.5 rounded-lg transition"
                >
                  👥 Users
                </Link>
                <Link
                  to="/profile"
                  activeProps={{ className: "bg-indigo-600 text-white font-semibold shadow-sm" }}
                  inactiveProps={{ className: "text-slate-400 hover:text-slate-200 hover:bg-slate-900" }}
                  className="px-3.5 py-1.5 rounded-lg transition"
                >
                  👤 Profile
                </Link>
              </nav>
            </div>

            {/* Auth Session State */}
            <div className="flex items-center gap-3">
              {isPending ? (
                <div className="h-8 w-24 bg-slate-800 animate-pulse rounded-lg"></div>
              ) : session?.user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl transition text-xs"
                  >
                    <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {(session.user?.name || session.user?.email || "U")[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-200 max-w-[140px] truncate">
                      {session.user?.name || session.user?.email}
                    </span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition shadow-sm"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md shadow-indigo-500/25 active:scale-95 flex items-center gap-2"
                >
                  <span>Sign In / Up</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-6">
          <Outlet />
        </main>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </RealtimeProvider>
  );
}
