import React, { useState, useEffect } from "react";
import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { RealtimeProvider } from "../realtime/react-context";
import { useSession, signOut } from "../lib/auth-client";
import { AuthModal } from "../components/Auth/AuthModal";
import { ThemeMode, getStoredTheme, applyTheme } from "../lib/theme";
import "../components/ProjectBoard/project-board.css";

export const Route = createRootRoute({
  component: RootLayout,
});

export function RootLayout() {
  const { data: session, isPending } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(getStoredTheme());

  useEffect(() => {
    // Initialize theme globally on mount
    applyTheme(currentTheme);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail) {
        setCurrentTheme(customEvent.detail);
      }
    };

    window.addEventListener("dominus4d_theme_change", handleThemeChange);
    return () => window.removeEventListener("dominus4d_theme_change", handleThemeChange);
  }, []);

  const handleSetTheme = (theme: ThemeMode) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  return (
    <RealtimeProvider>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          transition: "background 0.2s ease, color 0.2s ease",
        }}
      >
        {/* Navigation Bar matching original Dominus 4D Theme */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "var(--panel)",
            borderBottom: "1px solid var(--border-soft)",
            padding: "10px 20px",
          }}
        >
          <div
            style={{
              maxWidth: "1600px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {/* Brand Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--text-faint)",
                      fontFamily: "'Source Sans 3', sans-serif",
                    }}
                  >
                    Dominus 4D
                  </span>
                  <h1
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      margin: 0,
                      letterSpacing: "-0.015em",
                      color: "var(--text)",
                    }}
                  >
                    Project Trackers
                  </h1>
                </div>
              </Link>

              {/* Navigation Links using .nav-tab */}
              <nav
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "var(--panel-2)",
                  padding: "3px",
                  borderRadius: "9px",
                  border: "1px solid var(--border-soft)",
                }}
              >
                <Link
                  to="/"
                  activeProps={{ className: "nav-tab active" }}
                  inactiveProps={{ className: "nav-tab" }}
                >
                  📋 Board
                </Link>
                <Link
                  to="/users"
                  activeProps={{ className: "nav-tab active" }}
                  inactiveProps={{ className: "nav-tab" }}
                >
                  👥 Users
                </Link>
                <Link
                  to="/profile"
                  activeProps={{ className: "nav-tab active" }}
                  inactiveProps={{ className: "nav-tab" }}
                >
                  👤 Profile
                </Link>
              </nav>
            </div>

            {/* Right Controls: Global Theme Switcher & Auth */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {/* Global Theme Toggle */}
              <div className="seg" title="Global Theme Selector">
                <button
                  type="button"
                  className={`btn small ${currentTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleSetTheme('dark')}
                  style={{ fontSize: '11.5px', padding: '4px 8px' }}
                >
                  🌙 Dark
                </button>
                <button
                  type="button"
                  className={`btn small ${currentTheme === 'light' ? 'active' : ''}`}
                  onClick={() => handleSetTheme('light')}
                  style={{ fontSize: '11.5px', padding: '4px 8px' }}
                >
                  ☀️ Light
                </button>
                <button
                  type="button"
                  className={`btn small ${currentTheme === 'system' ? 'active' : ''}`}
                  onClick={() => handleSetTheme('system')}
                  style={{ fontSize: '11.5px', padding: '4px 8px' }}
                >
                  💻 System
                </button>
              </div>

              {/* Auth Session Section */}
              {isPending ? (
                <div
                  style={{
                    height: "30px",
                    width: "70px",
                    background: "var(--panel-2)",
                    borderRadius: "8px",
                  }}
                />
              ) : session?.user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Link
                    to="/profile"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      background: "var(--panel-2)",
                      border: "1px solid var(--border)",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      color: "var(--text)",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "var(--accent-planned)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {(session.user?.name || session.user?.email || "U")[0].toUpperCase()}
                    </div>
                    <span>{session.user?.name || session.user?.email}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="btn danger small"
                    style={{ fontSize: "11.5px", padding: "4px 8px" }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="btn primary small"
                  style={{ fontSize: "12px", padding: "5px 12px" }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main style={{ maxWidth: "1600px", margin: "0 auto" }}>
          <Outlet />
        </main>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </RealtimeProvider>
  );
}
