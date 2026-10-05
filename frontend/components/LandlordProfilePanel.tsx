'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  is_verified: number;
  created_at: string;
};

export default function LandlordProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await api<{ profile: Profile }>('/profile', { token });
      setProfile(data.profile);
      setName(data.profile.name || '');
      setPhone(data.profile.phone || '');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load profile');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const data = await api<{ profile: Profile }>('/profile', {
        method: 'PUT', body: { name, phone }, token,
      });
      setProfile(data.profile);
      setMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally { setSaving(false); }
  }

  async function verify() {
    const token = getToken();
    if (!token) return;
    setVerifying(true); setError(''); setMessage('');
    try {
      await api('/profile/verify/request', { method: 'POST', token });
      await load();
      setMessage('Phone verified. Your listings now show a verified badge.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify phone');
    } finally { setVerifying(false); }
  }

  const verified = !!profile?.is_verified;
  const whatsappNumber = phone.replace(/[^0-9]/g, '').replace(/^0/, '234');

  return (
    <div style={S.card}>
      <div style={S.head}>
        <div>
          <h3 style={S.title}>Public profile</h3>
          <p style={S.lead}>Tenants see this when they view one of your listings.</p>
        </div>
        <span style={{ ...S.badge, background: verified ? '#e6f4ea' : '#fff8e1', color: verified ? '#1b5540' : '#9a7514' }}>
          {verified ? '✓ Verified' : 'Not verified'}
        </span>
      </div>

      <form onSubmit={save} style={S.form}>
        <div>
          <label style={S.label}>Full name</label>
          <input style={S.input} value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label style={S.label}>Phone number</label>
          <input style={S.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="0803 000 0000" inputMode="tel" />
          <p style={S.hint}>Renters in Nigeria expect to reach an owner by phone. WhatsApp is enabled automatically.</p>
        </div>

        {error && <p style={S.error}>{error}</p>}
        {message && <p style={S.ok}>{message}</p>}

        <div style={S.actions}>
          <button type="submit" disabled={saving} style={S.secondary}>{saving ? 'Saving…' : 'Save profile'}</button>
          {!verified && (
            <button type="button" onClick={verify} disabled={verifying || !phone} style={S.primary}>
              {verifying ? 'Verifying…' : 'Verify phone'}
            </button>
          )}
        </div>
        {!verified && phone && (
          <p style={S.hint}>
            Demo mode: verification is recorded instantly. Production must confirm this number by SMS OTP.
          </p>
        )}
      </form>

      {phone && (
        <div style={S.contactRow}>
          <span style={S.contactLabel}>Direct contact</span>
          <a href={`tel:${phone.replace(/\s/g, '')}`} style={S.contactLink}>Call {phone}</a>
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              style={S.contactLink}
            >
              WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: { background: '#fffefa', borderRadius: 14, boxShadow: '0 1px 2px rgba(15,38,28,.05)', padding: 20, marginBottom: 16 },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  title: { fontSize: 14, fontWeight: 700, color: '#0f261c', margin: 0 },
  lead: { fontSize: 12, color: '#5c6f63', margin: '4px 0 0' },
  badge: { fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, whiteSpace: 'nowrap' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#0f261c', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e9dd', fontSize: 13, color: '#0f261c', background: '#fffefa', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  hint: { fontSize: 11, color: '#8a9a8d', margin: '6px 0 0', lineHeight: 1.5 },
  error: { fontSize: 12, color: '#c62828', background: '#fce4ec', borderRadius: 10, padding: '9px 12px', margin: 0 },
  ok: { fontSize: 12, color: '#1b5540', background: '#e6f4ea', borderRadius: 10, padding: '9px 12px', margin: 0 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  primary: { fontSize: 12, fontWeight: 700, padding: '10px 18px', borderRadius: 999, border: 'none', background: '#17634a', color: '#fff', cursor: 'pointer' },
  secondary: { fontSize: 12, fontWeight: 600, padding: '10px 18px', borderRadius: 999, border: '1px solid #e5e9dd', background: '#fff', color: '#33503f', cursor: 'pointer' },
  contactRow: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0ea', flexWrap: 'wrap' },
  contactLabel: { fontSize: 11, fontWeight: 600, color: '#5c6f63', textTransform: 'uppercase', letterSpacing: '.05em' },
  contactLink: { fontSize: 12, fontWeight: 700, color: '#17634a', textDecoration: 'none', border: '1px solid #e5e9dd', borderRadius: 999, padding: '6px 14px' },
};
