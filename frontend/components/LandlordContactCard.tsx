'use client';

import { useEffect, useState } from 'react';
import { api, getToken, type PublicProfile } from '@/lib/api';

type Review = {
  id: string;
  rating: number;
  comment?: string;
  reviewer_name?: string;
  created_at: string;
};

export default function LandlordContactCard({ landlordId }: { landlordId: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [p, r] = await Promise.all([
          api<{ user: PublicProfile }>(`/profile/user/${landlordId}`, { token: getToken() || undefined }),
          api<{ reviews: Review[]; rating: number | null }>(`/reviews/user/${landlordId}`, { token: getToken() || undefined }),
        ]);
        if (cancelled) return;
        setProfile(p.user);
        setReviews(r.reviews || []);
        setRating(r.rating);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load owner details');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [landlordId]);

  if (error) {
    return (
      <div style={S.card}>
        <p style={S.muted}>Sign in to see the owner&rsquo;s contact details and reviews.</p>
      </div>
    );
  }
  if (!profile) return null;

  const whatsapp = profile.phone ? profile.phone.replace(/[^0-9]/g, '').replace(/^0/, '234') : '';

  return (
    <div style={S.card}>
      <div style={S.head}>
        <div style={S.avatar}>{(profile.name || '?').charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <p style={S.name}>
            {profile.name}
            {profile.is_verified && <span style={S.verified} title="Phone verified">&#10003; Verified</span>}
          </p>
          <p style={S.muted}>
            {profile.role === 'landlord' ? 'Property owner' : 'Member'} · {profile.listingCount} active listing{profile.listingCount === 1 ? '' : 's'}
            {rating != null && <> · {rating}&#9733; ({reviews.length})</>}
          </p>
        </div>
      </div>

      {profile.phone && (
        <div style={S.actions}>
          <a href={`tel:${profile.phone.replace(/\s/g, '')}`} style={S.callBtn}>Call {profile.phone}</a>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={S.waBtn}>WhatsApp</a>
          )}
        </div>
      )}
      {!profile.phone && (
        <p style={S.muted}>This owner has not published a phone number yet. Use in-app messaging instead.</p>
      )}

      {reviews.length > 0 && (
        <div style={{ marginTop: 14, borderTop: `1px solid var(--line)`, paddingTop: 12 }}>
          <p style={S.sectionTitle}>Tenant reviews</p>
          {reviews.slice(0, 3).map(r => (
            <div key={r.id} style={S.review}>
              <p style={S.reviewHead}>
                <strong>{r.reviewer_name || 'Tenant'}</strong> · {'&#9733;'.repeat(r.rating)}
              </p>
              {r.comment && <p style={S.muted}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: { border: '1px solid var(--line)', borderRadius: 12, padding: 16, background: '#fff' },
  head: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 },
  name: { margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  verified: { fontSize: 10, fontWeight: 700, color: 'var(--brand)', background: '#e6f4ea', borderRadius: 999, padding: '2px 8px' },
  muted: { margin: '2px 0 0', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  callBtn: { fontSize: 12, fontWeight: 700, padding: '9px 16px', borderRadius: 999, background: 'var(--brand)', color: '#fff', textDecoration: 'none' },
  waBtn: { fontSize: 12, fontWeight: 700, padding: '9px 16px', borderRadius: 999, border: '1px solid var(--line-strong)', color: 'var(--brand)', textDecoration: 'none' },
  sectionTitle: { margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)' },
  review: { marginTop: 10 },
  reviewHead: { margin: 0, fontSize: 12, color: 'var(--ink)' },
};
