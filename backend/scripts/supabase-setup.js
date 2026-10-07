require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool, query, closePool } = require('../config/database');

async function setup() {
  console.log('Supabase setup: creating schema...');
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_supabase.sql'), 'utf8');
  await pool.query(sql); // simple protocol: multi-statement, no params
  console.log('Schema created.');

  console.log('Seeding users...');
  const users = [
    { email: 'admin@housematters.com', password: 'password123', role: 'landlord', first_name: 'Admin', last_name: 'User' },
    { email: 'landlord@test.com', password: 'password123', role: 'landlord', first_name: 'Chidi', last_name: 'Okonkwo' },
    { email: 'tenant@test.com', password: 'password123', role: 'tenant', first_name: 'Amina', last_name: 'Bello' },
  ];
  const landlordIds = [];
  for (const u of users) {
    const id = uuidv4();
    const hash = await bcrypt.hash(u.password, 10);
    await query(
      'INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (email) DO NOTHING',
      [id, u.email, hash, u.role, u.first_name, u.last_name]
    );
    const row = await query('SELECT id, role FROM users WHERE email = ?', [u.email]);
    if (row.rows[0] && row.rows[0].role === 'landlord') landlordIds.push(row.rows[0].id);
    console.log('  ' + u.email + ' (' + u.role + ')');
  }

  const existingProps = await query('SELECT COUNT(*) AS c FROM properties');
  if (Number(existingProps.rows[0].c) > 0) {
    console.log('Properties already exist, skipping seed.');
  } else {
    console.log('Seeding properties...');
    const properties = [
    ['Bright 2-bedroom flat', 'A beautiful two-bedroom apartment in Lekki with modern finishes.', '12 Admiralty Way', 'Lagos', 'Lagos', 4500000, 2, 2, 'apartment'],
    ['Cosy self-contained studio', 'Perfect for young professionals. Self-contained with kitchenette in Yaba.', '45 Herbert Macaulay Way', 'Lagos', 'Lagos', 1200000, 1, 1, 'studio'],
    ['Spacious family duplex', 'Large family duplex in Gwarinpa estate with 4 bedrooms.', '7 Gwarinpa Estate', 'Abuja', 'FCT', 6500000, 4, 4, 'house'],
    ['Contemporary city apartment', 'Modern apartment in Wuse 2 with dining area and city views.', '23 Wuse Zone 5', 'Abuja', 'FCT', 5200000, 2, 2, 'apartment'],
    ['A little more room to unwind', 'Three-bedroom flat in Ikeja GRA, perfect for families.', '8 Allen Avenue', 'Lagos', 'Lagos', 3800000, 3, 3, 'apartment'],
    ['A calm place to call home', 'Family home in Bodija with compound and good road access.', '15 Bodija Road', 'Ibadan', 'Oyo', 2400000, 3, 2, 'house'],
  ];
  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const landlordId = landlordIds[i % landlordIds.length];
    await query(
      `INSERT INTO properties (
         id, landlord_id, title, description, address, city, state, rent,
         bedrooms, bathrooms, property_type, price, amenities, images,
         active, is_available, moderation_status, expires_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', 1, 1, 'approved', now() + interval '90 days')`,
      [uuidv4(), landlordId, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[5]]
    );
    console.log('  ' + p[0]);
  }
  }
  console.log('Setup complete.');
  await closePool();
  process.exit(0);
}

setup().catch((e) => { console.error(e); process.exit(1); });
