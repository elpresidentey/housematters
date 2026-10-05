'use client';

import { useEffect, useRef, useState } from 'react';
import { formatNaira, type Property } from '../lib/properties';
import { factsFor, monthlyEstimate } from '../lib/cardFacts';
import { BedIcon, BathIcon, AreaIcon, LocationIcon, CheckIcon, HomeIcon } from './Icons';
import LandlordContactCard from './LandlordContactCard';

type Props = {
  property: Property;
  onClose: () => void;
  onAction?: (message: string) => void;
  onContact?: (landlordId: string, propertyId: string) => void;
  onSave?: (id: string) => void;
  saved?: boolean;
};

export default function PropertyDetailModal({ property, onClose, onAction, onContact, onSave, saved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const facts = factsFor(property);
  const monthly = monthlyEstimate(property.price);
  const isLuxury = property.badge === 'Luxury';
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const c = () => setWide(window.innerWidth > 860);
    c(); window.addEventListener('resize', c);
    return () => window.removeEventListener('resize', c);
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const prev = document.activeElement as HTMLElement;
    d.showModal();
    document.body.style.overflow = 'hidden';
    return () => { d.close(); document.body.style.overflow = ''; prev?.focus(); };
  }, []);

  return (
    <dialog ref={dialogRef} style={S.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <div style={S.container} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} style={S.closeBtn} aria-label="Close">&times;</button>

        <div style={wide ? S.grid : S.gridMobile}>
          {/* Image */}
          <div style={S.imageWrap}>
            <img src={property.image} alt={property.alt} style={S.image} />
            {property.badge && <span style={isLuxury ? S.badgeLuxury : S.badge}>{property.badge}</span>}
            <span style={S.disclosure}>Illustrative photo</span>
          </div>

          {/* Content */}
          <div style={S.content}>
            {/* Location */}
            <div style={S.location}><LocationIcon /> {property.location}</div>

            {/* Title */}
            <h2 style={S.title}>{property.title}</h2>
            {property.agency && <p style={S.subtitle}>{property.type} &middot; For Rent &middot; {property.agency}</p>}

            {/* Price */}
            <div style={S.priceBlock}>
              <div style={S.priceRow}>
                <span style={S.price}>{formatNaira(property.price)}</span>
                <span style={S.period}>/ year</span>
              </div>
              <div style={S.priceInfo}>
                <span style={S.monthly}>~{formatNaira(monthly)}/month</span>
                <span style={S.available}>Available now</span>
              </div>
            </div>

            {/* Facts */}
            <div style={S.factsGrid}>
              {facts.beds && <Fact icon={<BedIcon />} value={facts.beds} label="Beds" />}
              {facts.baths && <Fact icon={<BathIcon />} value={facts.baths} label="Baths" />}
              {facts.area && <Fact icon={<AreaIcon />} value={facts.area} label="Area" />}
              <Fact icon={<HomeIcon />} value={property.type} label="Type" />
            </div>

            {/* Description */}
            <Section title="About">
              <p style={S.description}>{property.description}</p>
            </Section>

            {/* Features */}
            {property.features?.length > 0 && (
              <Section title="Features">
                <div style={S.tags}>
                  {property.features.map((f, i) => <Tag key={i} text={f} />)}
                </div>
              </Section>
            )}

            {/* Cost Breakdown */}
            <Section title="Estimated Costs">
              <div style={S.costBox}>
                <CostRow label="Annual Rent" value={formatNaira(property.price)} />
                <CostRow label="Agency Fee (est. 10%)" value={formatNaira(property.price * 0.1)} />
                <CostRow label="Legal Fee (est.)" value={formatNaira(50000)} />
                <CostRow label="Total Initial Payment" value={formatNaira(property.price + property.price * 0.1 + 50000)} total />
              </div>
              <p style={S.costNote}>Service charges and utilities are additional.</p>
            </Section>

            {/* Lease Terms */}
            <Section title="Lease Terms">
              <div style={S.leaseGrid}>
                <LeaseItem label="Duration" value="12 months" />
                <LeaseItem label="Payment" value="Annual advance" />
                <LeaseItem label="Deposit" value="Negotiable" />
                <LeaseItem label="Move-in" value="Immediate" />
              </div>
            </Section>

            {/* Before Proceeding */}
            <Section title="Before Proceeding">
              <ul style={S.list}>
                <Bullet text="Inspect the property in person before making any payment" />
                <Bullet text="Verify landlord identity and authority to rent" />
                <Bullet text="Request a written tenancy agreement reviewed by a lawyer" />
                <Bullet text="Confirm power, water, security and estate arrangements" />
              </ul>
            </Section>

            {/* Owner card */}
            {property.landlordId && <LandlordContactCard landlordId={property.landlordId} />}

            {/* Disclaimer */}
            <p style={S.disclaimer}><strong>Demo Notice:</strong> Illustrative listing. Photos are sample images and prices are figures for demonstration.</p>

            {/* Actions */}
            <div style={S.actions}>
              {onSave && (
                <button onClick={() => onSave(property.id)} style={S.saveBtn} aria-label={saved ? 'Unsave' : 'Save'}>
                  {saved ? '\u2665' : '\u2661'}
                </button>
              )}
              <button
                style={S.primaryBtn}
                onClick={() => {
                  if (onContact && property.landlordId) onContact(property.landlordId, property.id);
                  else onAction?.('Messaging feature will be available soon');
                }}
              >
                Contact Landlord
              </button>
              <button style={S.outlineBtn} onClick={() => onAction?.('Viewing request sent! The agent will contact you soon.')}>
                Schedule Viewing
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

/* ── Small helpers ── */
function Fact({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={S.factItem}>
      <span style={S.factIcon}>{icon}</span>
      <div><span style={S.factValue}>{value}</span><span style={S.factLabel}>{label}</span></div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 0 }}>
      <h4 style={S.sectionTitle}>{title}</h4>
      {children}
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return <span style={S.tag}><span style={{ color: '#17634a' }}><CheckIcon /></span> {text}</span>;
}

