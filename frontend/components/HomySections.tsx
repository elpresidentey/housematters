'use client';

import SafeImage from './SafeImage';
import PropertyCard from './PropertyCard';
import { properties } from '../lib/properties';
import { enrich } from '../lib/cardFacts';
import { useMagnet, useReveal, useStagger, useCountUp, SplitWords, SpacedLine } from '../lib/homyFx';

/** CTA button with magnetic cursor-follow hover. */
function MagnetLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  const magnet = useMagnet<HTMLAnchorElement>(0.22);
  return <a href={href} className={className} ref={magnet}>{children}</a>;
}

export function HomyHero({ savedCount }: { savedCount: number }) {
  return (
    <section className="homy-hero" id="home" aria-label="Find your dream home in Nigeria">
      <div className="homy-hero-background" aria-hidden="true">
        <SafeImage
          src="/images/modern-villa.jpg"
          alt=""
          width={1920}
          height={1080}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="homy-hero-bg-image"
        />
        <div className="homy-hero-overlay" />
      </div>
      <div className="container homy-hero-content">
        <div className="homy-hero-copy">
          <p className="homy-eyebrow"><span className="homy-dot" aria-hidden="true" /> House Matters · Nigeria</p>
          <h1><SplitWords text="Find Your Dream Home, the Easy Way" /></h1>
          <p className="homy-sub">Explore thoughtfully listed homes in Lagos, Abuja and beyond — crafted for modern Nigerian living with comfort, elegance and long-term value.</p>
          <div className="homy-hero-actions">
            <a href="#search" className="btn btn-primary homy-hero-btn">Explore Homes <span aria-hidden="true">→</span></a>
            <a href="#properties" className="btn btn-outline homy-hero-btn">Book a Visit</a>
          </div>
          <div className="homy-hero-meta">
            <div className="homy-proof">
              <p><strong>Direct from landlords</strong></p>
              <p>No middlemen — message the owner yourself</p>
            </div>
            {savedCount > 0 && <p className="homy-saved-note"><strong>{savedCount} saved</strong> in your shortlist</p>}
          </div>
          <a href="#top-properties" className="homy-hero-scroll" aria-label="Scroll to featured homes">
            <span aria-hidden="true">↓</span> Featured homes
          </a>
        </div>
      </div>
    </section>
  );
}


function StatCell({ target, label, suffix }: { target: number; label: string; suffix: string }) {
  const num = useCountUp(target);
  return <div className="homy-stat"><strong><span ref={num}>0</span>{suffix}</strong><span>{label}</span></div>;
}

