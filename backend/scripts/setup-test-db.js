const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/test.config');

async function setupTestDatabase() {
    // Create a connection to create/drop test database
    const setupPool = new Pool({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: 'postgres' // Connect to default database first
    });

    try {
        // Drop test database if it exists
        await setupPool.query(`
            DROP DATABASE IF EXISTS ${config.database.database}
            WITH (FORCE)
        `);

        // Create test database
        await setupPool.query(`
            CREATE DATABASE ${config.database.database}
            WITH OWNER = ${config.database.user}
            ENCODING = 'UTF8'
            LC_COLLATE = 'en_US.utf8'
            LC_CTYPE = 'en_US.utf8'
            TEMPLATE = template0
        `);

        console.log(`✅ Test database '${config.database.database}' created successfully`);
    } catch (error) {
        console.error('❌ Error creating test database:', error);
        throw error;
    } finally {
        await setupPool.end();
    }

    // Connect to the test database and run migrations
    const testPool = new Pool(config.database);

    try {
        // Read and execute migration files in order
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files
            .filter(file => file.endsWith('.sql'))
            .sort(); // Ensure migrations run in order

        for (const file of migrationFiles) {
            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, 'utf8');
            
            console.log(`⚙️ Running migration: ${file}`);
            await testPool.query(sql);
            console.log(`✅ Migration ${file} completed`);
        }

        console.log('✨ All migrations completed successfully');

        // Insert test data
        await insertTestData(testPool);

        console.log('✨ Test data inserted successfully');
    } catch (error) {
        console.error('❌ Error running migrations:', error);
        throw error;
    } finally {
        await testPool.end();
    }
}

async function insertTestData(pool) {
    const { testUsers, testData } = config;

    // Insert test users
    for (const [role, user] of Object.entries(testUsers)) {
        await pool.query(`
            INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
            VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5, NOW(), NOW())
        `, [user.email, user.password, user.firstName, user.lastName, user.role]);
    }

    // Insert test properties
    for (let i = 0; i < 10; i++) {
        const location = testData.locations[Math.floor(Math.random() * testData.locations.length)];
        const propertyType = testData.propertyTypes[Math.floor(Math.random() * testData.propertyTypes.length)];
        const amenities = testData.amenities
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * 6) + 3);

        await pool.query(`
            INSERT INTO properties (
                title,
                description,
                address,
                city,
                state,
                rent,
                bedrooms,
                bathrooms,
                amenities,
                property_type,
                is_available,
                latitude,
                longitude,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                $12, $13, NOW(), NOW()
            )
        `, [
            `Test Property ${i + 1}`,
            `A beautiful ${propertyType} in ${location.city}`,
            `${Math.floor(Math.random() * 9999) + 1} Test Street`,
            location.city,
            location.state,
            Math.floor(Math.random() * 3000) + 1000,
            Math.floor(Math.random() * 4) + 1,
            Math.floor(Math.random() * 3) + 1,
            amenities,
            propertyType,
            true,
            (Math.random() * 180) - 90,
            (Math.random() * 360) - 180
        ]);
    }
}

// Run if called directly
if (require.main === module) {
    setupTestDatabase()
        .then(() => {
            console.log('✅ Test environment setup completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error setting up test environment:', error);
            process.exit(1);
        });
}

module.exports = setupTestDatabase;