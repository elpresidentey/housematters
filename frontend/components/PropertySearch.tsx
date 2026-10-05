'use client';
import { useState, useEffect, type FormEvent } from 'react';
import { properties as fallbackProperties, formatNaira, type Property } from '../lib/properties';
import { enrich } from '../lib/cardFacts';
import { api, type ApiProperty, type PaginatedProperties } from '../lib/api';
import PropertyCard from './PropertyCard';

function mapApiProperty(p: ApiProperty): Property {
  const features: string[] = [];
  if (p.bedrooms) features.push(`${p.bedrooms} bedroom${p.bedrooms > 1 ? 's' : ''}`);
  if (p.bathrooms) features.push(`${p.bathrooms} bathroom${p.bathrooms > 1 ? 's' : ''}`);

  let amenities: string[] = [];
  if (Array.isArray(p.amenities)) amenities = p.amenities;
  else if (typeof p.amenities === 'string') { try { amenities = JSON.parse(p.amenities); } catch {} }
  if (amenities.length) features.push(...amenities.slice(0, 3));

  const typeMap: Record<string, Property['type']> = { flat: 'apartment', apartment: 'apartment', house: 'house', duplex: 'house', studio: 'studio', self_contained: 'studio' };

  let image = '/images/living-room.jpg';
  if (Array.isArray(p.images) && p.images.length) image = p.images[0];
  else if (typeof p.images === 'string') { try { const arr = JSON.parse(p.images); if (arr.length) image = arr[0]; } catch {} }

  return {
    id: p.id,
    title: p.title,
    price: p.rent,
    location: [p.city, p.state].filter(Boolean).join(', '),
    type: typeMap[p.property_type?.toLowerCase()] || 'apartment',
    features,
    image,
    alt: p.title,
    description: p.description,
    landlordId: p.landlord_id,
  };
}

const cities = ['All locations', 'Lagos', 'Abuja', 'Ibadan', 'Port Harcourt', 'Enugu', 'Kano'];
const initialFilters = { location: '', type: '', price: '' };

export default function PropertySearch({ onSelect, saved, onToggleSaved }: {
  onSelect: (property: Property) => void;
  saved: Set<string>;
  onToggleSaved: (id: string) => void;
}) {
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState('featured');
  const [savedOnly, setSavedOnly] = useState(false);
  const [luxuryOnly, setLuxuryOnly] = useState(false);
  const [apiProperties, setApiProperties] = useState<Property[]>([]);
  const [apiLoaded, setApiLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api<PaginatedProperties>('/properties?limit=50');
        if (!cancelled && data.properties?.length) {
          setApiProperties(data.properties.map(mapApiProperty));
          setApiLoaded(true);
        }
      } catch {
        // Backend unavailable — fall back to hardcoded data
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const allProperties = apiLoaded ? apiProperties : fallbackProperties;
  const results = allProperties
    .filter((property) => property.location.toLowerCase().includes(filters.location.toLowerCase()) && (!filters.type || property.type === filters.type) && (!filters.price || property.price <= Number(filters.price)) && (!savedOnly || saved.has(property.id)) && (!luxuryOnly || property.badge === 'Luxury'))
    .slice();
  if (sort !== 'featured') results.sort((a, b) => sort === 'price-low' ? a.price - b.price : b.price - a.price);
  function search(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setFilters({ ...draft, location: draft.location.trim() }); }
  function reset() { setFilters(initialFilters); setDraft(initialFilters); setSort('featured'); setSavedOnly(false); setLuxuryOnly(false); }
  function chooseCity(city: string) { const next = { ...draft, location: city === cities[0] ? '' : city }; setDraft(next); setFilters(next); }
  const luxuryCount = allProperties.filter((property) => property.badge === 'Luxury').length;
  return <>
    <section className="ng-search container" id="search" aria-label="Find a home">
      <form onSubmit={search} className="search-form"><div className="search-inputs">
        <div className="search-field"><label htmlFor="location">Location</label><input id="location" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="City or neighbourhood" /></div>
        <div className="search-field"><label htmlFor="property-type">Property Type</label><select id="property-type" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}><option value="">Any home type</option><option value="apartment">Flat / Apartment</option><option value="house">House / Duplex</option><option value="studio">Self-contained</option></select></div>
        <div className="search-field"><label htmlFor="price-range">Max annual rent</label><select id="price-range" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })}><option value="">Any budget</option>{[1000000, 2000000, 4000000, 6000000, 10000000, 25000000, 50000000, 100000000].map((price) => <option key={price} value={price}>Up to {formatNaira(price)}</option>)}</select></div>
        <button className="btn btn-primary search-btn" type="submit">Search homes <span aria-hidden="true">↗</span></button>
      </div></form>
    </section>
    <section className="ng-properties" id="properties"><div className="container">
      <div className="editorial-heading"><div><p className="eyebrow">Find somewhere that feels like you</p><h2>Different spaces.<br />Same feeling of home.</h2></div><p>A first apartment, a family home, a fresh start. Explore sample homes across Nigeria — including a Luxury Collection from Lagos and Abuja developers.</p></div>
      <div className="city-tabs" aria-label="Filter by city">{cities.map((city) => <button key={city} className={filters.location === (city === cities[0] ? '' : city) ? 'selected' : ''} aria-pressed={filters.location === (city === cities[0] ? '' : city)} onClick={() => chooseCity(city)}>{city}</button>)}</div>
      <div className="listing-toolbar"><p role="status">{luxuryOnly ? `${results.length} luxury ${results.length === 1 ? 'home' : 'homes'} to explore` : savedOnly ? `${results.length} saved ${results.length === 1 ? 'home' : 'homes'}` : `${results.length} sample ${results.length === 1 ? 'home' : 'homes'} to explore`}</p><div className="toolbar-controls"><label className="luxury-toggle"><input type="checkbox" checked={luxuryOnly} onChange={(event) => setLuxuryOnly(event.target.checked)} /> Luxury Collection ({luxuryCount})</label>{saved.size > 0 && <label className="saved-toggle"><input type="checkbox" checked={savedOnly} onChange={(event) => setSavedOnly(event.target.checked)} /> Saved homes ({saved.size})</label>}<label>Sort by <select aria-label="Sort properties" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Recommended</option><option value="price-low">Rent: low to high</option><option value="price-high">Rent: high to low</option></select></label></div></div>
      <div className="properties-grid">{results.map((property) => (
        <PropertyCard key={property.id} property={enrich(property)} variant="listing" saved={saved.has(property.id)} onSelect={() => onSelect(enrich(property))} onToggleSaved={() => onToggleSaved(property.id)} />
      ))}</div>
      {results.length === 0 && (savedOnly ? <div className="empty-state"><h3>No saved homes here yet.</h3><p>Tap the ♥ on any home to keep it for later.</p></div> : luxuryOnly ? <div className="empty-state"><h3>No luxury homes match just yet.</h3><p>Try another city or a higher annual budget.</p></div> : <div className="empty-state"><h3>No homes match just yet.</h3><p>Try another city, a different home type, or a higher annual budget.</p></div>)}
      <div className="section-cta"><button className="btn btn-outline" onClick={reset}>View all properties <span aria-hidden="true">↗</span></button><p className="inventory-note">Sample annual rents only. Not live listings or market valuations. Additional charges may apply.</p></div>
    </div></section>
  </>;
}
