const { testEndpoint, config } = require('../scripts/run-tests');

async function run(authToken) {
    let testPropertyId = null;

    // Test property creation
    console.log('\n🧪 Testing property creation...');
    const propertyData = {
        title: 'Test Property',
        description: 'A beautiful test property for automated testing',
        address: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        rent: 1500,
        bedrooms: 2,
        bathrooms: 2,
        amenities: ['parking', 'pool', 'gym'],
        propertyType: 'apartment',
        isAvailable: true,
        latitude: 40.7128,
        longitude: -74.0060
    };

    const createResponse = await testEndpoint('POST', '/api/properties', propertyData, 'Create Property');
    testPropertyId = createResponse.data.property.id;

    // Test property search
    console.log('\n🧪 Testing property search...');
    await testEndpoint('GET', '/api/properties', {
        city: 'Test City',
        minRent: 1000,
        maxRent: 2000,
        bedrooms: 2,
        bathrooms: 2
    }, 'Search Properties');

    // Test property details retrieval
    console.log('\n🧪 Testing property details retrieval...');
    await testEndpoint('GET', `/api/properties/${testPropertyId}`, null, 'Get Property Details');

    // Test property update
    console.log('\n🧪 Testing property update...');
    await testEndpoint('PUT', `/api/properties/${testPropertyId}`, {
        title: 'Updated Test Property',
        rent: 1600
    }, 'Update Property');

    // Test property filters
    console.log('\n🧪 Testing property filters...');
    await testEndpoint('GET', '/api/properties/search', {
        propertyType: ['apartment', 'house'],
        amenities: ['parking'],
        sortBy: 'rent',
        sortOrder: 'asc',
        page: 1,
        limit: 10
    }, 'Filter Properties');

    // Test property deletion
    console.log('\n🧪 Testing property deletion...');
    await testEndpoint('DELETE', `/api/properties/${testPropertyId}`, null, 'Delete Property');

    console.log('\n✅ Property tests completed successfully');
}

module.exports = { run };