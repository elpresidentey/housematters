'use client';

import { useState, type FormEvent } from 'react';
import Modal from './Modal';
import { api, setToken, type AuthResponse } from '../lib/api';

type Mode = 'login' | 'register';

export default function AuthModal({ mode, onSwitch, onClose }: { mode: Mode; onSwitch: (mode: Mode) => void; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') || '');
    if (mode === 'register') {
      if (password !== data.get('confirmPassword')) { setError('Passwords do not match'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters long'); return; }
    }
    setPending(true);
    try {
      const result = await api<AuthResponse>(mode === 'login' ? '/auth/login' : '/auth/register', {
        method: 'POST',
        body: mode === 'login'
          ? { email: data.get('email'), password }
          : {
              name: `${String(data.get('firstName') || '')} ${String(data.get('lastName') || '')}`.trim(),
              email: data.get('email'),
              password,
              userType: data.get('role'),
            },
      });
      setToken(result.token);
      window.location.href = '/dashboard';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setError(
        message.includes('fetch') || message.includes('Failed')
          ? 'Could not reach the server. Check your connection and try again.'
          : message,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title={mode === 'login' ? 'Welcome Back' : 'Join House Matters'} onClose={onClose}>
      <form className="auth-form" onSubmit={submit}>
        <p className="auth-lead">
          {mode === 'login'
            ? 'Sign in to save homes and pick up your shortlist.'
            : 'Create an account to save homes and list as a landlord.'}
        </p>
        {mode === 'register' && (
          <>
            <div className="form-group">
              <label htmlFor="user-type">I am a:</label>
              <select id="user-type" name="role" required defaultValue="">
                <option value="" disabled>Select your role</option>
                <option value="tenant">Tenant (Looking for property)</option>
                <option value="landlord">Landlord (Have property to rent)</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first-name">First Name</label>
                <input type="text" id="first-name" name="firstName" required minLength={2} />
              </div>
              <div className="form-group">
                <label htmlFor="last-name">Last Name</label>
                <input type="text" id="last-name" name="lastName" required minLength={2} />
              </div>
            </div>
          </>
        )}
        <div className="form-group">
          <label htmlFor={`${mode}-email`}>Email Address</label>
          <input type="email" id={`${mode}-email`} name="email" required autoFocus autoComplete="email" />
        </div>
        <div className="form-group">
          <label htmlFor={`${mode}-password`}>Password</label>
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              id={`${mode}-password`}
              name="password"
              required
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {mode === 'register' && <small>Must be at least 8 characters long</small>}
        </div>
        {mode === 'register' && (
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" name="confirmPassword" required />
          </div>
        )}
        {error && <p role="alert" className="auth-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-large" disabled={pending}>
          {pending ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
        <p className="auth-switch">
          {mode === 'login' ? (
            <>Don&apos;t have an account? <a href="#register" onClick={(e) => { e.preventDefault(); onSwitch('register'); }}>Sign up here</a></>
          ) : (
            <>Already have an account? <a href="#login" onClick={(e) => { e.preventDefault(); onSwitch('login'); }}>Sign in here</a></>
          )}
        </p>
      </form>
    </Modal>
  );
}