export function HomyTopProperties({ onSelect }: { onSelect: (id: string) => void }) {
  const reveal = useStagger<HTMLElement>('.property-card');
  const top = ['banana-island-penthouse', 'maitama-hilltop-villa', 'vi-skyline-residence']
    .map((id) => properties.find((p) => p.id === id)!)
    .filter(Boolean);
  return (
    <section className="homy-top" id="top-properties" ref={reveal}>
      <div className="container">
        <div className="homy-section-head">
          <div><p className="homy-eyebrow">Top properties</p><h2><SplitWords text="Selected homes for modern living" /></h2></div>
          <a href="#properties" className="text-action">View all homes <span aria-hidden="true">→</span></a>
        </div>
        <SpacedLine text="Carefully chosen properties that combine design, comfort and location" />
        <div className="homy-top-grid">
          {top.map((property) => (
            <PropertyCard key={property.id} property={enrich(property)} variant="featured" onSelect={() => onSelect(property.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}
export function HomyServices() {
  const reveal = useStagger<HTMLElement>('.homy-service');
  const services = [
    { n: '.01', title: 'Buy a Home', text: 'Find homes perfect for you — compare neighbourhoods, prices and what each area offers.', image: '/images/family-home.jpg', alt: 'Illustrative family home with a welcoming frontage' },
    { n: '.02', title: 'Rent a Home', text: 'Find rental homes with ease — annual rents in naira, clear terms, verified guidance.', image: '/images/apartment.jpg', alt: 'Illustrative bright rental apartment interior' },
    { n: '.03', title: 'Explore Listings', text: 'Explore available properties easily — filter by city, type and budget in seconds.', image: '/images/living-room.jpg', alt: 'Illustrative comfortable living room' },
  ];
  return (
    <section className="homy-services" id="services" ref={reveal}>
      <div className="container">
        <div className="homy-section-head">
          <div><p className="homy-eyebrow">Our services</p><h2><SplitWords text="Everything you need for your home" /></h2></div>
          <p className="homy-head-note">Built to simplify your search with clear insights, better options and confident decisions.</p>
        </div>
        <div className="homy-services-grid">
          {services.map((service) => (
            <article className="homy-service" key={service.n}>
              <div className="homy-service-media">
                <SafeImage src={service.image} alt={service.alt} width={800} height={600} loading="lazy" />
                <span className="homy-service-num">{service.n}</span>
              </div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <a href="#properties" className="text-action">Get started <span aria-hidden="true">→</span></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomyHighlight() {
  const reveal = useReveal<HTMLElement>();
  return (
    <section className="homy-highlight" id="spotlight" ref={reveal}>
      <div className="container homy-highlight-grid">
        <div className="homy-highlight-media"><SafeImage src="/images/hilltop-villa.jpg" alt="Illustrative modern villa designed for better living" width={1000} height={800} loading="lazy" /></div>
        <div className="homy-highlight-copy">
          <p className="homy-eyebrow light">Highlighted home</p>
          <h2><SplitWords text="Modern homes, designed to live better" /></h2>
          <p>Clean lines, open plans and functional spaces — see how modern Nigerian homes are designed to feel bright, airy and practical.</p>
          <div className="homy-highlight-actions">
            <MagnetLink href="#properties" className="btn btn-primary">Explore Homes <span aria-hidden="true">→</span></MagnetLink>
            <span className="homy-chip">Live Better · Modern Spaces</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomyReviews() {
  const reveal = useStagger<HTMLElement>('.homy-review');
  const trust: Array<[string, string]> = [
    ['Direct contact', 'Message the landlord straight from the listing — no agent in the middle.'],
    ['Honest pricing', 'Every listing shows the annual rent up front. No hidden fees at the door.'],
    ['Your pick', 'Save homes, set alerts, and schedule a viewing when it suits you.'],
  ];
  return (
    <section className="homy-reviews" id="reviews" ref={reveal}>
      <div className="container">
        <div className="homy-section-head">
          <div><p className="homy-eyebrow">Built for its tenants</p><h2><SplitWords text="No middlemen, no hidden charges" /></h2></div>
        </div>
        <SpacedLine text="What you get when you list or search with House Matters" />
        <div className="homy-reviews-grid">
          {trust.map(([title, text]) => (
            <figure className="homy-review" key={title}>
              <blockquote>{text}</blockquote>
              <figcaption><strong>{title}</strong></figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomyFaq() {
  const reveal = useStagger<HTMLElement>('.homy-faq-item');
  const faqs: Array<[string, string]> = [
    ['How do I start searching for a home?', 'Browse the listings, filter by city, home type and annual budget, then open any home for full details.'],
    ['Can I filter homes by budget and location?', 'Yes — use the search bar and city tabs to narrow by location, type and maximum annual rent.'],
    ['Are the property details accurate?', 'Listing details come straight from the landlord. Always inspect in person and confirm ownership before paying anything.'],
    ['How do I contact an owner or agent?', 'Open a listing and choose Contact Landlord to message the owner, or Schedule Viewing to arrange a visit.'],
    ['Do I need an account to use the platform?', 'You can browse freely. Creating an account lets you save homes and manage preferences.'],
  ];
  return (
    <section className="homy-faq" id="faq" ref={reveal}>
      <div className="container homy-faq-grid">
        <div><p className="homy-eyebrow">FAQ</p><h2><SplitWords text="Things you should know" /></h2><p className="homy-head-note">Common questions to help you get started with clarity.</p></div>
        <div className="homy-faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question} className="homy-faq-item">
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomyCta() {
  return (
    <section className="homy-cta-section">
      <div className="container">
        <div className="homy-cta">
          <p className="homy-eyebrow light">Get started</p>
          <h2>Find your next home</h2>
          <p className="homy-cta-sub">Discover homes designed for your lifestyle — explore, compare and move forward with confidence.</p>
          <div className="homy-cta-actions">
            <a href="#search" className="btn btn-primary">Explore Properties</a>
            <a href="#services" className="btn btn-outline">Our Services</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomyStats() {
  const reveal = useReveal<HTMLElement>();
  const stats: Array<[number, string, string]> = [
    [3, 'Cities covered', ''],
    [0, 'Middlemen involved', ''],
    [100, 'Direct owner contact', '%'],
  ];
  return (
    <section className="homy-stats" aria-label="How House Matters works" ref={reveal}>
      <div className="container">
        <p className="homy-eyebrow light">Built different</p>
        <h2><SplitWords text="Direct between you and the owner" /></h2>
        <div className="homy-stats-grid">
          {stats.map(([target, label, suffix]) => (
            <StatCell key={label} target={target} label={label} suffix={suffix} />
          ))}
        </div>
      </div>
    </section>
  );
}

