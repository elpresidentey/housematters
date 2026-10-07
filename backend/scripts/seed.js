#!/usr/bin/env node

/**
 * Database Seeder
 * Populates the database with sample data for development
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, transaction, testConnection, closePool } = require('../config/database');

// Sample data
const sampleUsers = [
  {
    email: 'john.landlord@example.com',
    password: 'password123',
    role: 'landlord',
    firstName: 'John',
    lastName: 'Smith',
    phone: '+1-555-0101',
    isVerified: true
  },
  {
    email: 'jane.landlord@example.com',
    password: 'password123',
    role: 'landlord',
    firstName: 'Jane',
    lastName: 'Johnson',
    phone: '+1-555-0102',
    isVerified: true
  },
  {
    email: 'mike.tenant@example.com',
    password: 'password123',
    role: 'tenant',
    firstName: 'Mike',
    lastName: 'Davis',
    phone: '+1-555-0201',
    isVerified: true
  },
  {
    email: 'sarah.tenant@example.com',
    password: 'password123',
    role: 'tenant',
    firstName: 'Sarah',
    lastName: 'Wilson',
    phone: '+1-555-0202',
    isVerified: true
  }
];

const sampleProperties = [
  {
    title: 'Modern 2BR Apartment in Downtown',
    description: 'Beautiful modern apartment with city views, updated kitchen, and in-unit laundry. Walking distance to restaurants, shopping, and public transportation.',
    address: '123 Main Street, Apt 4B',
    city: 'New York',
    state: 'NY',
    rent: 2500.00,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['parking', 'gym', 'pool', 'laundry', 'elevator'],
    latitude: 40.7128,
    longitude: -74.0060
  },
  {
    title: 'Cozy 1BR Studio Near University',
    description: 'Perfect for students or young professionals. Quiet neighborhood with easy access to campus and downtown. Recently renovated with modern appliances.',
    address: '456 College Avenue, Unit 2A',
    city: 'Boston',
    state: 'MA',
    rent: 1800.00,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['parking', 'internet', 'heating'],
    latitude: 42.3601,
    longitude: -71.0589
  },
  {
    title: 'Spacious 3BR Family Home',
    description: 'Large family home with backyard, garage, and updated kitchen. Great neighborhood with excellent schools. Perfect for families.',
    address: '789 Oak Street',
    city: 'Austin',
    state: 'TX',
    rent: 2200.00,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['parking', 'yard', 'garage', 'dishwasher', 'air_conditioning'],
    latitude: 30.2672,
    longitude: -97.7431
  },
  {
    title: 'Luxury 2BR Condo with Bay Views',
    description: 'Stunning luxury condominium with panoramic bay views. High-end finishes, concierge service, and resort-style amenities.',
    address: '321 Bay View Drive, Unit 15A',
    city: 'San Francisco',
    state: 'CA',
    rent: 4500.00,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['parking', 'gym', 'pool', 'concierge', 'elevator', 'balcony'],
    latitude: 37.7749,
    longitude: -122.4194
  }
];

// Hash password
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Seed users
async function seedUsers(client) {
  console.log('👥 Seeding users...');
  
  const userIds = [];
  
  for (const userData of sampleUsers) {
    const userId = uuidv4();
    const hashedPassword = await hashPassword(userData.password);
    
    await client.query(`
      INSERT INTO users (
        id, email, password_hash, role, first_name, last_name, 
        phone, is_verified, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (email) DO NOTHING
    `, [
      userId,
      userData.email,
      hashedPassword,
      userData.role,
      userData.firstName,
      userData.lastName,
      userData.phone,
      // The schema stores flags as INTEGER, so JS booleans have to be 0/1.
      userData.isVerified ? 1 : 0
    ]);
    
    userIds.push({ id: userId, role: userData.role, email: userData.email });
    console.log(`   ✅ Created user: ${userData.email} (${userData.role})`);
  }
  
  return userIds;
}

// Seed properties
async function seedProperties(client, userIds) {
  console.log('🏠 Seeding properties...');
  
  const landlords = userIds.filter(user => user.role === 'landlord');
  const propertyIds = [];
  
  for (let i = 0; i < sampleProperties.length; i++) {
    const propertyData = sampleProperties[i];
    const landlord = landlords[i % landlords.length]; // Distribute properties among landlords
    const propertyId = uuidv4();
    
    await client.query(`
      INSERT INTO properties (
        id, landlord_id, title, description, address, city, state,
        rent, bedrooms, bathrooms, amenities, latitude, longitude,
        is_available, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
    `, [
      propertyId,
      landlord.id,
      propertyData.title,
      propertyData.description,
      propertyData.address,
      propertyData.city,
      propertyData.state,
      propertyData.rent,
      propertyData.bedrooms,
      propertyData.bathrooms,
      // amenities is TEXT holding a JSON array, not a Postgres array.
      JSON.stringify(propertyData.amenities),
      propertyData.latitude,
      propertyData.longitude,
      1
    ]);
    
    propertyIds.push({ id: propertyId, landlordId: landlord.id, title: propertyData.title });
    console.log(`   ✅ Created property: ${propertyData.title} (Owner: ${landlord.email})`);
  }
  
  return propertyIds;
}

// Seed sample messages
async function seedMessages(client, userIds, propertyIds) {
  console.log('💬 Seeding messages...');
  
  const tenants = userIds.filter(user => user.role === 'tenant');
  const landlords = userIds.filter(user => user.role === 'landlord');
  
  const sampleMessages = [
    {
      content: 'Hi, I\'m interested in viewing this property. When would be a good time?',
      isRead: false
    },
    {
      content: 'Hello! I can show you the property this weekend. Are you available Saturday afternoon?',
      isRead: true
    },
    {
      content: 'Saturday afternoon works great for me. What time should I come by?',
      isRead: false
    }
  ];
  
  // Create a conversation between first tenant and first landlord about first property
  if (tenants.length > 0 && landlords.length > 0 && propertyIds.length > 0) {
    const tenant = tenants[0];
    const landlord = landlords[0];
    const property = propertyIds[0];
    
    for (let i = 0; i < sampleMessages.length; i++) {
      const message = sampleMessages[i];
      const isFromTenant = i % 2 === 0;
      
      await client.query(`
        INSERT INTO messages (
          id, sender_id, receiver_id, property_id, content, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${2 - i} hours')
      `, [
        uuidv4(),
        isFromTenant ? tenant.id : landlord.id,
        isFromTenant ? landlord.id : tenant.id,
        property.id,
        message.content,
        message.isRead ? 1 : 0
      ]);
    }
    
    console.log(`   ✅ Created conversation between ${tenant.email} and ${landlord.email}`);
  }
}

// Seed sample bookings
async function seedBookings(client, userIds, propertyIds) {
  console.log('📅 Seeding bookings...');
  
  const tenants = userIds.filter(user => user.role === 'tenant');
  
  if (tenants.length > 0 && propertyIds.length > 0) {
    const tenant = tenants[0];
    const property = propertyIds[0];
    
    // Create a confirmed booking for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 2 PM
    
    await client.query(`
      INSERT INTO bookings (
        id, tenant_id, property_id, requested_date, status, 
        notes, confirmed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [
      uuidv4(),
      tenant.id,
      property.id,
      tomorrow,
      'confirmed',
      'Looking forward to seeing the property!'
    ]);
    
    console.log(`   ✅ Created confirmed booking for ${tenant.email}`);
  }
}

// Seed sample reviews
async function seedReviews(client, userIds) {
  console.log('⭐ Seeding reviews...');
  
  const tenants = userIds.filter(user => user.role === 'tenant');
  const landlords = userIds.filter(user => user.role === 'landlord');
  
  if (tenants.length > 0 && landlords.length > 0) {
    const tenant = tenants[0];
    const landlord = landlords[0];
    
    // Tenant reviews landlord
    await client.query(`
      INSERT INTO reviews (
        id, reviewer_id, reviewee_id, rating, comment, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      uuidv4(),
      tenant.id,
      landlord.id,
      5,
      'Excellent landlord! Very responsive and the property was exactly as described.'
    ]);
    
    // Landlord reviews tenant
    await client.query(`
      INSERT INTO reviews (
        id, reviewer_id, reviewee_id, rating, comment, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      uuidv4(),
      landlord.id,
      tenant.id,
      4,
      'Great tenant, very respectful and took good care of the property.'
    ]);
    
    console.log(`   ✅ Created mutual reviews between ${tenant.email} and ${landlord.email}`);
  }
}

// Main seeding function
async function seedDatabase(options = {}) {
  const { force = false } = options;
  
  console.log('🌱 Starting database seeding...');
  console.log('================================');
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Check if data already exists
    if (!force) {
      const userCount = await query('SELECT COUNT(*) FROM users');
      if (parseInt(userCount.rows[0].count) > 0) {
        console.log('⚠️  Database already contains data. Use --force to reseed.');
        return false;
      }
    }
    
    // Run seeding in a transaction
    const result = await transaction(async (client) => {
      // Clear existing data if force mode
      if (force) {
        console.log('🗑️  Clearing existing data...');
        await client.query('TRUNCATE reviews, payments, bookings, messages, properties, users CASCADE');
      }
      
      // Seed data in order
      const userIds = await seedUsers(client);
      const propertyIds = await seedProperties(client, userIds);
      await seedMessages(client, userIds, propertyIds);
      await seedBookings(client, userIds, propertyIds);
      await seedReviews(client, userIds);
      
      return { userIds, propertyIds };
    });
    
    console.log('\n📊 Seeding Summary:');
    console.log('===================');
    console.log(`👥 Users: ${result.userIds.length}`);
    console.log(`🏠 Properties: ${result.propertyIds.length}`);
    console.log(`💬 Sample messages and bookings created`);
    console.log(`⭐ Sample reviews created`);
    console.log('\n🎉 Database seeding completed successfully!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    return false;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force')
  };
  
  try {
    if (args.includes('--help')) {
      console.log(`
Database Seeder

Usage:
  npm run seed [options]

Options:
  --force    Clear existing data and reseed
  --help     Show this help message

Examples:
  npm run seed
  npm run seed --force
      `);
      return;
    }
    
    const success = await seedDatabase(options);
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Seeder error:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  seedDatabase,
  seedUsers,
  seedProperties
};