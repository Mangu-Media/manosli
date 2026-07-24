// Sign-in modal for the manosli+ player.
// Email + password with a signup/login toggle, inline validation and error
// states, plus Google/Apple buttons that degrade to a friendly "coming soon"
// message while the providers are not configured server-side.
import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { theme } from './data';
import { Icon } from './icons';
import { login, oauthSignIn, signup, AuthError } from './auth';

interface AuthModalProps {
  onClose: () => void;
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: `1px solid ${theme.border}`,
  background: theme.surfaceHover,
  color: theme.text,
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const validate = (): string | null => {
    if (!isEmail(email.trim())) return 'Enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') await signup(email.trim(), password, name.trim() || undefined);
      else await login(email.trim(), password);
      onClose();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: 'google' | 'apple') => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const result = await oauthSignIn(provider);
      if (result.status === 'ok') onClose();
      else if (result.status === 'coming_soon') setNotice(result.message ?? 'Coming soon.');
      else setError(result.message ?? 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 69, backdropFilter: 'blur(4px)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 70,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: 24,
          width: 'calc(100% - 48px)',
          maxWidth: 360,
          color: theme.text,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {mode === 'login' ? 'Sign in to sync' : 'Create your account'}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: theme.dim, marginBottom: 16 }}>
          Likes, playlists and history follow you across devices.
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'signup' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name (optional)"
              autoComplete="name"
              style={inputStyle}
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
            autoFocus
            style={inputStyle}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ characters)"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            style={inputStyle}
          />

          {error && <div style={{ fontSize: 12, color: theme.pink }}>{error}</div>}
          {notice && <div style={{ fontSize: 12, color: theme.accent }}>{notice}</div>}

          <button
            type="submit"
            disabled={busy}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              background: theme.accent,
              border: 'none',
              color: '#fff',
              cursor: busy ? 'default' : 'pointer',
              fontWeight: 600,
              fontSize: 14,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
          <div style={{ fontSize: 11, color: theme.dim }}>or</div>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => void oauth('google')}
            disabled={busy}
            style={{
              padding: '11px 16px',
              borderRadius: 10,
              background: theme.surfaceHover,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              cursor: busy ? 'default' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Continue with Google
          </button>
          <button
            onClick={() => void oauth('apple')}
            disabled={busy}
            style={{
              padding: '11px 16px',
              borderRadius: 10,
              background: theme.surfaceHover,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              cursor: busy ? 'default' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Continue with Apple
          </button>
        </div>

        <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 16, textAlign: 'center' }}>
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setNotice(null);
                }}
                style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setNotice(null);
                }}
                style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
