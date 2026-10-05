'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getToken, type Agreement, type Payment } from '@/lib/api';

const Naira = (n: number) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

export default function TenancyPanel({ role }: { role: 'tenant' | 'landlord' }) {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [a, p] = await Promise.all([
        api<{ agreements: Agreement[] }>('/agreements', { token }),
        api<{ payments: Payment[] }>('/payments', { token }),
      ]);
      setAgreements(a.agreements || []);
      setPayments(p.payments || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load tenancy records');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createAgreement(bookingId: string) {
    const token = getToken();
    if (!token) return;
    setError(''); setMessage('');
    try {
      await api('/agreements', {
        method: 'POST',
        body: {
          bookingId,
          serviceCharge: 0,
          cautionDeposit: 0,
          durationMonths: 12,
        },
        token,
      });
      setMessage('Tenancy agreement created and sent to the tenant.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create agreement');
    }
  }

  async function setStatus(id: string, status: string) {
    const token = getToken();
    if (!token) return;
    try {
      await api(`/agreements/${id}/status`, { method: 'PUT', body: { status }, token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update agreement');
    }
  }

  async function recordPayment(agreementId: string, amount: number, paymentType: string) {
    const token = getToken();
    if (!token) return;
    try {
      await api('/payments', {
        method: 'POST',
        body: { agreementId, amount, paymentType, status: 'pending' },
        token,
      });
      setMessage('Payment recorded in the ledger.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record payment');
    }
  }

  async function markPaid(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      await api(`/payments/${id}/status`, { method: 'PUT', body: { status: 'paid' }, token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update payment');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <p style={S.error}>{error}</p>}
      {message && <p style={S.ok}>{message}</p>}

      <div style={S.card}>
        <h3 style={S.title}>Tenancy agreements</h3>
        <p style={S.lead}>
          A written record of rent, service charge, deposit and term. This is the document that prevents the
          most common rental disputes in Nigeria.
        </p>
        {agreements.length === 0 ? (
          <p style={{ ...S.lead, marginTop: 10 }}>
            {role === 'landlord'
              ? 'Confirm a booking, then create the agreement from here.'
              : 'Your landlord sends the agreement once a booking is confirmed.'}
          </p>
        ) : (
          agreements.map(a => (
            <div key={a.id} style={S.block}>
              <div style={S.rowBetween}>
                <div>
                  <p style={S.rowTitle}>{a.property_title || 'Property'}</p>
                  <p style={S.rowMeta}>
                    {role === 'tenant' ? `Landlord: ${a.landlord_name}` : `Tenant: ${a.tenant_name}`} · starts {a.start_date} · {a.duration_months} months
                  </p>
                </div>
                <span style={statusBadge(a.status)}>{a.status}</span>
              </div>
              <div style={S.moneyRow}>
                <span>Annual rent <strong>{Naira(a.annual_rent)}</strong></span>
                <span>Service charge <strong>{Naira(a.service_charge)}</strong></span>
                <span>Caution deposit <strong>{Naira(a.caution_deposit)}</strong></span>
              </div>
              <div style={S.actions}>
                <a
                  href={`/api/agreements/${a.id}/print?token=${encodeURIComponent(getToken() || '')}`}
                  style={S.linkBtn}
                  onClick={async (e) => {
                    e.preventDefault();
                    const token = getToken();
                    if (!token) return;
                    const res = await fetch(`/api/agreements/${a.id}/print`, { headers: { Authorization: `Bearer ${token}` } });
                    const text = await res.text();
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url; link.download = `tenancy-agreement-${a.id.slice(0, 8)}.txt`; link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download agreement
                </a>
                {role === 'tenant' && a.status === 'sent' && (
                  <button onClick={() => setStatus(a.id, 'signed')} style={S.primary}>Sign agreement</button>
                )}
                {role === 'landlord' && a.status !== 'void' && (
                  <button onClick={() => setStatus(a.id, 'void')} style={S.secondary}>Void</button>
                )}
              </div>
            </div>
          ))
        )}
        {role === 'landlord' && <CreateAgreementHint onCreate={createAgreement} />}
      </div>

      <div style={S.card}>
        <h3 style={S.title}>Payment ledger</h3>
        <p style={S.lead}>Every rent and deposit payment recorded against an agreement, with references.</p>
        {payments.length === 0 ? (
          <p style={{ ...S.lead, marginTop: 10 }}>No payments recorded yet.</p>
        ) : (
          payments.map(p => (
            <div key={p.id} style={{ ...S.rowBetween, borderTop: '1px solid #f0f0ea', paddingTop: 12, marginTop: 12 }}>
              <div>
                <p style={S.rowTitle}>{Naira(p.amount)} · {p.payment_type}</p>
                <p style={S.rowMeta}>
                  {p.property_title || 'Property'} · {p.reference || 'no reference'} · {p.created_at.slice(0, 10)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={paymentBadge(p.status)}>{p.status}</span>
                {p.status === 'pending' && (
                  <button onClick={() => markPaid(p.id)} style={S.primary}>Mark paid</button>
                )}
              </div>
            </div>
          ))
        )}
        {agreements.length > 0 && (
          <RecordPayment agreements={agreements} onRecord={recordPayment} />
        )}
      </div>
    </div>
  );
}

function CreateAgreementHint({ onCreate }: { onCreate: (bookingId: string) => void }) {
  const [bookingId, setBookingId] = useState('');
  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0ea' }}>
      <label style={S.label}>Create from booking ID</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={S.input} value={bookingId} onChange={e => setBookingId(e.target.value)} placeholder="Paste confirmed booking ID" />
        <button disabled={!bookingId.trim()} onClick={() => onCreate(bookingId.trim())} style={S.primary}>Create</button>
      </div>
    </div>
  );
}

function RecordPayment({ agreements, onRecord }: { agreements: Agreement[]; onRecord: (id: string, amount: number, type: string) => void }) {
  const [agreementId, setAgreementId] = useState(agreements[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('rent');
  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0ea' }}>
      <label style={S.label}>Record a payment</label>
      <div style={S.paymentForm}>
        <select style={S.input} value={agreementId} onChange={e => setAgreementId(e.target.value)}>
          {agreements.map(a => <option key={a.id} value={a.id}>{a.property_title || 'Agreement'}</option>)}
        </select>
        <select style={S.input} value={type} onChange={e => setType(e.target.value)}>
          <option value="rent">Rent</option>
          <option value="service_charge">Service charge</option>
          <option value="caution_deposit">Caution deposit</option>
        </select>
        <input style={S.input} type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount ₦" />
        <button
          disabled={!amount || !agreementId}
          onClick={() => { onRecord(agreementId, Number(amount), type); setAmount(''); }}
          style={S.primary}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function statusBadge(status: string): React.CSSProperties {
  const map: Record<string, [string, string]> = {
    draft: ['#f5f5f5', '#888'], sent: ['#fff8e1', '#9a7514'],
    signed: ['#e6f4ea', '#1b5540'], void: ['#fce4ec', '#c62828'],
  };
  const [bg, fg] = map[status] || ['#f5f5f5', '#888'];
  return { fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: bg, color: fg, textTransform: 'uppercase' };
}

function paymentBadge(status: string): React.CSSProperties {
  const map: Record<string, [string, string]> = {
    paid: ['#e6f4ea', '#1b5540'], pending: ['#fff8e1', '#9a7514'],
    failed: ['#fce4ec', '#c62828'], refunded: ['#eef1e9', '#5c6f63'],
  };
  const [bg, fg] = map[status] || ['#f5f5f5', '#888'];
  return { fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: bg, color: fg, textTransform: 'uppercase' };
}

const S: Record<string, React.CSSProperties> = {
  card: { background: '#fffefa', borderRadius: 14, boxShadow: '0 1px 2px rgba(15,38,28,.05)', padding: 20 },
  title: { fontSize: 14, fontWeight: 700, color: '#0f261c', margin: 0 },
  lead: { fontSize: 12, color: '#5c6f63', margin: '4px 0 14px', lineHeight: 1.6 },
  block: { borderTop: '1px solid #f0f0ea', paddingTop: 14, marginTop: 14 },
  rowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 13, fontWeight: 600, color: '#0f261c', margin: 0 },
  rowMeta: { fontSize: 11, color: '#5c6f63', margin: '2px 0 0' },
  moneyRow: { display: 'flex', gap: 16, flexWrap: 'wrap', margin: '10px 0', fontSize: 11, color: '#5c6f63' },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  linkBtn: { fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 999, border: '1px solid #e5e9dd', background: '#fff', color: '#17634a', textDecoration: 'none', cursor: 'pointer' },
  primary: { fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 999, border: 'none', background: '#17634a', color: '#fff', cursor: 'pointer' },
  secondary: { fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 999, border: '1px solid #e5e9dd', background: '#fff', color: '#5c6f63', cursor: 'pointer' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#0f261c', marginBottom: 6 },
  input: { flex: 1, minWidth: 120, padding: '9px 12px', borderRadius: 10, border: '1px solid #e5e9dd', fontSize: 12, color: '#0f261c', background: '#fffefa', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  paymentForm: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  error: { fontSize: 12, color: '#c62828', background: '#fce4ec', borderRadius: 10, padding: '9px 12px', margin: 0 },
  ok: { fontSize: 12, color: '#1b5540', background: '#e6f4ea', borderRadius: 10, padding: '9px 12px', margin: 0 },
};
