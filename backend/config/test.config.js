// Test environment configuration
module.exports = {
    // Server configuration
    server: {
        port: process.env.TEST_PORT || 3001,
        host: process.env.TEST_HOST || 'localhost',
        baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3001',
        jwtSecret: process.env.TEST_JWT_SECRET || 'test-secret-key'
    },

    // Database configuration for testing
    database: {
        host: process.env.TEST_DB_HOST || 'localhost',
        port: process.env.TEST_DB_PORT || 5432,
        database: process.env.TEST_DB_NAME || 'house_matters_test',
        user: process.env.TEST_DB_USER || 'postgres',
        password: process.env.TEST_DB_PASSWORD || 'postgres',
        ssl: process.env.TEST_DB_SSL === 'true',
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    },

    // S3 storage configuration for testing
    storage: {
        bucket: process.env.TEST_S3_BUCKET || 'house-matters-test',
        region: process.env.TEST_S3_REGION || 'us-east-1',
        accessKeyId: process.env.TEST_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.TEST_AWS_SECRET_ACCESS_KEY
    },

    // Email configuration for testing
    email: {
        from: process.env.TEST_EMAIL_FROM || 'test@housematters.com',
        smtp: {
            host: process.env.TEST_SMTP_HOST || 'smtp.mailtrap.io',
            port: process.env.TEST_SMTP_PORT || 2525,
            auth: {
                user: process.env.TEST_SMTP_USER,
                pass: process.env.TEST_SMTP_PASS
            }
        }
    },

    // Test user accounts
    testUsers: {
        tenant: {
            email: 'test.tenant@example.com',
            password: 'Test123!@#',
            firstName: 'Test',
            lastName: 'Tenant',
            role: 'tenant'
        },
        landlord: {
            email: 'test.landlord@example.com',
            password: 'Test123!@#',
            firstName: 'Test',
            lastName: 'Landlord',
            role: 'landlord'
        },
        admin: {
            email: 'test.admin@example.com',
            password: 'Test123!@#',
            firstName: 'Test',
            lastName: 'Admin',
            role: 'admin'
        }
    },

    // Test data configuration
    testData: {
        propertyTypes: ['house', 'apartment', 'condo', 'townhouse', 'studio'],
        amenities: [
            'parking',
            'pool',
            'gym',
            'elevator',
            'security',
            'furnished',
            'pets_allowed',
            'air_conditioning',
            'heating',
            'washer_dryer',
            'dishwasher'
        ],
        locations: [
            { city: 'New York', state: 'NY' },
            { city: 'Los Angeles', state: 'CA' },
            { city: 'Chicago', state: 'IL' },
            { city: 'Houston', state: 'TX' },
            { city: 'Miami', state: 'FL' }
        ]
    }
};