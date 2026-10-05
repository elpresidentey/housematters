'use client';

import SafeImage from './SafeImage';

export function Hero({ onList }: { onList: () => void }) {
  return (
    <section className="hero" id="home">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🏆</span>
            <span className="badge-text">Trusted by 10,000+ users</span>
          </div>
          <h1 className="hero-title">
            Find your{' '}
            <span className="title-highlight">perfect house</span>
            <br />without the hassle
          </h1>
          <p className="hero-subtitle">
            Connect directly with property owners and renters. Skip the middleman,
            save on fees, and discover your ideal place to call home.
          </p>
          <div className="hero-actions">
            <a href="#properties" className="btn btn-primary btn-large hero-btn-primary" id="find-property-btn">
              <span className="btn-icon">🔍</span>
              <span className="btn-text">Search Properties</span>
              <span className="btn-arrow">→</span>
            </a>
            <a href="#contact" className="btn btn-outline btn-large hero-btn-outline" id="list-property-btn"
              onClick={(event) => { event.preventDefault(); onList(); }}>
              <span className="btn-icon">📝</span>
              <span className="btn-text">List Your Property</span>
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-stack">
            <div className="hero-card hero-card-1">
              <SafeImage src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Modern apartment" className="card-image" loading="lazy" />
              <div className="card-overlay">
                <div className="card-price">$2,500/mo</div>
                <div className="card-title">Modern Apartment</div>
                <div className="card-location">📍 Downtown NYC</div>
              </div>
            </div>
            <div className="hero-card hero-card-2">
              <SafeImage src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Family home" className="card-image" loading="lazy" />
              <div className="card-overlay">
                <div className="card-price">$3,200/mo</div>
                <div className="card-title">Family Home</div>
                <div className="card-location">📍 Austin, TX</div>
              </div>
            </div>
            <div className="hero-card hero-card-3">
              <SafeImage src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Luxury penthouse" className="card-image" loading="lazy" />
              <div className="card-overlay">
                <div className="card-price">$4,500/mo</div>
                <div className="card-title">Luxury Penthouse</div>
                <div className="card-location">📍 Miami, FL</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <>
      <section className="how-it-works" id="about">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">Getting started is simple and straightforward</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🔍</div>
              <h3>Search &amp; Discover</h3>
              <p>Browse through hundreds of verified properties or use our smart filters to find exactly what
                you&apos;re looking for.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">💬</div>
              <h3>Connect &amp; Chat</h3>
              <p>Message property owners directly through our secure platform. Ask questions, schedule
                viewings, and get to know each other.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🏠</div>
              <h3>Move In</h3>
              <p>Complete your application, handle payments securely, and move into your new home. It&apos;s that
                simple!</p>
            </div>
          </div>
        </div>
      </section>
      <section className="features" id="features">
        <div className="container">
          <h2 className="section-title">Why choose House Matters?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏠</div>
              <h3>Direct connections</h3>
              <p>Connect directly with property owners and renters. No middlemen, no complications.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Transparent pricing</h3>
              <p>Save money with upfront pricing and no hidden fees. What you see is what you pay.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure platform</h3>
              <p>Your payments and personal information are protected with bank-level security.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Trusted community</h3>
              <p>Make informed decisions with verified reviews and ratings from real users.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function Testimonials() {
  return (
    <section className="testimonials">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">What our users say</h2>
          <p className="section-subtitle">Real stories from real people who found their perfect home</p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <div className="quote-icon">&quot;</div>
              <p>&quot;House Matters made finding my apartment so easy. I connected directly with the landlord
                and saved hundreds in agent fees. The whole process was transparent and stress-free.&quot;
              </p>
            </div>
            <div className="testimonial-author">
              <SafeImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80"
                alt="Sarah Johnson" className="author-avatar" />
              <div className="author-info">
                <div className="author-name">Sarah Johnson</div>
                <div className="author-role">Marketing Manager</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <div className="quote-icon">&quot;</div>
              <p>&quot;As a landlord, I love how House Matters connects me directly with quality tenants. The
                review system helps me find reliable renters, and I don&apos;t have to pay hefty agent
                commissions.&quot;</p>
            </div>
            <div className="testimonial-author">
              <SafeImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80"
                alt="Mike Chen" className="author-avatar" />
              <div className="author-info">
                <div className="author-name">Mike Chen</div>
                <div className="author-role">Property Owner</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <div className="quote-icon">&quot;</div>
              <p>&quot;The platform is incredibly user-friendly. I found my dream apartment in just two weeks,
                and the secure payment system gave me peace of mind throughout the process.&quot;</p>
            </div>
            <div className="testimonial-author">
              <SafeImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80"
                alt="Emily Rodriguez" className="author-avatar" />
              <div className="author-info">
                <div className="author-name">Emily Rodriguez</div>
                <div className="author-role">Graduate Student</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CallToAction({ onList }: { onList?: () => void }) {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-content">
          <h2 className="cta-title">Ready to find your perfect home?</h2>
          <p className="cta-subtitle">Join thousands of happy renters and landlords who&apos;ve made the switch to
            House Matters</p>
          <div className="cta-actions">
            <button type="button" className="btn btn-primary btn-large" id="cta-search-btn"
              onClick={() => { window.location.hash = 'properties'; }}>
              Start searching
            </button>
            <button type="button" className="btn btn-outline btn-large" id="cta-list-btn"
              onClick={() => { if (onList) onList(); else window.location.hash = 'contact'; }}>
              List your property
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <h3>House Matters</h3>
              <p>Connecting landlords and tenants directly, making renting simple, transparent, and
                affordable.</p>
              <div className="social-links">
                <a href="#" className="social-link">📘</a>
                <a href="#" className="social-link">🐦</a>
                <a href="#" className="social-link">📷</a>
                <a href="#" className="social-link">💼</a>
              </div>
            </div>
          </div>
          <div className="footer-section">
            <h4>For Renters</h4>
            <ul className="footer-links">
              <li><a href="#properties">Search Properties</a></li>
              <li><a href="#about">How It Works</a></li>
              <li><a href="#">Renter Resources</a></li>
              <li><a href="#">Safety Tips</a></li>
              <li><a href="#">Help Center</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>For Landlords</h4>
            <ul className="footer-links">
              <li><a href="#contact">List Property</a></li>
              <li><a href="#">Landlord Resources</a></li>
              <li><a href="#">Property Management</a></li>
              <li><a href="#">Pricing Guide</a></li>
              <li><a href="#">Success Stories</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul className="footer-links">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Trust &amp; Safety</a></li>
              <li><a href="#">Accessibility</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2025 House Matters. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}



