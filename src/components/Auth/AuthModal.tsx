import React, { useState } from 'react';
import { signIn, signUp } from '../../lib/auth-client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signIn.email({ email, password });
        if (res.error) {
          setErrorMsg(res.error.message || 'Invalid email or password. Please check your credentials.');
        } else {
          onClose();
        }
      } else {
        const res = await signUp.email({ email, password, name });
        if (res.error) {
          setErrorMsg(res.error.message || 'Failed to create account.');
        } else {
          onClose();
        }
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn.social({ provider: 'google' });
    } catch (err: unknown) {
      setErrorMsg('Google Sign-In failed or is not configured properly.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '28px 24px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          color: 'var(--text)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
          }}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            Dominus 4D
          </span>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '2px 0 0', color: 'var(--text)' }}>
            {mode === 'signin' ? 'Sign In to Board' : 'Create Account'}
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-dim)', margin: '4px 0 0' }}>
            {mode === 'signin'
              ? 'Access project trackers and collaborative board'
              : 'Join the team to collaborate in real-time'}
          </p>
        </div>

        {/* Mode Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div
            style={{
              fontSize: '12.5px',
              color: 'var(--pri-high)',
              background: 'rgba(251, 113, 133, 0.1)',
              border: '1px solid rgba(251, 113, 133, 0.25)',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '16px',
              lineHeight: '1.4',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 1-Click Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="btn"
          style={{
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            padding: '9px 14px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-soft)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-faint)', letterSpacing: '0.05em' }}>OR EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-soft)' }} />
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'signup' && (
            <div className="field">
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                placeholder="e.g. Arza Kyo"
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--panel-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: 'var(--text)',
                  fontSize: '13px',
                }}
                required
              />
            </div>
          )}

          <div className="field">
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              placeholder="e.g. arzakyo20@gmail.com"
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '9px 12px',
                color: 'var(--text)',
                fontSize: '13px',
              }}
              required
            />
          </div>

          <div className="field">
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="••••••••••••"
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--panel-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '9px 38px 9px 12px',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-faint)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '8px',
              padding: '10px 14px',
              fontSize: '13.5px',
            }}
          >
            {loading ? 'Processing...' : mode === 'signin' ? 'Sign In to Account' : 'Create Account'}
          </button>
        </form>

        {/* Footer Toggle */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12.5px', color: 'var(--text-dim)' }}>
          {mode === 'signin' ? (
            <p style={{ margin: 0 }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-progress)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-progress)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
