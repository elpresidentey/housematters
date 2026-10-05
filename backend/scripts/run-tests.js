#!/usr/bin/env node
const axios = require('axios');
const config = require('../config/test.config');
const setupTestDatabase = require('./setup-test-db');

// Test suites
const authTests = require('../tests/auth.test');
const propertyTests = require('../tests/property.test');
const bookingTests = require('../tests/booking.test');
const messageTests = require('../tests/message.test');
const uploadTests = require('../tests/upload.test');

let authToken = null;

async function runTests() {
    console.log('🚀 Starting House Matters API Tests');
    console.log('=====================================');

    try {
        // Setup test database
        console.log('Setting up test database...');
        await setupTestDatabase();
        console.log('Test database setup complete!\n');

        // Health check
        console.log('Running health check...');
        await testEndpoint('GET', '/health', null, 'Health Check');

        // Run test suites
        console.log('\nRunning Authentication Tests...');
        authToken = await authTests.run();

        console.log('\nRunning Property Tests...');
        await propertyTests.run(authToken);

        console.log('\nRunning Booking Tests...');
        await bookingTests.run(authToken);

        console.log('\nRunning Message Tests...');
        await messageTests.run(authToken);

        console.log('\nRunning Upload Tests...');
        await uploadTests.run(authToken);

        console.log('\n✨ All tests completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Tests failed:', error);
        process.exit(1);
    }
}

async function testEndpoint(method, endpoint, data = null, description = '') {
    try {
        console.log(`\n🧪 Testing: ${description || `${method.toUpperCase()} ${endpoint}`}`);
        
        const config = {
            method: method.toLowerCase(),
            url: `${BASE_URL}${endpoint}`,
            timeout: 5000
        };
        
        if (data) {
            config.data = data;
            config.headers = { 'Content-Type': 'application/json' };
        }

        if (authToken) {
            config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${authToken}`
            };
        }
        
        const response = await axios(config);
        console.log(`✅ Status: ${response.status}`);
        console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
        
        return response;
    } catch (error) {
        if (error.response) {
            console.log(`❌ Status: ${error.response.status}`);
            console.log(`📄 Error Response:`, JSON.stringify(error.response.data, null, 2));
            throw error;
        } else {
            console.log(`❌ Error: ${error.message}`);
            throw error;
        }
    }
}

// Only run if called directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testEndpoint,
    config
};