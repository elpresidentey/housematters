'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, getToken, clearToken, type AuthUser, type ApiProperty, type AppNotification } from '@/lib/api';
import ListPropertyForm from '@/components/ListPropertyForm';
import LandlordProfilePanel from '@/components/LandlordProfilePanel';
import AlertsPanel from '@/components/AlertsPanel';
import TenancyPanel from '@/components/TenancyPanel';
import { formatNaira } from '@/lib/properties';

type Booking = {
  id: string;
  property_id: string;
  property_title?: string;
  property_images?: string;
  property_address?: string;
  property_city?: string;
  tenant_id?: string;
  tenant_name?: string;
  tenant_email?: string;
  status: string;
  requested_date: string;
  notes?: string;
  created_at: string;
};

type Conversation = {
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  content: string;
  created_at: string;
  unread_count: number;
};

type SavedHome = ApiProperty & { saved_at: string };

type Tab = 'overview' | 'bookings' | 'properties' | 'saved' | 'alerts' | 'tenancy' | 'messages' | 'admin';

function parseImages(images?: string | string[]): string {
  if (!images) return '/images/living-room.jpg';
  if (Array.isArray(images)) return images[0] || '/images/living-room.jpg';
  try { const a = JSON.parse(images); return a[0] || '/images/living-room.jpg'; } catch { return images || '/images/living-room.jpg'; }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedHomes, setSavedHomes] = useState<SavedHome[]>([]);
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [propertyBookings, setPropertyBookings] = useState<Record<string, Booking[]>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [bookingModal, setBookingModal] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState<Record<string, number> | null>(null);

  const isLandlord = user?.userType === 'landlord';

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.userId || payload.sub || payload.id, email: payload.email, name: payload.name || '', userType: payload.userType || 'tenant' });
    } catch {}
    setLoading(false);
  }, []);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token || !user) return;
    try {
      if (isLandlord) {
        const data = await api<{ properties: ApiProperty[] }>(`/properties?landlord_id=${user.id}`, { token });
        setProperties(data.properties || []);
        const allBookings: Record<string, Booking[]> = {};
        for (const prop of data.properties || []) {
          try {
            const bData = await api<{ bookings: Booking[] }>(`/bookings/property/${prop.id}`, { token });
            allBookings[prop.id] = bData.bookings || [];
          } catch { allBookings[prop.id] = []; }
        }
        setPropertyBookings(allBookings);
      } else {
        const bData = await api<{ bookings: Booking[] }>('/bookings/my-bookings', { token });
        setBookings(bData.bookings || []);
        try {
          const sData = await api<{ savedHomes: SavedHome[] }>('/saved-homes', { token });
          setSavedHomes(sData.savedHomes || []);
        } catch { setSavedHomes([]); }
      }
      try {
        const cData = await api<{ conversations: Conversation[] }>('/messages/conversations', { token });
        setConversations(cData.conversations || []);
      } catch { setConversations([]); }
      try {
        const uData = await api<{ unreadCount: number }>('/messages/unread-count', { token });
        setUnreadCount(uData.unreadCount || 0);
      } catch {}
      try {
        const nData = await api<{ notifications: AppNotification[]; unreadCount: number }>('/notifications', { token });
        setNotifications(nData.notifications || []);
      } catch {}
      try {
        const s = await api<Record<string, number>>('/admin/stats', { token });
        setAdminStats(s);
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
        setAdminStats(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    }
  }, [user, isLandlord]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const token = getToken();
    if (!token) return;
    setActionPending(bookingId);
    try {
      await api(`/bookings/${bookingId}/status`, { method: 'PUT', body: { status }, token });
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally { setActionPending(null); }
  };

  const submitBooking = async (propertyId: string) => {
    const token = getToken();
    if (!token || !bookingDate) return;
    setBookingSubmitting(true);
    try {
      await api('/bookings', { method: 'POST', body: { propertyId, startDate: bookingDate, notes: bookingNotes }, token });
      setBookingModal(null);
      setBookingDate('');
      setBookingNotes('');
      setTab('bookings');
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Booking failed');
    } finally { setBookingSubmitting(false); }
  };

  const removeSaved = async (propertyId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await api(`/saved-homes/${propertyId}`, { method: 'DELETE', token });
      await loadData();
    } catch {}
  };

  const logout = () => { clearToken(); window.location.href = '/'; };

  const [showListingForm, setShowListingForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<ApiProperty | null>(null);

  const deleteProperty = async (propertyId: string) => {
    const token = getToken();
    if (!token) return;
    if (!window.confirm('Remove this listing? Tenants will no longer see it.')) return;
    try {
      await api(`/properties/${propertyId}`, { method: 'DELETE', token });
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not remove the listing.');
    }
  };

  const allBookings = isLandlord ? Object.values(propertyBookings).flat() : bookings;
  const pendingBookings = allBookings.filter(b => b.status === 'pending');
  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');

  if (loading) return <div style={S.page}><div style={S.center}><div style={S.spinner} /><p style={{ marginTop: 16, color: '#5c6f63', fontSize: 14 }}>Loading your dashboard...</p></div></div>;

  if (!user) return (
    <div style={S.page}>
      <div style={S.center}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#8962;</div>
        <h2 style={S.title}>Welcome to House Matters</h2>
        <p style={S.sub}>Sign in to manage your properties, bookings, and messages.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/" style={S.btnPrimary}>Go to Home</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link href="/" style={S.logo}>House Matters<span style={{ color: '#9a7514' }}>.</span></Link>
          <div style={S.navRight}>
            <Link href="/" style={S.navLink}>&larr; Browse Properties</Link>
            <div style={S.navDivider} />
            <div style={S.avatar}>{user.name?.charAt(0) || user.email.charAt(0)}</div>
            <div style={{ lineHeight: 1.3 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0f261c', margin: 0 }}>{user.name || user.email}</p>
              <p style={{ fontSize: 11, color: '#5c6f63', margin: 0, textTransform: 'capitalize' }}>{isLandlord ? 'Landlord' : 'Tenant'}</p>
            </div>
            <button onClick={logout} style={S.logoutBtn}>Sign out</button>
          </div>
        </div>
      </nav>

      <div style={S.wrap}>
        {/* Greeting */}
        <div style={S.greeting}>
          <h1 style={S.greetText}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name?.split(' ')[0] || 'there'}</h1>
          <p style={S.greetSub}>{isLandlord ? 'Manage your properties and respond to booking requests.' : 'Find your next home and track your bookings.'}</p>
        </div>

        {error && <div style={S.error}>{error}<button onClick={() => setError('')} style={S.errorClose}>&times;</button></div>}

        {/* Stats */}
        <div style={S.stats}>
          {isLandlord ? (
            <>
              <StatCard label="Properties" value={properties.length} icon="&#127968;" />
              <StatCard label="Pending" value={pendingBookings.length} icon="&#9200;" accent={pendingBookings.length > 0} />
              <StatCard label="Confirmed" value={confirmedBookings.length} icon="&#10003;" />
              <StatCard label="Messages" value={unreadCount} icon="&#9993;" accent={unreadCount > 0} />
            </>
          ) : (
            <>
              <StatCard label="Saved Homes" value={savedHomes.length} icon="&#9829;" />
              <StatCard label="My Bookings" value={bookings.length} icon="&#128197;" />
              <StatCard label="Confirmed" value={confirmedBookings.length} icon="&#10003;" />
              <StatCard label="Messages" value={unreadCount} icon="&#9993;" accent={unreadCount > 0} />
            </>
          )}
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {([
            'overview', 'bookings',
            ...(isLandlord ? ['properties', 'tenancy'] : ['saved', 'tenancy']),
            'alerts', 'messages',
            ...(isAdmin ? ['admin'] : []),
          ] as Tab[]).map(t => {
            const unreadNotifs = notifications.filter(n => !n.is_read).length;
            const labels: Record<Tab, string> = {
              overview: 'Overview',
              bookings: `Bookings (${allBookings.length})`,
              properties: `My Properties (${properties.length})`,
              saved: `Saved Homes (${savedHomes.length})`,
              alerts: `Alerts${unreadNotifs > 0 ? ` (${unreadNotifs})` : ''}`,
              tenancy: 'Tenancy',
              messages: `Messages${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
              admin: 'Admin',
            };
            return <button key={t} style={tab === t ? S.tabOn : S.tabOff} onClick={() => setTab(t)}>{labels[t]}</button>;
          })}
        </div>

        {/* ========== OVERVIEW TAB ========== */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pending actions */}
            {pendingBookings.length > 0 && (
              <div style={S.card}>
                <div style={S.cardHead}>
                  <h3 style={S.cardTitle}>{isLandlord ? 'Booking Requests' : 'Pending Bookings'}</h3>
                  <button style={S.seeAll} onClick={() => setTab('bookings')}>View all &rarr;</button>
                </div>
                <div style={S.list}>
                  {pendingBookings.slice(0, 3).map(b => (
                    <div key={b.id} style={S.row}>
                      <div style={S.rowImgWrap}><img src={parseImages(b.property_images)} alt="" style={S.rowImg} /></div>
                      <div style={S.rowBody}>
                        <p style={S.rowTitle}>{b.property_title || 'Property'}</p>
                        {b.tenant_name && <p style={S.rowMeta}>From: {b.tenant_name}</p>}
                        {b.property_address && <p style={S.rowMeta}>{b.property_address}, {b.property_city}</p>}
                        <p style={S.rowMeta}>{timeAgo(b.created_at)}</p>
                      </div>
                      <div style={S.rowActions}>
                        <span style={{ ...S.badge, background: '#fff8e1', color: '#9a7514' }}>Pending</span>
                        {isLandlord && (
                          <div style={S.actionBtns}>
                            <button disabled={actionPending === b.id} onClick={() => updateBookingStatus(b.id, 'confirmed')} style={S.confirmBtn}>Confirm</button>
                            <button disabled={actionPending === b.id} onClick={() => updateBookingStatus(b.id, 'cancelled')} style={S.rejectBtn}>Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent bookings */}
            {allBookings.length > 0 && (
              <div style={S.card}>
                <div style={S.cardHead}>
                  <h3 style={S.cardTitle}>Recent Bookings</h3>
                  <button style={S.seeAll} onClick={() => setTab('bookings')}>View all &rarr;</button>
                </div>
                <div style={S.list}>
                  {allBookings.slice(0, 4).map(b => (
                    <div key={b.id} style={S.row}>
                      <div style={S.rowImgWrap}><img src={parseImages(b.property_images)} alt="" style={S.rowImg} /></div>
                      <div style={S.rowBody}>
                        <p style={S.rowTitle}>{b.property_title || 'Property'}</p>
                        <p style={S.rowMeta}>{timeAgo(b.created_at)}</p>
                      </div>
                      <span style={{
                        ...S.badge,
                        background: b.status === 'confirmed' ? '#e6f4ea' : b.status === 'pending' ? '#fff8e1' : '#fce4ec',
                        color: b.status === 'confirmed' ? '#1b5540' : b.status === 'pending' ? '#9a7514' : '#c62828',
                      }}>{b.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div style={S.card}>
              <h3 style={{ ...S.cardTitle, padding: '18px 20px 0' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: 10, padding: '14px 20px 18px', flexWrap: 'wrap' }}>
                <Link href="/#search" style={S.actionChip}>&#128269; Search Properties</Link>
                {!isLandlord && savedHomes.length > 0 && <button style={S.actionChip} onClick={() => setTab('saved')}>&#9829; View Saved ({savedHomes.length})</button>}
                {isLandlord && <button style={S.actionChip} onClick={() => setTab('properties')}>&#127968; {properties.length > 0 ? 'Manage Properties' : 'List a Property'}</button>}
                <button style={S.actionChip} onClick={() => setTab('messages')}>&#9993; Messages{unreadCount > 0 ? ` (${unreadCount})` : ''}</button>
              </div>
            </div>

            {allBookings.length === 0 && savedHomes.length === 0 && conversations.length === 0 && (
              <div style={S.card}>
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>&#127968;</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f261c', margin: '0 0 8px' }}>Welcome aboard!</h3>
                  <p style={{ fontSize: 14, color: '#5c6f63', marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
                    {isLandlord
                      ? 'Your properties will appear here once they are listed. Start by browsing the platform.'
                      : 'Start by exploring available properties. Save homes you like and send booking requests.'}
                  </p>
                  <Link href="/" style={S.btnPrimary}>Browse Properties &rarr;</Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== BOOKINGS TAB ========== */}
        {tab === 'bookings' && (
          <div style={S.card}>
            {allBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>&#128197;</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f261c', margin: '0 0 6px' }}>No bookings yet</h3>
                <p style={{ fontSize: 13, color: '#5c6f63', marginBottom: 16 }}>
                  {isLandlord ? 'Booking requests from tenants will show up here.' : 'Find a property you like and send a booking request.'}
                </p>
                {!isLandlord && <Link href="/#search" style={S.btnPrimary}>Browse Properties &rarr;</Link>}
              </div>
            ) : (
              <div style={S.list}>
                {allBookings.map(b => (
                  <div key={b.id} style={S.row}>
                    <div style={S.rowImgWrap}><img src={parseImages(b.property_images)} alt="" style={S.rowImg} /></div>
                    <div style={S.rowBody}>
                      <p style={S.rowTitle}>{b.property_title || 'Property'}</p>
                      {b.tenant_name && <p style={S.rowMeta}>Tenant: {b.tenant_name}</p>}
                      {b.property_address && <p style={S.rowMeta}>{b.property_address}, {b.property_city}</p>}
                      <p style={S.rowMeta}>Requested: {new Date(b.requested_date).toLocaleDateString()}</p>
                      {b.notes && <p style={S.rowMeta}>&ldquo;{b.notes}&rdquo;</p>}
                    </div>
                    <div style={S.rowActions}>
                      <span style={{
                        ...S.badge,
                        background: b.status === 'confirmed' ? '#e6f4ea' : b.status === 'pending' ? '#fff8e1' : '#fce4ec',
                        color: b.status === 'confirmed' ? '#1b5540' : b.status === 'pending' ? '#9a7514' : '#c62828',
                      }}>{b.status}</span>
                      {isLandlord && b.status === 'pending' && (
                        <div style={S.actionBtns}>
                          <button disabled={actionPending === b.id} onClick={() => updateBookingStatus(b.id, 'confirmed')} style={S.confirmBtn}>Confirm</button>
                          <button disabled={actionPending === b.id} onClick={() => updateBookingStatus(b.id, 'cancelled')} style={S.rejectBtn}>Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== PROPERTIES TAB (Landlord) ========== */}
        {tab === 'properties' && isLandlord && (
          <div>
            <LandlordProfilePanel />
            <div style={S.card}>
            <div style={S.cardHead}>
              <h3 style={S.cardTitle}>My Properties ({properties.length})</h3>
              <button style={S.addBtn} onClick={() => { setEditingProperty(null); setShowListingForm(true); }}>+ List a property</button>
            </div>
            {properties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>&#127968;</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f261c', margin: '0 0 6px' }}>No properties yet</h3>
                <p style={{ fontSize: 13, color: '#5c6f63', marginBottom: 16 }}>List your first property to start receiving booking requests.</p>
                <button style={S.btnPrimary} onClick={() => { setEditingProperty(null); setShowListingForm(true); }}>List a property</button>
              </div>
            ) : (
              <div style={S.list}>
                {properties.map(p => (
                  <div key={p.id} style={S.row}>
                    <div style={S.rowImgWrap}><img src={parseImages(p.images)} alt="" style={S.rowImg} /></div>
                    <div style={S.rowBody}>
                      <p style={S.rowTitle}>{p.title}</p>
                      <p style={S.rowMeta}>{formatNaira(p.rent || p.price || 0)}/yr &middot; {p.bedrooms} bed &middot; {p.bathrooms} bath</p>
                      <p style={S.rowMeta}>{p.address}, {p.city}</p>
                    </div>
                    <div style={S.rowActions}>
                      <span style={{ ...S.badge, background: p.active ? '#e6f4ea' : '#f5f5f5', color: p.active ? '#1b5540' : '#888' }}>{p.active ? 'Active' : 'Inactive'}</span>
                      {p.moderation_status && p.moderation_status !== 'approved' && (
                        <span style={{ ...S.badge, background: '#fff8e1', color: '#9a7514' }}>{p.moderation_status}</span>
                      )}
                      <p style={{ fontSize: 11, color: '#5c6f63', margin: 0 }}>{(propertyBookings[p.id] || []).length} booking(s)</p>
                      <div style={S.actionBtns}>
                        <button onClick={() => { setEditingProperty(p); setShowListingForm(true); }} style={S.editBtn}>Edit</button>
                        <button onClick={() => deleteProperty(p.id)} style={S.rejectBtn}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        )}

        {/* ========== SAVED HOMES TAB (Tenant) ========== */}
        {tab === 'saved' && !isLandlord && (
          <div style={S.card}>
            {savedHomes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>&#9829;</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f261c', margin: '0 0 6px' }}>No saved homes</h3>
                <p style={{ fontSize: 13, color: '#5c6f63', marginBottom: 16 }}>Tap the heart on any property to save it here.</p>
                <Link href="/#search" style={S.btnPrimary}>Browse Properties &rarr;</Link>
              </div>
            ) : (
              <div style={S.list}>
                {savedHomes.map(p => (
                  <div key={p.id} style={S.row}>
                    <div style={S.rowImgWrap}><img src={parseImages(p.images)} alt="" style={S.rowImg} /></div>
                    <div style={S.rowBody}>
                      <p style={S.rowTitle}>{p.title}</p>
                      <p style={S.rowMeta}>{formatNaira(p.rent || p.price || 0)}/yr &middot; {p.bedrooms} bed &middot; {p.bathrooms} bath</p>
                      <p style={S.rowMeta}>{p.address}, {p.city}</p>
                    </div>
                    <div style={S.rowActions}>
                      <button onClick={() => setBookingModal(p.id)} style={S.confirmBtn}>Book</button>
                      <button onClick={() => removeSaved(p.id)} style={S.rejectBtn}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== MESSAGES TAB ========== */}
        {tab === 'messages' && (
          <div style={S.card}>
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>&#9993;</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f261c', margin: '0 0 6px' }}>No messages yet</h3>
                <p style={{ fontSize: 13, color: '#5c6f63', marginBottom: 16 }}>Start a conversation by contacting a landlord from a property listing.</p>
                <Link href="/#search" style={S.btnPrimary}>Browse Properties &rarr;</Link>
              </div>
            ) : (
              <div style={S.list}>
                {conversations.map(c => (
                  <div key={c.other_user_id} style={{ ...S.row, cursor: 'pointer' }} onClick={() => window.location.href = `/#messages`}>
                    <div style={S.convAvatar}>{(c.other_user_name || c.other_user_email || '?').charAt(0).toUpperCase()}</div>
                    <div style={S.rowBody}>
                      <p style={S.rowTitle}>{c.other_user_name || c.other_user_email}</p>
                      <p style={{ ...S.rowMeta, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 }}>{c.content}</p>
                    </div>
                    <div style={S.rowActions}>
                      <span style={{ fontSize: 11, color: '#8a9a8d' }}>{timeAgo(c.created_at)}</span>
                      {c.unread_count > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#17634a', color: '#fff', borderRadius: 999, padding: '2px 7px', textAlign: 'center' }}>{c.unread_count}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== ALERTS TAB ========== */}
        {tab === 'alerts' && <AlertsPanel />}

        {/* ========== TENANCY TAB ========== */}
        {tab === 'tenancy' && <TenancyPanel role={isLandlord ? 'landlord' : 'tenant'} />}

        {/* ========== ADMIN TAB ========== */}
        {tab === 'admin' && isAdmin && (
          <div style={S.card}>
            <h3 style={S.cardTitle}>Platform moderation</h3>
            <p style={{ ...S.rowMeta, margin: '4px 0 16px' }}>
              Screen listings before they go live. This is the trust layer that keeps fake properties off the platform.
            </p>
            <div style={S.adminGrid}>
              <StatCard label="Users" value={adminStats?.users ?? 0} icon="&#128101;" />
              <StatCard label="Landlords" value={adminStats?.landlords ?? 0} icon="&#127968;" />
              <StatCard label="Listings" value={adminStats?.properties ?? 0} icon="&#127959;" />
              <StatCard label="Live" value={adminStats?.active ?? 0} icon="&#10003;" />
              <StatCard label="Awaiting review" value={adminStats?.pending ?? 0} icon="&#9200;" accent={(adminStats?.pending ?? 0) > 0} />
              <StatCard label="Flagged" value={adminStats?.flagged ?? 0} icon="&#9888;" accent={(adminStats?.flagged ?? 0) > 0} />
              <StatCard label="Expired" value={adminStats?.expired ?? 0} icon="&#128337;" />
              <StatCard label="Open bookings" value={adminStats?.openBookings ?? 0} icon="&#128197;" />
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModal && (
        <div style={S.modalOverlay} onClick={() => setBookingModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <button style={S.modalClose} onClick={() => setBookingModal(null)}>&times;</button>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f261c', margin: '0 0 4px' }}>Request a Booking</h3>
            <p style={{ fontSize: 13, color: '#5c6f63', margin: '0 0 20px' }}>Select your preferred move-in date and add any notes for the landlord.</p>
            <label style={S.label}>Move-in Date</label>
            <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} style={S.input} min={new Date().toISOString().split('T')[0]} />
            <label style={S.label}>Notes (optional)</label>
            <textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} style={{ ...S.input, minHeight: 72, resize: 'vertical' }} placeholder="Any questions or special requests..." />
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setBookingModal(null)} style={S.rejectBtn}>Cancel</button>
              <button disabled={!bookingDate || bookingSubmitting} onClick={() => bookingModal && submitBooking(bookingModal)} style={{ ...S.confirmBtn, padding: '8px 20px', fontSize: 13 }}>
                {bookingSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listing Form Modal (Landlord) */}
      {showListingForm && (
        <ListPropertyForm
          initial={editingProperty}
          onClose={() => { setShowListingForm(false); setEditingProperty(null); }}
          onSaved={() => { setShowListingForm(false); setEditingProperty(null); loadData(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: string; accent?: boolean }) {
  return (
    <div style={{
      background: '#fffefa', borderRadius: 14, padding: '16px 18px', flex: '1 1 0', minWidth: 140,
      border: accent ? '1.5px solid #e9c767' : '1px solid #f0f0ea',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#5c6f63', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: '#0f261c', margin: '6px 0 0', lineHeight: 1 }}>{value}</p>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f7f6ef', fontFamily: 'Cabin, -apple-system, BlinkMacSystemFont, sans-serif' },
  wrap: { maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px, 4vw, 36px) 60px' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: 24 },

  nav: { background: '#fffefa', borderBottom: '1px solid #e5e9dd', position: 'sticky', top: 0, zIndex: 100 },
  navInner: { maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px, 4vw, 36px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 54 },
  logo: { fontSize: 18, fontWeight: 700, color: '#0f261c', textDecoration: 'none', letterSpacing: -0.5 },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  navLink: { fontSize: 13, color: '#5c6f63', textDecoration: 'none', fontWeight: 600 },
  navDivider: { width: 1, height: 20, background: '#e5e9dd' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#17634a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 },
  logoutBtn: { fontSize: 12, color: '#5c6f63', background: 'none', border: '1px solid #e5e9dd', borderRadius: 999, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 },

  greeting: { padding: '28px 0 4px' },
  greetText: { fontSize: 24, fontWeight: 700, color: '#0f261c', margin: 0, fontFamily: 'Cabin, sans-serif' },
  greetSub: { fontSize: 14, color: '#5c6f63', margin: '4px 0 0' },

  title: { fontSize: 24, fontWeight: 700, color: '#0f261c', margin: 0 },
  sub: { fontSize: 14, color: '#5c6f63', marginBottom: 24 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', height: 42, padding: '0 22px', borderRadius: 999, background: '#17634a', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', border: 'none', cursor: 'pointer' },

  stats: { display: 'flex', gap: 10, marginTop: 20, marginBottom: 20, flexWrap: 'wrap' },

  tabs: { display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  tabOff: { padding: '7px 14px', borderRadius: 999, border: '1px solid #e5e9dd', background: '#fffefa', color: '#5c6f63', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  tabOn: { padding: '7px 14px', borderRadius: 999, border: '1px solid #17634a', background: '#17634a', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' },

  error: { padding: '10px 14px', borderRadius: 10, background: '#fce4ec', color: '#c62828', fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  errorClose: { background: 'none', border: 'none', color: '#c62828', fontSize: 18, cursor: 'pointer', padding: '0 4px' },

  card: { background: '#fffefa', borderRadius: 14, boxShadow: '0 1px 2px rgba(15,38,28,.05)', overflow: 'hidden' },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#0f261c', margin: 0 },
  seeAll: { fontSize: 12, color: '#17634a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' },

  list: { display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f0f0ea' },
  rowImgWrap: { width: 50, height: 50, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f0f0ea' },
  rowImg: { width: '100%', height: '100%', objectFit: 'cover' },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 13, fontWeight: 600, color: '#0f261c', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowMeta: { fontSize: 11, color: '#5c6f63', margin: '1px 0 0' },
  rowActions: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  badge: { padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' },
  actionBtns: { display: 'flex', gap: 4 },
  confirmBtn: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, border: 'none', background: '#17634a', color: '#fff', cursor: 'pointer' },
  rejectBtn: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, border: '1px solid #e5e9dd', background: '#fff', color: '#888', cursor: 'pointer' },
  editBtn: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, border: '1px solid #e5e9dd', background: '#fffefa', color: '#17634a', cursor: 'pointer' },
  addBtn: { fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 999, border: 'none', background: '#17634a', color: '#fff', cursor: 'pointer' },

  actionChip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, border: '1px solid #e5e9dd', background: '#fffefa', color: '#33503f', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' },
  adminGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 },

  convAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#e6efe9', color: '#17634a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 },

  spinner: { width: 28, height: 28, border: '3px solid #e5e9dd', borderTopColor: '#17634a', borderRadius: '50%', animation: 'spin .7s linear infinite' },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,38,28,.45)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,.2)' },
  modalClose: { position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#0f261c', marginBottom: 6, marginTop: 14 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e9dd', fontSize: 13, color: '#0f261c', background: '#fffefa', outline: 'none', boxSizing: 'border-box' as const },
};
