import { useState } from 'react';
import type { FormEvent } from 'react';
import { Activity, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { demoAllowed, isConfigured, supabase } from '../supabase';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD;

export default function Login({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  
const signIn = async (e: string, p: string) => {
  if (!supabase) {
    setError("Supabase is not configured.");
    return;
  }

  setBusy(true);
  setError("");
  setNotice("");

  try {
    const { error: err } = await supabase.auth.signInWithPassword({
      email: e.trim().toLowerCase(),
      password: p,
    });

    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Invalid email or password. Check your credentials or create an account."
          : err.message
      );
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to sign in. Please try again."
    );
  } finally {
    setBusy(false);
  }
};


  
const submit = async (ev: FormEvent) => {
  ev.preventDefault();

  setError("");
  setNotice("");

  if (!supabase) {
    setError("Supabase is not configured.");
    return;
  }

  if (!email.trim()) {
    setError("Enter your email address.");
    return;
  }

  if (password.length < 6) {
    setError("Password must contain at least 6 characters.");
    return;
  }

  if (mode === "signin") {
    await signIn(email, password);
    return;
  }

  if (password !== confirm) {
    setError("Passwords do not match.");
    return;
  }

  setBusy(true);

  try {
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (err) {
      setError(err.message);
    } else if (!data.session) {
      setNotice(
        "Account created. Check your email to confirm it, then sign in."
      );

      setMode("signin");
      setPassword("");
      setConfirm("");
    } else {
      setNotice("Account created successfully.");
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to create account. Please try again."
    );
  } finally {
    setBusy(false);
  }
};


  const flip = () => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice(''); };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand"><div className="brand-mark"><Activity size={22} /></div><span>bytebeam<span className="brand-muted"> / fleet</span></span></div>
        <div className="login-copy">
          <div className="eyebrow">OPERATIONS CONSOLE</div>
          <h1>Fleet visibility.<br /><span>At a glance.</span></h1>
          <p>Sign in to monitor vehicles, review trips and spot problems before they cost you time.</p>
        </div>

        {isConfigured ? (
          <form onSubmit={submit}>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required minLength={6} />
            {mode === 'signup' && (
              <>
                <label htmlFor="confirm">Confirm password</label>
                <input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" required minLength={6} />
              </>
            )}
            {error && <div className="error" role="alert">{error}</div>}
            {notice && <div className="success" role="status">{notice}</div>}
            <button className="primary full" disabled={busy}>
              {busy ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowUpRight size={16} />
            </button>
            {DEMO_EMAIL && DEMO_PASSWORD && mode === 'signin' && (
              <button type="button" className="secondary full reviewer" disabled={busy} onClick={() => void signIn(DEMO_EMAIL, DEMO_PASSWORD)}>
                Use the reviewer account
              </button>
            )}
            <button type="button" className="demo-link" onClick={flip}>{mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}</button>
          </form>
        ) : (
          demoAllowed ? (
            <div>
              <div className="notice">Supabase isn't configured, so the app runs on built-in sample data. Add your keys to <code>.env</code> to enable sign-in.</div>
              <button className="primary full" onClick={onDemo}>Explore demo dashboard <ArrowUpRight size={16} /></button>
            </div>
          ) : (
            <div className="error" role="alert">Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and rebuild.</div>
          )
        )}

        <div className="login-foot"><ShieldCheck size={14} /> {isConfigured ? 'Secure access powered by Supabase Auth' : demoAllowed ? 'Offline demo mode' : 'Not configured'}</div>
      </div>
    </div>
  );
}