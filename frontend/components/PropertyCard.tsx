'use client';

import SafeImage from './SafeImage';
import { formatNaira, type Property } from '../lib/properties';
import { factsFor } from '../lib/cardFacts';
import { BedIcon, BathIcon, AreaIcon, LocationIcon } from './Icons';

/**
 * PropertyCard — the single card used everywhere (featured rail + listing
 * grid). Same anatomy, same classes, same facts on every card:
 * media (tenure + badge + save) / body (price, title, location, specs, CTA).
 */
export default function PropertyCard({
  property,
  variant = 'listing',
  saved,
  onSelect,
  onToggleSaved,
}: {
  property: Property;
  variant?: 'featured' | 'listing';
  saved?: boolean;
  onSelect: () => void;
  onToggleSaved?: () => void;
}) {
  const facts = factsFor(property);
  const luxury = property.badge === 'Luxury';
  const articleClass = `property-card${variant === 'featured' ? ' property-card-featured' : ''}${luxury ? ' property-card-luxury' : ''}`;

  return (
    <article className={articleClass}>
      <div className="property-image" data-cursor="View">
        <button
          type="button"
          className="property-image-btn"
          onClick={onSelect}
          aria-label={`View details for ${property.title}`}
        >
          <SafeImage src={property.image} alt={property.alt} className="property-img" width={800} height={600} loading="lazy" />
        </button>
        <span className="property-tenure" aria-hidden="true">{facts.tenure}</span>
        {property.badge && (
          <span className={`property-badge${luxury ? ' property-badge-luxury' : ''}`} aria-hidden="true">{property.badge}</span>
        )}
        <span className="photo-disclosure" aria-hidden="true">Illustrative photo</span>
        {onToggleSaved && (
          <button
            type="button"
            className={`save-heart${saved ? ' saved' : ''}`}
            aria-pressed={!!saved}
            aria-label={saved ? `Remove ${property.title} from saved homes` : `Save ${property.title}`}
            onClick={(e) => { e.stopPropagation(); onToggleSaved(); }}
          >
            <span aria-hidden="true">♥</span>
          </button>
        )}
      </div>
      <div className="property-info">
        <div className="property-price">{formatNaira(property.price)} <span>/ year</span></div>
        <h3 className="property-title">{property.title} <span aria-hidden="true">↗</span></h3>
        <p className="property-location"><LocationIcon className="location-icon" size={14} /> {property.location}</p>
        <div className="property-specs" aria-label="Key facts">
          {facts.beds === 'Studio'
            ? <span className="spec-item"><strong>Studio</strong></span>
            : <span className="spec-item"><BedIcon className="spec-icon" size={14} /> <strong>{facts.beds}</strong> Beds</span>}
          <span className="spec-item"><BathIcon className="spec-icon" size={14} /> <strong>{facts.baths}</strong> {facts.baths === '1' ? 'Bath' : 'Baths'}</span>
          <span className="spec-item"><AreaIcon className="spec-icon" size={14} /> <strong>{facts.area}</strong></span>
        </div>
        <button type="button" className="property-explore" onClick={onSelect}>
          Explore <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
