// Shared specs + card facts derived from the canonical listing data.
// Single source of truth for beds / baths / floor area / tenure so every
// card AND the detail modal render the same facts with the same styling.

import type { Property } from './properties';

export type CardFacts = {
  beds: string;
  baths: string;
  area: string;
  tenure: 'For Rent';
  typeLabel: string;
};

function firstNumber(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : null;
}

/** Parse "4 bedrooms" / "Self-contained" style feature strings. */
export function factsFor(property: Property): CardFacts {
  const blob = property.features.join(' | ').toLowerCase();
  const bedHit = property.features.find((f) => /bed/i.test(f));
  const bathHit = property.features.find((f) => /bath/i.test(f));
  const beds = firstNumber(bedHit) ?? (/self-contained|studio|kitchenette/i.test(blob) ? '1' : '—');
  const baths = firstNumber(bathHit) ?? '—';
  return {
    beds: beds === '1' && /studio|self-contained/i.test(property.type + blob) ? 'Studio' : beds,
    baths,
    area: property.area ?? '—',
    tenure: 'For Rent',
    typeLabel:
      property.type === 'apartment' ? 'Flat / Apartment' : property.type === 'house' ? 'House / Duplex' : 'Self-contained',
  };
}

/** Floor areas per listing (sqm). Original data, shared by cards + modal. */
const AREAS: Record<string, string> = {
  'banana-island-penthouse': '650 sqm',
  'maitama-hilltop-villa': '1,200 sqm',
  'vi-skyline-residence': '540 sqm',
  'ikoyi-luxury-condo': '320 sqm',
  'oniru-modern-villa': '800 sqm',
  'asokoro-garden-villa': '950 sqm',
  'guzape-smart-townhouse': '450 sqm',
  'jabi-lakeside-residence': '280 sqm',
  'lekki-flat': '140 sqm',
  'yaba-studio': '45 sqm',
  'gwarinpa-duplex': '380 sqm',
  'ikeja-flat': '180 sqm',
  'wuse-flat': '160 sqm',
  'ibadan-house': '300 sqm',
  'port-harcourt-flat': '170 sqm',
  'enugu-studio': '50 sqm',
  'ajah-duplex': '400 sqm',
  'kano-flat': '150 sqm',
};

/** Amenity extras shown only in the detail modal (illustrative). */
const AMENITIES: Record<string, string[]> = {
  'banana-island-penthouse': ['Private jetty', 'Smart home system', 'Rooftop terrace', '24/7 concierge', 'Swimming pool'],
  'maitama-hilltop-villa': ['Swimming pool', 'Guest chalet', 'Borehole & solar', 'CCTV & guards', 'Staff quarters'],
  'vi-skyline-residence': ['Rooftop lounge', 'Gym & pool', 'Concierge', 'Elevator access', 'Smart home system'],
  'ikoyi-luxury-condo': ['Gym & pool', 'Concierge', 'Fitted kitchen', 'Prepaid meter', 'Secure parking'],
  'oniru-modern-villa': ['Home cinema', 'Staff quarters', 'Smart home system', 'CCTV & guards', 'Landscaped grounds'],
  'asokoro-garden-villa': ['Landscaped gardens', 'Borehole & solar', 'CCTV & guards', 'Staff quarters', 'Water treatment'],
  'guzape-smart-townhouse': ['Home automation', 'Private terrace', 'Fitted kitchen', 'Prepaid meter', 'Secure parking'],
  'jabi-lakeside-residence': ['Lake view balcony', 'Gym & pool', 'Elevator access', 'Concierge', 'Secure parking'],
};

/** Default amenity extras for non-luxury sample homes (illustrative). */
const DEFAULT_AMENITIES = ['Prepaid meter', 'Borehole / water supply', 'Secure parking', 'Fitted kitchen'];

/** Area + amenity enrichment so cards and modal share the same facts. */
export function enrich(property: Property): Property {
  return {
    ...property,
    area: property.area ?? AREAS[property.id] ?? '—',
    amenities: property.amenities ?? AMENITIES[property.id] ?? DEFAULT_AMENITIES,
  };
}

export function monthlyEstimate(annual: number): number {
  return Math.round(annual / 12);
}

/** "Lekki Phase 1, Lagos" -> { area: "Lekki Phase 1", city: "Lagos" } */
export function splitLocation(location: string): { area: string; city: string } {
  const parts = location.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return { area: location, city: '' };
  return { area: parts.slice(0, -1).join(', '), city: parts[parts.length - 1] };
}
