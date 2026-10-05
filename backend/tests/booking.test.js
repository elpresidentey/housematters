const { testEndpoint } = require('../scripts/run-tests');

async function run(authToken) {
    let testBookingId = null;
    let testPropertyId = null;

    // First, create a test property to book
    console.log('\n🧪 Setting up test property...');
    const propertyResponse = await testEndpoint('POST', '/api/properties', {
        title: 'Test Booking Property',
        description: 'A property for testing bookings',
        address: '456 Test Street',
        city: 'Test City',
        state: 'TS',
        rent: 1500,
        bedrooms: 2,
        bathrooms: 2,
        amenities: ['parking'],
        propertyType: 'apartment',
        isAvailable: true
    }, 'Create Test Property');

    testPropertyId = propertyResponse.data.property.id;

    // Test booking creation
    console.log('\n🧪 Testing booking creation...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Start date is 7 days from now
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // End date is 7 days after start date

    const bookingData = {
        propertyId: testPropertyId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        notes: 'Test booking notes'
    };

    const createResponse = await testEndpoint('POST', '/api/bookings', bookingData, 'Create Booking');
    testBookingId = createResponse.data.booking.id;

    // Test booking retrieval
    console.log('\n🧪 Testing booking retrieval...');
    await testEndpoint('GET', `/api/bookings/${testBookingId}`, null, 'Get Booking Details');

    // Test user's bookings list
    console.log('\n🧪 Testing user bookings list...');
    await testEndpoint('GET', '/api/bookings/my-bookings', null, 'List User Bookings');

    // Test property's bookings list
    console.log('\n🧪 Testing property bookings list...');
    await testEndpoint('GET', `/api/bookings/property/${testPropertyId}`, null, 'List Property Bookings');

    // Test booking update
    console.log('\n🧪 Testing booking update...');
    await testEndpoint('PUT', `/api/bookings/${testBookingId}`, {
        status: 'confirmed',
        notes: 'Updated test booking notes'
    }, 'Update Booking');

    // Test booking cancellation
    console.log('\n🧪 Testing booking cancellation...');
    await testEndpoint('DELETE', `/api/bookings/${testBookingId}`, null, 'Cancel Booking');

    // Clean up test property
    console.log('\n🧪 Cleaning up test property...');
    await testEndpoint('DELETE', `/api/properties/${testPropertyId}`, null, 'Delete Test Property');

    console.log('\n✅ Booking tests completed successfully');
}

module.exports = { run };