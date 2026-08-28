import React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { RealtimeProvider } from "../realtime/react-context";
import { useSession, signOut, signIn } from "../lib/auth-client";

export const Route = createRootRoute({
  component: RootLayout,
});

export function RootLayout() {
  const { data: session, isPending } = useSession();

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80 shadow-lg px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold text-white text-xl">
                T
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
                  Project Trackers
                </h1>
                <p className="text-xs text-slate-400">TanStack Start + Better Auth + Prisma + Realtime DO</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isPending ? (
                <div className="h-8 w-24 bg-slate-800 animate-pulse rounded-lg"></div>
              ) : session?.user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-300">
                    {session.user?.name || session.user?.email || "User"}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition shadow-sm"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn.social({ provider: "github" })}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-500/25 active:scale-95"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </main>
      </div>
    </RealtimeProvider>
  );
}