function CostRow({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return (
    <div style={{ ...S.costRow, ...(total ? S.costRowTotal : {}) }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

function LeaseItem({ label, value }: { label: string; value: string }) {
  return <div style={S.leaseItem}><span style={S.leaseLabel}>{label}</span><span style={S.leaseValue}>{value}</span></div>;
}

function Bullet({ text }: { text: string }) {
  return <li style={S.bulletItem}><span style={{ color: '#17634a', fontWeight: 700 }}>&bull;</span> {text}</li>;
}

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, width: '100vw', height: '100vh',
    maxWidth: 'none', maxHeight: 'none', margin: 0, padding: 0, border: 'none',
    background: 'rgba(15, 38, 28, 0.55)', backdropFilter: 'blur(6px)',
    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'auto',
  },
  container: {
    position: 'relative', width: '96vw', maxWidth: '1120px', maxHeight: '92vh',
    background: '#fff', borderRadius: '14px', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
    cursor: 'auto',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '12px', zIndex: 20,
    width: '36px', height: '36px', border: '1px solid #e5e5e5', borderRadius: '50%',
    background: '#fff', fontSize: '22px', lineHeight: '1', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden', height: '92vh',
  },
  gridMobile: {
    display: 'flex', flexDirection: 'column', overflow: 'auto', maxHeight: '94vh',
  },

  /* Image */
  imageWrap: { position: 'relative', background: '#f5f5f5', minHeight: '400px', overflow: 'hidden' },
  image: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  badge: {
    position: 'absolute', top: '12px', left: '12px', zIndex: 2,
    background: 'rgba(255,253,246,.88)', color: '#5c6f63', border: '1px solid #e5e9dd',
    fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '3px 7px', borderRadius: '3px',
  },
  badgeLuxury: {
    position: 'absolute', top: '12px', left: '12px', zIndex: 2,
    background: '#123e30', color: '#f2d77e', border: '1px solid #e9c76766',
    fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '3px 7px', borderRadius: '3px',
  },
  disclosure: {
    position: 'absolute', left: '12px', bottom: '12px', zIndex: 2,
    background: 'rgba(15, 38, 28, 0.65)', backdropFilter: 'blur(4px)',
    color: 'rgba(255,255,255,.85)', fontSize: '8px', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', padding: '3px 6px', borderRadius: '3px',
  },

  /* Content */
  content: {
    display: 'flex', flexDirection: 'column', gap: '16px',
    overflowY: 'auto', overflowX: 'hidden', padding: '24px 28px',
  },
  location: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em',
    color: '#17634a', fontWeight: 700,
  },
  title: {
    margin: 0, fontSize: '24px', fontWeight: 700, color: '#1a1a1a',
    lineHeight: 1.25, letterSpacing: '-0.3px',
  },
  subtitle: { margin: 0, fontSize: '14px', color: '#666' },

  /* Price */
  priceBlock: {
    padding: '16px 18px', background: '#f7f6ef', border: '1px solid #e5e5e5',
    borderLeft: '3px solid #17634a', borderRadius: '8px',
  },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' },
  price: { fontSize: '28px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' },
  period: { fontSize: '14px', color: '#666' },
  priceInfo: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '14px' },
  monthly: { color: '#666' },
  available: { color: '#17634a', fontWeight: 700 },

  /* Facts */
  factsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  factItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: '#f7f6ef', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '12px 14px',
  },
  factIcon: { color: '#17634a', flexShrink: 0 },
  factValue: { display: 'block', fontWeight: 700, color: '#1a1a1a', fontSize: '14px', textTransform: 'capitalize' },
  factLabel: { display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' },

  /* Section */
  sectionTitle: {
    margin: '0 0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: '#1a1a1a', paddingBottom: '8px', borderBottom: '1px solid #e5e5e5',
  },
  description: { margin: 0, fontSize: '15px', lineHeight: 1.7, color: '#4a4a4a' },

  /* Tags */
  tags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: '#f7f6ef', border: '1px solid #e5e5e5', borderRadius: '20px',
    padding: '8px 14px', fontSize: '13px', color: '#4a4a4a',
  },

  /* Cost */
  costBox: {
    background: '#f7f6ef', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden',
  },
  costRow: {
    display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
    borderBottom: '1px solid #e5e5e5', fontSize: '14px', fontWeight: 600,
  },
  costRowTotal: { borderBottom: 'none', background: '#fff', fontWeight: 700 },
  costNote: { margin: '8px 0 0', fontSize: '12px', color: '#888' },

  /* Lease */
  leaseGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  leaseItem: {
    display: 'flex', flexDirection: 'column', gap: '4px',
    padding: '12px 14px', background: '#f7f6ef', borderRadius: '8px',
  },
  leaseLabel: { fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' },
  leaseValue: { fontSize: '13px', color: '#1a1a1a', fontWeight: 600 },

  /* List */
  list: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' },
  bulletItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#4a4a4a', lineHeight: 1.6 },

  disclaimer: { margin: 0, fontSize: '12px', color: '#888', lineHeight: 1.7 },

  /* Actions */
  actions: {
    display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '16px',
    borderTop: '1px solid #e5e5e5', marginTop: 'auto',
  },
  saveBtn: {
    flex: '0 0 auto', minWidth: '48px', minHeight: '48px', padding: '0 14px',
    background: '#fff', color: '#17634a', border: '1px solid #17634a',
    borderRadius: '6px', fontSize: '20px', cursor: 'pointer',
  },
  primaryBtn: {
    flex: '1 1 180px', minHeight: '48px', padding: '12px 24px',
    background: '#17634a', color: '#fff', border: 'none', borderRadius: '6px',
    fontSize: '15px', fontWeight: 600, cursor: 'pointer',
  },
  outlineBtn: {
    flex: '1 1 180px', minHeight: '48px', padding: '12px 24px',
    background: '#fff', color: '#17634a', border: '1px solid #17634a',
    borderRadius: '6px', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
  },
};
