'use client';

import SafeImage from './SafeImage';

export function Hero({ onList }: { onList: () => void }) {
  return <section className="ng-hero" id="home">
    <div className="container ng-hero-grid">
      <div className="ng-hero-copy">
        <p className="eyebrow"><span className="country-mark" /> A better way to rent in Nigeria</p>
        <h1>Not just a house.<br />Your next <em>home.</em></h1>
        <p className="hero-intro">From your first self-contain to a place for the whole family. Find a space that fits your life, your city, and your budget.</p>
        <div className="ng-actions"><a href="#search" className="btn btn-primary">Find my home <span aria-hidden="true">↗</span></a><button className="text-action" onClick={onList}>I’m a landlord <span aria-hidden="true">→</span></button></div>
        <div className="hero-note"><span className="note-symbol" aria-hidden="true">⌂</span><div><strong>Big moves start with a little clarity.</strong><span>Explore neighbourhoods. Compare annual rents.</span></div></div>
      </div>
      <div className="ng-hero-visual">
        <SafeImage className="hero-main-photo" src="/images/home-exterior.jpg" alt="Illustrative contemporary home with greenery and a welcoming entrance" width={1200} height={900} fetchPriority="high" />
        <span className="photo-tag">A fresh start looks good on you</span>
        <div className="hero-inset"><SafeImage src="/images/living-room.jpg" alt="Illustrative light-filled living room with warm neutral furniture" width={500} height={350} /><span>Space to make your own <span aria-hidden="true">↗</span></span></div>
        <div className="hero-caption"><span className="country-mark" /> Made for the way we live.</div>
      </div>
    </div>
    <div className="container market-strip"><span>YOUR CITY. YOUR PACE.</span><span>Lagos</span><span>Abuja</span><span>Ibadan</span><span>Port Harcourt</span><span>Enugu</span><span>Kano</span></div>
  </section>;
}

export function HowItWorks() {
  return <section className="ng-how reveal" id="about"><div className="container">
    <div className="editorial-heading"><div><p className="eyebrow">Less wahala. More possibility.</p><h2>A simpler way to<br />find your place.</h2></div><p>House hunting can be a lot. Start with the things that matter, and take it one step at a time.</p></div>
    <div className="ng-steps">{[
      ['01', 'Find your kind of space', 'Choose your city, home type and annual budget. Our sample listings help you explore what matters to you.'],
      ['02', 'Look beyond the photos', 'Inspect in person. Ask about power, water, drainage, security and your everyday commute.'],
      ['03', 'Know the full picture', 'Verify the landlord or authorised representative. Agree all costs and tenancy terms in writing before paying.'],
    ].map(([number, title, text]) => <article key={number}><span className="step-index">{number} <span aria-hidden="true">↗</span></span><h3>{title}</h3><p>{text}</p></article>)}</div>
  </div></section>;
}

export function RentalGuide() {
  return <section className="ng-guide reveal" id="rental-guide"><div className="container guide-grid">
    <div className="guide-photo"><SafeImage src="/images/apartment.jpg" alt="Illustrative furnished apartment with a comfortable seating area" width={1000} height={900} loading="lazy" /><span>Make room for your next chapter.</span></div>
    <div className="guide-copy"><p className="eyebrow">The Nigerian renter’s checklist</p><h2>A home you love.<br />No costly surprises.</h2><p>Annual rent is only one part of the conversation. Ask the right questions before you make your move.</p>
      <ul>{['Request a breakdown of rent, service charges, caution deposit and any agency or legal fees.', 'Confirm power supply, prepaid metering, water access and who pays for maintenance.', 'Inspect the property and verify the owner’s authority before transferring money.'].map((text, i) => <li key={text}><span aria-hidden="true">0{i + 1}</span>{text}</li>)}</ul>
      <a href="#search" className="text-action">Explore homes with confidence <span aria-hidden="true">↗</span></a>
    </div>
  </div></section>;
}

export function CallToAction({ onList }: { onList: () => void }) {
  return <section className="container ng-landlord reveal"><div><p className="eyebrow">For property owners</p><h2>Your property.<br />Someone’s next chapter.</h2><p>Help renters discover a place they can call home. Register your interest as a landlord.</p><button className="btn btn-primary" onClick={onList}>Get started as a landlord <span aria-hidden="true">↗</span></button><small>Sign up, then list properties from your dashboard.</small></div><SafeImage src="/images/bedroom.jpg" alt="Illustrative bedroom with a soft neutral palette" width={800} height={650} loading="lazy" /></section>;
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="ng-footer" id="contact">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand-col">
            <a href="#home" className="footer-wordmark">House Matters<span>.</span></a>
            <p className="footer-tagline">The simpler way to find your next home. Built for how Nigerians actually rent.</p>
            <div className="footer-contact">
              <a href="mailto:hello@housematters.ng" className="footer-contact-link">
                <span className="footer-contact-icon" aria-hidden="true">@</span>
                hello@housematters.ng
              </a>
            </div>
            <div className="footer-cities">
              <span className="footer-cities-label">Cities</span>
              <div className="footer-city-tags">
                {['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt', 'Enugu', 'Kano'].map((city) => (
                  <span key={city} className="footer-city-tag">{city}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-links-col">
            <h3>Find a home</h3>
            <a href="#search">Search properties</a>
            <a href="#properties">Browse listings</a>
            <a href="#about">How it works</a>
            <a href="#rental-guide">Renter&apos;s guide</a>
          </div>

          <div className="footer-links-col">
            <h3>For landlords</h3>
            <a href="#landlord">List your property</a>
            <a href="#about">How it works</a>
            <span className="footer-note">List from your landlord dashboard</span>
          </div>

          <div className="footer-links-col">
            <h3>Company</h3>
            <a href="#about">About us</a>
            <a href="#contact">Contact</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {year} House Matters. Made for Nigeria.</span>
          <div className="footer-bottom-links">
            <span>Demo listings &middot; Illustrative photography &middot; Not live availability</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
