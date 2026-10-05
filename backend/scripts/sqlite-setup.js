const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, testConnection, closePool } = require('../config/database');

async function setup() {
  console.log('Setting up SQLite database...');
  const connected = testConnection();
  if (!connected) { console.error('Database connection failed'); process.exit(1); }

  console.log('Running migration...');
  const migrationSQL = fs.readFileSync(path.join(__dirname, '../migrations/sqlite_init.sql'), 'utf8');
  const statements = migrationSQL.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      try { query(stmt.trim()); } catch (e) { if (!e.message.includes('already exists')) console.error('Migration error:', e.message); }
    }
  }
  console.log('Migration complete');

  console.log('Seeding data...');
  const users = [
    { email: 'admin@housematters.com', password: 'password123', role: 'landlord', first_name: 'Admin', last_name: 'User' },
    { email: 'landlord@test.com', password: 'password123', role: 'landlord', first_name: 'Chidi', last_name: 'Okonkwo' },
    { email: 'tenant@test.com', password: 'password123', role: 'tenant', first_name: 'Amina', last_name: 'Bello' },
  ];

  const userIds = [];
  for (const u of users) {
    const id = uuidv4();
    const hash = await bcrypt.hash(u.password, 10);
    try {
      query('INSERT OR IGNORE INTO users (id, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)', [id, u.email, hash, u.role, u.first_name, u.last_name]);
      userIds.push({ id, ...u });
      console.log('  ' + u.email + ' (' + u.role + ')');
    } catch (e) {
      if (!e.message.includes('UNIQUE')) console.error('  ' + u.email + ': ' + e.message);
    }
  }

  const landlords = userIds.filter(u => u.role === 'landlord');
  const properties = [
    { title: 'Bright 2-bedroom flat', description: 'A beautiful two-bedroom apartment in Lekki with modern finishes.', address: '12 Admiralty Way', city: 'Lagos', state: 'Lagos', rent: 4500000, bedrooms: 2, bathrooms: 2, property_type: 'apartment' },
    { title: 'Cosy self-contained studio', description: 'Perfect for young professionals. Self-contained with kitchenette in Yaba.', address: '45 Herbert Macaulay Way', city: 'Lagos', state: 'Lagos', rent: 1200000, bedrooms: 1, bathrooms: 1, property_type: 'studio' },
    { title: 'Spacious family duplex', description: 'Large family duplex in Gwarinpa estate with 4 bedrooms.', address: '7 Gwarinpa Estate', city: 'Abuja', state: 'FCT', rent: 6500000, bedrooms: 4, bathrooms: 4, property_type: 'house' },
    { title: 'Contemporary city apartment', description: 'Modern apartment in Wuse 2 with dining area and city views.', address: '23 Wuse Zone 5', city: 'Abuja', state: 'FCT', rent: 5200000, bedrooms: 2, bathrooms: 2, property_type: 'apartment' },
    { title: 'A little more room to unwind', description: 'Three-bedroom flat in Ikeja GRA, perfect for families.', address: '8 Allen Avenue', city: 'Lagos', state: 'Lagos', rent: 3800000, bedrooms: 3, bathrooms: 3, property_type: 'apartment' },
    { title: 'A calm place to call home', description: 'Family home in Bodija with compound and good road access.', address: '15 Bodija Road', city: 'Ibadan', state: 'Oyo', rent: 2400000, bedrooms: 3, bathrooms: 2, property_type: 'house' },
  ];

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const landlord = landlords[i % landlords.length];
    const id = uuidv4();
    try {
      query('INSERT OR IGNORE INTO properties (id, landlord_id, title, description, address, city, state, rent, bedrooms, bathrooms, property_type, amenities, images, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)', [id, landlord.id, p.title, p.description, p.address, p.city, p.state, p.rent, p.bedrooms, p.bathrooms, p.property_type, '[]', '[]']);
      console.log('  ' + p.title);
    } catch (e) { console.error('  ' + p.title + ': ' + e.message); }
  }

  console.log('\nSetup complete!');
  console.log('Login: admin@housematters.com / password123');
  process.exit(0);
}

setup().catch(e => { console.error(e); process.exit(1); });