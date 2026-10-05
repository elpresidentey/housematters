'use client';

import { useEffect, useRef, useState } from 'react';

export default function Navbar({ savedCount, onLogin, onRegister }: { savedCount: number; onLogin: () => void; onRegister: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('authToken'));
  }, []);

  // While the overlay is open: lock page scroll, make the page behind inert so
  // focus cannot escape, move focus into the menu, and close on Escape.
  useEffect(() => {
    const main = document.querySelector('main');
    document.body.classList.toggle('menu-open', menuOpen);
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    main?.setAttribute('inert', '');
    const focusTimer = window.setTimeout(() => firstLinkRef.current?.focus(), 140);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      main?.removeAttribute('inert');
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Unified anchors — inline nav and overlay share the same targets.
  const navLinks = [
    { href: '#home', label: 'Home', index: '01' },
    { href: '#properties', label: 'Properties', index: '02' },
    { href: '#services', label: 'Services', index: '03' },
    { href: '#about', label: 'About', index: '04' },
    { href: '#rental-guide', label: "Renter's guide", index: '05' },
    { href: '#faq', label: 'FAQ', index: '06' },
    ...(isLoggedIn ? [{ href: '/dashboard', label: 'Dashboard', index: '07', isPage: true }] : []),
  ];

  // Close first, then navigate on the next frame so the body scroll-lock
  // is released and `inert` is lifted before the anchor jump happens.
  const goTo = (href: string, isPage?: boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    if (isPage) {
      window.location.href = href;
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  };

  return (
    <>
      <nav
        className={`navbar${condensed ? ' navbar-scrolled' : ''}${menuOpen ? ' navbar-open' : ''}`}
        id="navbar"
        style={condensed && !menuOpen ? { background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(20px)' } : undefined}
      >
        <div className="nav-container">
          <div className="nav-brand">
            <a href="#home" className="brand-link" onClick={menuOpen ? goTo('#home') : undefined}>
              <div className="brand">
                <span className="brand-logo" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" focusable="false">
                    <title>House Matters</title>
                    <path d="M12 3.172L3 10v10a1 1 0 001 1h6v-6h4v6h6a1 1 0 001-1V10l-9-6.828zM21 9.25l-9-6.75-9 6.75V6.5l9-6.75 9 6.75v2.75z" fill="currentColor" />
                  </svg>
                </span>
                <span className="brand-text">House Matters</span>
              </div>
            </a>
          </div>

          <div className="nav-auth" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isLoggedIn && (
              <a href="/dashboard" style={{ fontSize: 13, fontWeight: 600, color: '#17634a', textDecoration: 'none', fontFamily: 'Cabin, sans-serif' }}>Dashboard</a>
            )}
            {savedCount > 0 && (
              <a className="saved-pill" href="#properties" aria-label={`${savedCount} saved ${savedCount === 1 ? 'home' : 'homes'}`}><span aria-hidden="true">♥</span> {savedCount}</a>
            )}
          </div>

          <button
            type="button"
            className={`menu-toggle${menuOpen ? ' active' : ''}`}
            id="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="nav-menu"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="menu-toggle-text">{menuOpen ? 'Close' : 'Menu'}</span>
            <span className="menu-toggle-icon" aria-hidden="true"><span></span><span></span></span>
          </button>
        </div>
      </nav>

      {/* Full-screen menu overlay — Huge-style takeover (the single nav system) */}
      <div className={`menu-overlay${menuOpen ? ' open' : ''}`} id="menu-overlay" aria-hidden={!menuOpen}>
        <div className="menu-overlay-inner">
          <nav className="menu-links" id="nav-menu" aria-label="Primary">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                ref={i === 0 ? firstLinkRef : undefined}
                className="menu-link"
                style={{ transitionDelay: menuOpen ? `${120 + i * 60}ms` : '0ms' }}
                onClick={goTo(link.href, 'isPage' in link && link.isPage)}
              >
                <span className="menu-link-index" aria-hidden="true">{link.index}</span>
                <span className="menu-link-label">{link.label}</span>
                <span className="menu-link-arrow" aria-hidden="true">→</span>
              </a>
            ))}
          </nav>
          <div className="menu-footer" style={{ transitionDelay: menuOpen ? `${120 + navLinks.length * 60}ms` : '0ms' }}>
            <div className="menu-footer-block">
              <p className="menu-footer-eyebrow">Get in touch</p>
              <a href="mailto:hello@housematters.ng" className="menu-footer-link">hello@housematters.ng</a>
              <a href="#contact" className="menu-footer-link" onClick={goTo('#contact')}>Lagos · Abuja · Nigeria</a>
            </div>
            <div className="menu-footer-block">
              <p className="menu-footer-eyebrow">Account</p>
              <div className="menu-account-actions">
                <button type="button" className="menu-btn menu-btn-outline" id="login-btn" onClick={() => { setMenuOpen(false); onLogin(); }}>Login</button>
                <button type="button" className="menu-btn menu-btn-primary" id="register-btn" onClick={() => { setMenuOpen(false); onRegister(); }}>Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
