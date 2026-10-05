const { testEndpoint, config } = require('../scripts/run-tests');

async function run() {
    const { testUsers } = config;
    let authToken = null;

    // Test user registration
    console.log('\n🧪 Testing user registration...');
    const registrationData = {
        email: 'new.user@example.com',
        password: 'Test123!@#',
        firstName: 'New',
        lastName: 'User',
        role: 'tenant'
    };

    await testEndpoint('POST', '/api/auth/register', registrationData, 'User Registration');

    // Test user login
    console.log('\n🧪 Testing user login...');
    const loginResponse = await testEndpoint('POST', '/api/auth/login', {
        email: testUsers.tenant.email,
        password: testUsers.tenant.password
    }, 'User Login');

    authToken = loginResponse.data.token;

    // Test password reset request
    console.log('\n🧪 Testing password reset request...');
    await testEndpoint('POST', '/api/auth/forgot-password', {
        email: testUsers.tenant.email
    }, 'Password Reset Request');

    // Test profile retrieval
    console.log('\n🧪 Testing profile retrieval...');
    await testEndpoint('GET', '/api/auth/profile', null, 'Get Profile');

    // Test profile update
    console.log('\n🧪 Testing profile update...');
    await testEndpoint('PUT', '/api/auth/profile', {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890'
    }, 'Update Profile');

    // Test invalid login
    console.log('\n🧪 Testing invalid login...');
    try {
        await testEndpoint('POST', '/api/auth/login', {
            email: 'wrong@example.com',
            password: 'wrongpass'
        }, 'Invalid Login');
    } catch (error) {
        console.log('✅ Invalid login properly rejected');
    }

    // Test token refresh
    console.log('\n🧪 Testing token refresh...');
    const refreshResponse = await testEndpoint('POST', '/api/auth/refresh', null, 'Refresh Token');
    authToken = refreshResponse.data.token;

    console.log('\n✅ Authentication tests completed successfully');
    return authToken;
}

module.exports = { run };