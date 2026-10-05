const { query, transaction, testConnection, healthCheck, closePool } = require('../config/database');

describe('Database Connection', () => {
  afterAll(async () => {
    await closePool();
  });

  test('should connect to database', async () => {
    const connected = await testConnection();
    expect(connected).toBe(true);
  });

  test('should perform health check', async () => {
    const health = await healthCheck();
    expect(health.status).toBe('healthy');
    expect(health.connected).toBe(true);
    expect(health.timestamp).toBeDefined();
  });

  test('should execute simple query', async () => {
    const result = await query('SELECT 1 as test_value');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].test_value).toBe(1);
  });

  test('should handle parameterized queries', async () => {
    const testValue = 'test_string';
    const result = await query('SELECT $1 as test_param', [testValue]);
    expect(result.rows[0].test_param).toBe(testValue);
  });

  test('should handle query errors gracefully', async () => {
    await expect(query('SELECT * FROM nonexistent_table')).rejects.toThrow();
  });
});

describe('Database Transactions', () => {
  afterAll(async () => {
    await closePool();
  });

  test('should execute successful transaction', async () => {
    const result = await transaction(async (client) => {
      const result1 = await client.query('SELECT 1 as value');
      const result2 = await client.query('SELECT 2 as value');
      return { first: result1.rows[0].value, second: result2.rows[0].value };
    });

    expect(result.first).toBe(1);
    expect(result.second).toBe(2);
  });

  test('should rollback failed transaction', async () => {
    await expect(
      transaction(async (client) => {
        await client.query('SELECT 1');
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');
  });
});

describe('Database Schema', () => {
  afterAll(async () => {
    await closePool();
  });

  test('should have users table', async () => {
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    expect(result.rows.length).toBeGreaterThan(0);
    
    const columns = result.rows.map(row => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('email');
    expect(columns).toContain('password_hash');
    expect(columns).toContain('role');
    expect(columns).toContain('first_name');
    expect(columns).toContain('last_name');
  });

  test('should have properties table', async () => {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'properties'
      ORDER BY ordinal_position
    `);

    expect(result.rows.length).toBeGreaterThan(0);
    
    const columns = result.rows.map(row => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('landlord_id');
    expect(columns).toContain('title');
    expect(columns).toContain('rent');
    expect(columns).toContain('bedrooms');
    expect(columns).toContain('bathrooms');
  });

  test('should have messages table', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'messages'
    `);

    const columns = result.rows.map(row => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('sender_id');
    expect(columns).toContain('receiver_id');
    expect(columns).toContain('content');
  });

  test('should have bookings table', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bookings'
    `);

    const columns = result.rows.map(row => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('tenant_id');
    expect(columns).toContain('property_id');
    expect(columns).toContain('status');
  });

  test('should have payments table', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'payments'
    `);

    const columns = result.rows.map(row => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('tenant_id');
    expect(columns).toContain('landlord_id');
    expect(columns).toContain('amount');
    expect(columns).toContain('status');
  });

  test('should have reviews table', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'reviews'
    `);

    const columns = result.rows.map(row => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('reviewer_id');
    expect(columns).toContain('reviewee_id');
    expect(columns).toContain('rating');
  });

  test('should have proper foreign key constraints', async () => {
    const result = await query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('properties', 'messages', 'bookings', 'payments', 'reviews')
    `);

    expect(result.rows.length).toBeGreaterThan(0);
    
    // Check that properties references users
    const propertyConstraints = result.rows.filter(row => 
      row.table_name === 'properties' && row.foreign_table_name === 'users'
    );
    expect(propertyConstraints.length).toBeGreaterThan(0);
  });
});

describe('Database Indexes', () => {
  afterAll(async () => {
    await closePool();
  });

  test('should have proper indexes on users table', async () => {
    const result = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'users'
        AND indexname LIKE 'idx_%'
    `);

    const indexNames = result.rows.map(row => row.indexname);
    expect(indexNames).toContain('idx_users_email');
    expect(indexNames).toContain('idx_users_role');
  });

  test('should have proper indexes on properties table', async () => {
    const result = await query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'properties'
        AND indexname LIKE 'idx_%'
    `);

    const indexNames = result.rows.map(row => row.indexname);
    expect(indexNames).toContain('idx_properties_landlord_id');
    expect(indexNames).toContain('idx_properties_city');
    expect(indexNames).toContain('idx_properties_rent');
  });
});