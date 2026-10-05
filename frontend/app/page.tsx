'use client';

import { useCallback, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { HomyHero, HomyStats, HomyTopProperties, HomyServices, HomyHighlight, HomyReviews, HomyFaq, HomyCta } from '@/components/HomySections';
import { HowItWorks, RentalGuide, CallToAction, Footer } from '@/components/NigeriaSections';
import Properties from '@/components/PropertySearch';
import PropertyDetailModal from '@/components/PropertyDetailModal';
import AuthModal from '@/components/AuthModal';
import Messages from '@/components/Messages';
import Notifications, { type Toast } from '@/components/Notifications';
import { api, getToken, type PaginatedProperties } from '@/lib/api';
import { loadSavedHomes, persistSavedHomes, syncSavedHomesFromBackend, saveHomeToBackend, removeHomeFromBackend } from '@/lib/savedHomes';
import { properties as fallbackProperties } from '@/lib/properties';
import { enrich } from '@/lib/cardFacts';
import type { Property } from '@/lib/properties';
import { useCursor, useSmoothScroll } from '@/lib/homyFx';

export default function Home() {
  useCursor();
  useSmoothScroll();
  const [detail, setDetail] = useState<Property | null>(null);
  const [auth, setAuth] = useState<'login' | 'register' | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [messaging, setMessaging] = useState<{ receiverId: string; propertyId: string } | null>(null);
  const [apiProps, setApiProps] = useState<Property[]>([]);

  useEffect(() => {
    api<PaginatedProperties>('/properties?limit=50').then((data) => {
      if (data.properties?.length) {
        setApiProps(data.properties.map((p) => {
          const typeMap: Record<string, Property['type']> = { flat: 'apartment', apartment: 'apartment', house: 'house', duplex: 'house', studio: 'studio' };
          let image = '/images/living-room.jpg';
          if (Array.isArray(p.images) && p.images.length) image = p.images[0];
          else if (typeof p.images === 'string') { try { const a = JSON.parse(p.images); if (a.length) image = a[0]; } catch {} }
          return { id: p.id, title: p.title, price: p.rent, location: [p.city, p.state].filter(Boolean).join(', '), type: typeMap[p.property_type?.toLowerCase()] || 'apartment', features: [], image, alt: p.title, description: p.description, landlordId: p.landlord_id };
        }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (getToken()) {
      syncSavedHomesFromBackend().then(setSaved);
    } else {
      setSaved(loadSavedHomes());
    }
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((current) => {
      const next = new Set(current);
      const removing = next.has(id);
      if (removing) { next.delete(id); removeHomeFromBackend(id); }
      else { next.add(id); saveHomeToBackend(id); }
      persistSavedHomes(next);
      return next;
    });
  }, []);

  const notify = useCallback((message: string, type: Toast['type'] = 'info') => {
    setToasts((current) => [...current, { id: Date.now() + Math.random(), message, type }]);
  }, []);
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const openById = useCallback((id: string) => {
    const allProps = [...apiProps, ...fallbackProperties];
    const found = allProps.find((property) => property.id === id) ?? null;
    setDetail(found ? enrich(found) : null);
  }, [apiProps]);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar savedCount={saved.size} onLogin={() => setAuth('login')} onRegister={() => setAuth('register')} />
      <main id="main-content">
        <HomyHero savedCount={saved.size} />
        <HomyStats />
        <HomyTopProperties onSelect={openById} />
        <HomyServices />
        <Properties onSelect={(property) => setDetail(enrich(property))} saved={saved} onToggleSaved={toggleSaved} />
        <HomyHighlight />
        <HowItWorks />
        <RentalGuide />
        <HomyReviews />
        <HomyFaq />
        <CallToAction onList={() => { if (getToken()) { window.location.href = '/dashboard'; } else { setAuth('register'); } }} />
        <HomyCta />
      </main>
      <Footer />
      {detail && <PropertyDetailModal property={detail} saved={saved.has(detail.id)} onSave={toggleSaved} onAction={(message) => { setDetail(null); notify(message); }} onContact={(landlordId, propertyId) => { setDetail(null); setMessaging({ receiverId: landlordId, propertyId }); }} onClose={() => setDetail(null)} />}
      {messaging && <Messages receiverId={messaging.receiverId} propertyId={messaging.propertyId} onClose={() => setMessaging(null)} />}
      {auth && <AuthModal key={auth} mode={auth} onSwitch={setAuth} onClose={() => setAuth(null)} />}
      <Notifications toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
