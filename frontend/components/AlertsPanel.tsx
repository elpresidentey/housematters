'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, getToken, type AppNotification, type SavedSearch } from '@/lib/api';

export default function AlertsPanel() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [s, n] = await Promise.all([
        api<{ savedSearches: SavedSearch[] }>('/saved-searches', { token }),
        api<{ notifications: AppNotification[]; unreadCount: number }>('/notifications', { token }),
      ]);
      setSearches(s.savedSearches || []);
      setNotifications(n.notifications || []);
      setUnread(n.unreadCount || 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load alerts');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createSearch(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setPending(true); setError(''); setMessage('');
    const filters: Record<string, string | number> = {};
    if (city.trim()) filters.city = city.trim();
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (bedrooms) filters.bedrooms = Number(bedrooms);
    try {
      await api('/saved-searches', {
        method: 'POST',
        body: { name: name.trim() || `Search ${searches.length + 1}`, filters, alertsEnabled: true },
        token,
      });
      setName(''); setCity(''); setMinPrice(''); setMaxPrice(''); setBedrooms('');
      setMessage('Search saved. We will alert you when a matching home is listed.');
      await api('/saved-searches/check-alerts', { method: 'POST', token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save search');
    } finally { setPending(false); }
  }

  async function removeSearch(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      await api(`/saved-searches/${id}`, { method: 'DELETE', token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete search');
    }
  }

  async function readAll() {
    const token = getToken();
    if (!token) return;
    try {
      await api('/notifications/read-all', { method: 'PUT', token });
      await load();
    } catch { /* non-blocking */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={S.card}>
        <h3 style={S.title}>Saved searches</h3>
        <p style={S.lead}>Get alerted when a matching home is listed. This is how you stop missing new properties.</p>

        <form onSubmit={createSearch} style={S.form}>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>Name</label>
              <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lekki 2-bed under 4m" />
            </div>
            <div>
              <label style={S.label}>City</label>
              <input style={S.input} value={city} onChange={e => setCity(e.target.value)} placeholder="Lagos" />
            </div>
          </div>
          <div style={S.grid3}>
            <div>
              <label style={S.label}>Min rent (₦)</label>
              <input style={S.input} type="number" min={0} value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Max rent (₦)</label>
              <input style={S.input} type="number" min={0} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Bedrooms+</label>
              <input style={S.input} type="number" min={0} value={bedrooms} onChange={e => setBedrooms(e.target.value)} />
            </div>
          </div>
          {error && <p style={S.error}>{error}</p>}
          {message && <p style={S.ok}>{message}</p>}
          <div>
            <button type="submit" disabled={pending} style={S.primary}>
              {pending ? 'Saving…' : 'Save search & alert me'}
            </button>
          </div>
        </form>

        {searches.length > 0 && (
          <div style={{ marginTop: 18, borderTop: '1px solid #f0f0ea', paddingTop: 14 }}>
            {searches.map(s => (
              <div key={s.id} style={S.rowBetween}>
                <div>
                  <p style={S.rowTitle}>{s.name}</p>
                  <p style={S.rowMeta}>
                    {[s.filters.city, s.filters.bedrooms ? `${s.filters.bedrooms}+ bed` : null,
                      s.filters.minPrice ? `from ₦${Number(s.filters.minPrice).toLocaleString('en-NG')}` : null,
                      s.filters.maxPrice ? `to ₦${Number(s.filters.maxPrice).toLocaleString('en-NG')}` : null]
                      .filter(Boolean).join(' · ') || 'Any property'}
                  </p>
                </div>
                <button onClick={() => removeSearch(s.id)} style={S.danger}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.rowBetween}>
          <h3 style={{ ...S.title, margin: 0 }}>Notifications {unread > 0 && <span style={S.unreadBadge}>{unread}</span>}</h3>
          {unread > 0 && <button onClick={readAll} style={S.secondary}>Mark all read</button>}
        </div>
        {notifications.length === 0 ? (
          <p style={{ ...S.lead, marginTop: 12 }}>Nothing yet. Alerts on new listings and booking updates appear here.</p>
        ) : (
          <div style={{ marginTop: 12 }}>
            {notifications.map(n => (
              <div key={n.id} style={{ ...S.rowBetween, borderTop: '1px solid #f0f0ea', paddingTop: 12, marginTop: 12 }}>
                <div>
                  <p style={S.rowTitle}>{n.title}{!n.is_read && <span style={S.dot} />}</p>
                  {n.body && <p style={S.rowMeta}>{n.body}</p>}
                </div>
                <span style={S.rowMeta}>{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: { background: '#fffefa', borderRadius: 14, boxShadow: '0 1px 2px rgba(15,38,28,.05)', padding: 20 },
  title: { fontSize: 14, fontWeight: 700, color: '#0f261c', margin: 0 },
  lead: { fontSize: 12, color: '#5c6f63', margin: '4px 0 14px', lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#0f261c', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e9dd', fontSize: 13, color: '#0f261c', background: '#fffefa', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  error: { fontSize: 12, color: '#c62828', background: '#fce4ec', borderRadius: 10, padding: '9px 12px', margin: 0 },
  ok: { fontSize: 12, color: '#1b5540', background: '#e6f4ea', borderRadius: 10, padding: '9px 12px', margin: 0 },
  primary: { fontSize: 12, fontWeight: 700, padding: '10px 18px', borderRadius: 999, border: 'none', background: '#17634a', color: '#fff', cursor: 'pointer' },
  secondary: { fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 999, border: '1px solid #e5e9dd', background: '#fff', color: '#33503f', cursor: 'pointer' },
  rowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 13, fontWeight: 600, color: '#0f261c', margin: 0, display: 'flex', alignItems: 'center', gap: 6 },
  rowMeta: { fontSize: 11, color: '#5c6f63', margin: '2px 0 0' },
  danger: { fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 999, border: '1px solid #e5e9dd', background: '#fff', color: '#c62828', cursor: 'pointer' },
  unreadBadge: { fontSize: 10, fontWeight: 700, background: '#17634a', color: '#fff', borderRadius: 999, padding: '1px 7px' },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#17634a', display: 'inline-block' },
};
