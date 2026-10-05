'use client';
import { useState, type FormEvent } from 'react';
import { properties, type Property } from '../lib/properties';
import SafeImage from './SafeImage';

export default function Properties({ onSelect }: { onSelect: (property: Property) => void }) {
  const [filters, setFilters] = useState({ location: '', type: '', price: '' });
  const [sort, setSort] = useState('featured');
  const [formKey, setFormKey] = useState(0);
  const results = properties.filter((property) => property.location.toLowerCase().includes(filters.location.toLowerCase()) && (!filters.type || property.type === filters.type) && (!filters.price || property.price < Number(filters.price)));
  if (sort !== 'featured') results.sort((a, b) => sort === 'price-low' ? a.price - b.price : b.price - a.price);
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setFilters({ location: String(data.get('location') || '').trim(), type: String(data.get('propertyType') || ''), price: String(data.get('priceRange') || '') });
  }
  function reset() { setFilters({ location: '', type: '', price: '' }); setSort('featured'); setFormKey((key) => key + 1); }
  return <>
    <section className="quick-search" id="search"><div className="container"><div className="search-container"><h2 className="search-title">Find your perfect home</h2>
      <form className="search-form" id="property-search-form" onSubmit={search} key={formKey}><div className="search-inputs">
        <div className="search-field"><label htmlFor="location">Location</label><input id="location" name="location" placeholder="Where do you want to live?" /></div>
        <div className="search-field"><label htmlFor="property-type">Property Type</label><select id="property-type" name="propertyType"><option value="">Any type</option><option value="apartment">Apartment</option><option value="house">House</option><option value="condo">Condo</option><option value="studio">Studio</option></select></div>
        <div className="search-field"><label htmlFor="price-range">Max Price</label><select id="price-range" name="priceRange"><option value="">Any price</option>{[1000, 2000, 3000, 5000].map((price) => <option key={price} value={price}>Under ${price.toLocaleString('en-US')}</option>)}</select></div>
        <button type="submit" className="btn btn-primary search-btn">🔍 Search</button>
      </div></form>
    </div></div></section>
    <section className="featured-properties" id="properties"><div className="container"><div className="section-header"><h2 className="section-title">Featured properties</h2><p className="section-subtitle">Discover amazing places to live, handpicked by our community</p><p>Demo listings — sample inventory, not live availability.</p></div>
      <div className="browser-filters"><p role="status">{results.length} sample properties found</p><label>Sort by <select aria-label="Sort properties" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
      <div className="properties-grid" id="properties-grid">{results.map((property) => <article className="property-card" key={property.id}>
        <div className="property-image">{property.badge && <div className={`property-badge badge-${property.badge.toLowerCase()}`}>{property.badge}</div>}<SafeImage src={property.image} alt={property.alt} className="property-img" loading="lazy" /></div>
        <div className="property-info"><div className="property-price">${property.price.toLocaleString('en-US')}<span>/month</span></div><h3 className="property-title"><button className="property-title-button" onClick={() => onSelect(property)}>{property.title}</button></h3><p className="property-location">{property.location}</p><div className="property-features">{property.features.map((feature) => <span className="feature" key={feature}>{feature}</span>)}</div><div className="property-rating"><span className="stars" aria-label="5 stars">⭐⭐⭐⭐⭐</span><span className="rating-text">{property.rating}</span></div></div>
      </article>)}</div>
      {results.length === 0 && <p className="empty-state">No sample properties match your search. Try another location or price.</p>}
      <div className="section-cta"><button className="btn btn-outline btn-large" id="view-all-properties-btn" onClick={reset}>View all properties</button></div>
    </div></section>
  </>;
}
