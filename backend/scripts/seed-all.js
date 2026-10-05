const { query, testConnection, closePool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function seedAll() {
  testConnection();
  console.log('Seeding all 19 properties...');

  // Get landlord IDs
  const users = query("SELECT id, email FROM users WHERE role = 'landlord'");
  const landlords = users.rows;

  // Clear existing properties
  query('DELETE FROM properties');
  console.log('Cleared existing properties.');

  const properties = [
    { title: 'Bright 2-bedroom flat', price: 4500000, location: 'Lekki Phase 1, Lagos', city: 'Lagos', state: 'Lagos', type: 'apartment', bedrooms: 2, bathrooms: 2, features: ['2 bedrooms', '2 bathrooms', 'Balcony'], badge: 'Featured', description: 'A sample two-bedroom layout for your Lekki home search. Ask about service charges, power arrangements, water supply and parking during an inspection.', image: '/images/living-room.jpg' },
    { title: 'Cosy self-contained studio', price: 1200000, location: 'Yaba, Lagos', city: 'Lagos', state: 'Lagos', type: 'studio', bedrooms: 1, bathrooms: 1, features: ['Self-contained', '1 bathroom', 'Kitchenette'], badge: 'Compact living', description: 'An example of a self-contained home for independent living. Confirm the exact street, transport options, water supply and all move-in costs before committing.', image: '/images/apartment.jpg' },
    { title: 'Spacious family duplex', price: 6500000, location: 'Gwarinpa, Abuja', city: 'Abuja', state: 'FCT', type: 'house', bedrooms: 4, bathrooms: 4, features: ['4 bedrooms', '4 bathrooms', 'Parking'], badge: 'Family pick', description: 'A sample family duplex for your Abuja search. Check estate rules, security arrangements, drainage and maintenance responsibilities with the owner.', image: '/images/home-exterior.jpg' },
    { title: 'A little more room to unwind', price: 3800000, location: 'Ikeja GRA, Lagos', city: 'Lagos', state: 'Lagos', type: 'apartment', bedrooms: 3, bathrooms: 3, features: ['3 bedrooms', '3 bathrooms', 'Living room'], description: 'An illustrative three-bedroom flat. Discuss commute times, electricity metering and any separate estate or service charges before arranging a tenancy.', image: '/images/bedroom.jpg' },
    { title: 'Contemporary city apartment', price: 5200000, location: 'Wuse 2, Abuja', city: 'Abuja', state: 'FCT', type: 'apartment', bedrooms: 2, bathrooms: 2, features: ['2 bedrooms', '2 bathrooms', 'Dining area'], description: 'A sample city apartment to help compare layouts and budgets. Confirm what is included in the quoted annual rent and request a written breakdown of other costs.', image: '/images/living-room.jpg' },
    { title: 'A calm place to call home', price: 2400000, location: 'Bodija, Ibadan', city: 'Ibadan', state: 'Oyo', type: 'house', bedrooms: 3, bathrooms: 2, features: ['3 bedrooms', '2 bathrooms', 'Compound'], badge: 'Family pick', description: 'An example family home for a Bodija search. Inspect the compound, access road, drainage and water storage, and confirm who handles repairs.', image: '/images/home-exterior.jpg' },
    { title: 'Light-filled 3-bedroom flat', price: 3200000, location: 'GRA Phase 2, Port Harcourt', city: 'Port Harcourt', state: 'Rivers', type: 'apartment', bedrooms: 3, bathrooms: 3, features: ['3 bedrooms', '3 bathrooms', 'Balcony'], description: 'A sample three-bedroom flat. Visit the neighbourhood, ask about flooding and power supply, and verify the person authorised to let the property.', image: '/images/apartment.jpg' },
    { title: 'Your own comfortable corner', price: 850000, location: 'Independence Layout, Enugu', city: 'Enugu', state: 'Enugu', type: 'studio', bedrooms: 1, bathrooms: 1, features: ['Self-contained', '1 bathroom', 'Kitchenette'], description: 'An example self-contained home for a smaller household. Check ventilation, water access and the total initial payment, not only the annual rent.', image: '/images/bedroom.jpg' },
    { title: 'Room for the whole family', price: 4000000, location: 'Ajah, Lagos', city: 'Lagos', state: 'Lagos', type: 'house', bedrooms: 4, bathrooms: 4, features: ['4 bedrooms', '4 bathrooms', 'Parking'], description: 'A sample duplex for an Ajah search. Visit at different times to assess traffic and ask about drainage, estate charges and electricity arrangements.', image: '/images/home-exterior.jpg' },
    { title: 'Simple, spacious everyday living', price: 1800000, location: 'Nassarawa GRA, Kano', city: 'Kano', state: 'Kano', type: 'apartment', bedrooms: 2, bathrooms: 2, features: ['2 bedrooms', '2 bathrooms', 'Living room'], description: 'An example two-bedroom flat. Inspect in person, confirm ownership or authority to let, and agree rent, repairs and any additional charges in writing.', image: '/images/living-room.jpg' },
    { title: 'Waterfront penthouse with jetty views', price: 85000000, location: 'Banana Island, Ikoyi, Lagos', city: 'Lagos', state: 'Lagos', type: 'apartment', bedrooms: 4, bathrooms: 5, features: ['4 bedrooms', '5 bathrooms', 'Private jetty', 'Smart home'], badge: 'Luxury', description: 'An illustrative penthouse in Nigeria\'s most exclusive enclave. Verify service charges, security arrangements, facility management terms and jetty access rights before committing.', image: '/images/penthouse.jpg' },
    { title: 'Designer condo off Bourdillon', price: 45000000, location: 'Ikoyi, Lagos', city: 'Lagos', state: 'Lagos', type: 'apartment', bedrooms: 3, bathrooms: 4, features: ['3 bedrooms', '4 bathrooms', 'Gym & pool', 'Concierge'], badge: 'Luxury', description: 'A sample premium condo for an Ikoyi search. Confirm facility fees, generator and power arrangements, and the estate\'s rental policy with the developer\'s representatives.', image: '/images/luxury-condo.jpg' },
    { title: 'Skyline residence above the Island', price: 95000000, location: 'Adeola Odeku, Victoria Island, Lagos', city: 'Lagos', state: 'Lagos', type: 'apartment', bedrooms: 4, bathrooms: 5, features: ['4 bedrooms', '5 bathrooms', 'Rooftop lounge', 'Panoramic views'], badge: 'Luxury', description: 'A sample high-rise residence with skyline views. Confirm elevator service, power redundancy, parking allocation and the full breakdown of annual service charges.', image: '/images/skyline-villa.jpg' },
    { title: 'Architect-designed smart villa', price: 60000000, location: 'Oniru, Victoria Island, Lagos', city: 'Lagos', state: 'Lagos', type: 'house', bedrooms: 5, bathrooms: 6, features: ['5 bedrooms', '6 bathrooms', 'Home cinema', 'Staff quarters'], badge: 'Luxury', description: 'An illustrative smart villa for a Victoria Island search. Ask about drainage, security protocols, estate charges and what the quoted rent includes.', image: '/images/modern-villa.jpg' },
    { title: 'Ambassadorial hilltop mansion', price: 70000000, location: 'Maitama, Abuja', city: 'Abuja', state: 'FCT', type: 'house', bedrooms: 6, bathrooms: 7, features: ['6 bedrooms', '7 bathrooms', 'Swimming pool', 'Guest chalet'], badge: 'Luxury', description: 'An illustrative Maitama mansion for diplomatic-scale living. Verify security arrangements, estate rules, maintenance responsibilities and payment terms in writing.', image: '/images/hilltop-villa.jpg' },
    { title: 'Serene garden villa near Aso Rock', price: 55000000, location: 'Asokoro, Abuja', city: 'Abuja', state: 'FCT', type: 'house', bedrooms: 5, bathrooms: 6, features: ['5 bedrooms', '6 bathrooms', 'Landscaped gardens', 'Borehole & solar'], badge: 'Luxury', description: 'A sample garden villa in a serene Asokoro setting. Ask about solar and water infrastructure, security, and who handles landscape and facility maintenance.', image: '/images/garden-villa.jpg' },
    { title: 'Contemporary smart townhouse', price: 35000000, location: 'Guzape District, Abuja', city: 'Abuja', state: 'FCT', type: 'house', bedrooms: 4, bathrooms: 5, features: ['4 bedrooms', '5 bathrooms', 'Home automation', 'Terrace'], badge: 'Luxury', description: 'An illustrative smart townhouse in the growing Guzape district. Confirm road access, estate development status, service charges and handover condition before paying.', image: '/images/townhouse.jpg' },
    { title: 'Lakeside residence with water views', price: 28000000, location: 'Jabi, Abuja', city: 'Abuja', state: 'FCT', type: 'apartment', bedrooms: 3, bathrooms: 4, features: ['3 bedrooms', '4 bathrooms', 'Lake view', 'Gym & pool'], badge: 'Luxury', description: 'A sample lakeside apartment near Jabi Lake. Verify facility management quality, power and water reliability, parking and all fees beyond the quoted rent.', image: '/images/luxury-condo.jpg' },
  ];

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const landlord = landlords[i % landlords.length];
    const id = uuidv4();
    try {
      query('INSERT OR IGNORE INTO properties (id, landlord_id, title, description, address, city, state, rent, bedrooms, bathrooms, property_type, amenities, images, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)', [id, landlord.id, p.title, p.description, p.location, p.city, p.state, p.price, p.bedrooms, p.bathrooms, p.type, JSON.stringify(p.features), JSON.stringify(p.image ? [p.image] : [])]);
      console.log('  ' + (i+1) + '. ' + p.title);
    } catch (e) { console.error('  FAIL: ' + p.title + ': ' + e.message); }
  }

  const total = query('SELECT COUNT(*) as count FROM properties');
  console.log('Done! Total properties: ' + total.rows[0].count);
  process.exit(0);
}

seedAll().catch(e => { console.error(e); process.exit(1); });