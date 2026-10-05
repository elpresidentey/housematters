# Database Setup and Management

This document describes the database setup, schema, and management tools for the House Matters platform.

## Overview

The House Matters platform uses PostgreSQL as its primary database with the following features:

- **Connection Pooling**: Efficient connection management using pg Pool
- **Migrations**: Version-controlled schema changes
- **Seeding**: Sample data for development
- **Health Monitoring**: Database health checks and monitoring
- **Transactions**: ACID compliance for data integrity

## Prerequisites

- PostgreSQL 12 or higher
- Node.js 16 or higher
- Database user with CREATE privileges

## Quick Start

1. **Create Database**
   ```bash
   createdb house_matters
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run Migrations and Seed Data**
   ```bash
   npm run db:setup
   ```

## Environment Variables

Configure these variables in your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=house_matters
DB_USER=your_username
DB_PASSWORD=your_password
```

## Database Schema

### Core Tables

#### Users Table
Stores user authentication and profile information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('landlord', 'tenant')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_image TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    -- ... additional fields
);
```

#### Properties Table
Stores rental property listings.

```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY,
    landlord_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    rent DECIMAL(10,2) NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    amenities TEXT[],
    images TEXT[],
    -- ... additional fields
);
```

#### Messages Table
Stores communication between users.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    -- ... timestamps
);
```

#### Bookings Table
Stores property viewing appointments.

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    requested_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    -- ... additional fields
);
```

#### Payments Table
Stores payment transactions.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES users(id),
    landlord_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('deposit', 'rent', 'refund')),
    status VARCHAR(20) DEFAULT 'pending',
    payment_gateway VARCHAR(20),
    -- ... additional fields
);
```

#### Reviews Table
Stores user ratings and reviews.

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    reviewer_id UUID REFERENCES users(id),
    reviewee_id UUID REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    -- ... additional fields
);
```

## Migration System

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate status

# Force re-run failed migrations
npm run migrate run --force
```

### Creating New Migrations

1. Create a new SQL file in `migrations/` directory
2. Use numeric prefix for ordering: `008_add_new_feature.sql`
3. Include descriptive comments and rollback instructions

Example migration:
```sql
-- Migration: Add property favorites
-- Created: 2025-01-01
-- Description: Allow users to favorite properties

CREATE TABLE property_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, property_id)
);

CREATE INDEX idx_property_favorites_user_id ON property_favorites(user_id);
CREATE INDEX idx_property_favorites_property_id ON property_favorites(property_id);
```

### Migration Best Practices

- Always include descriptive comments
- Use transactions for complex migrations
- Create appropriate indexes
- Include rollback instructions in comments
- Test migrations on development data first

## Seeding System

### Running Seeds

```bash
# Seed empty database
npm run seed

# Force reseed (clears existing data)
npm run seed --force

# Complete database setup
npm run db:setup
```

### Sample Data

The seeder creates:
- 4 sample users (2 landlords, 2 tenants)
- 4 sample properties
- Sample messages and conversations
- Sample bookings and reviews

## Database Operations

### Connection Management

```javascript
const { query, transaction, getClient } = require('./config/database');

// Simple query
const users = await query('SELECT * FROM users WHERE role = $1', ['tenant']);

// Transaction
const result = await transaction(async (client) => {
    await client.query('INSERT INTO users ...');
    await client.query('INSERT INTO properties ...');
    return { success: true };
});

// Manual client management
const client = await getClient();
try {
    await client.query('BEGIN');
    // ... operations
    await client.query('COMMIT');
} finally {
    client.release();
}
```

### Health Monitoring

```javascript
const { healthCheck } = require('./config/database');

const health = await healthCheck();
console.log(health);
// {
//   status: 'healthy',
//   connected: true,
//   timestamp: '2025-01-01T12:00:00.000Z'
// }
```

## Performance Optimization

### Indexes

The schema includes optimized indexes for:
- User lookups by email and role
- Property searches by location, price, and features
- Message conversations and read status
- Payment history and status
- Review aggregations

### Query Optimization

- Use parameterized queries to prevent SQL injection
- Implement connection pooling for concurrent requests
- Use transactions for multi-table operations
- Monitor slow queries and optimize as needed

### Full-Text Search

Properties table includes full-text search capability:

```sql
-- Search properties by title and description
SELECT * FROM properties 
WHERE to_tsvector('english', title || ' ' || description) 
@@ plainto_tsquery('english', 'modern apartment downtown');
```

## Backup and Recovery

### Development Backup

```bash
# Create backup
pg_dump house_matters > backup.sql

# Restore backup
psql house_matters < backup.sql
```

### Production Considerations

- Implement automated daily backups
- Test restore procedures regularly
- Monitor disk space and performance
- Use read replicas for scaling

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check PostgreSQL is running
   - Verify connection parameters in `.env`
   - Check firewall settings

2. **Migration Failures**
   - Check database permissions
   - Review migration SQL syntax
   - Use `npm run migrate status` to check state

3. **Performance Issues**
   - Monitor connection pool usage
   - Check for missing indexes
   - Analyze slow query logs

### Debugging

Enable query logging in development:
```env
NODE_ENV=development
```

This will log all database queries with execution times.

## Testing

Run database tests:
```bash
npm test -- tests/database.test.js
```

The test suite verifies:
- Database connectivity
- Schema integrity
- Index presence
- Foreign key constraints
- Transaction handling

## Security

### Best Practices

- Use environment variables for credentials
- Enable SSL in production
- Implement proper user permissions
- Regular security updates
- Monitor for suspicious activity

### Data Protection

- Passwords are hashed using bcrypt
- Sensitive data is encrypted at rest
- Audit trails for critical operations
- GDPR compliance features

## Monitoring

### Health Checks

The `/health` endpoint includes database status:
```json
{
  "status": "OK",
  "database": {
    "status": "healthy",
    "connected": true,
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

### Metrics to Monitor

- Connection pool utilization
- Query execution times
- Error rates
- Database size growth
- Index usage statistics