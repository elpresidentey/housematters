const { testEndpoint, config } = require('../scripts/run-tests');

async function run(authToken) {
    let testMessageId = null;
    let testReceiverId = null;

    // Get test receiver ID (using the landlord test user)
    const { testUsers } = config;
    const userResponse = await testEndpoint('POST', '/api/auth/login', {
        email: testUsers.landlord.email,
        password: testUsers.landlord.password
    }, 'Get Receiver ID');
    testReceiverId = userResponse.data.user.id;

    // Test message creation
    console.log('\n🧪 Testing message creation...');
    const messageData = {
        receiverId: testReceiverId,
        content: 'This is a test message for automated testing',
        propertyId: null // Optional property reference
    };

    const createResponse = await testEndpoint('POST', '/api/messages', messageData, 'Create Message');
    testMessageId = createResponse.data.message.id;

    // Test conversation retrieval
    console.log('\n🧪 Testing conversation retrieval...');
    await testEndpoint('GET', `/api/messages/conversation/${testReceiverId}`, null, 'Get Conversation');

    // Test user's messages list
    console.log('\n🧪 Testing user messages list...');
    await testEndpoint('GET', '/api/messages', null, 'List User Messages');

    // Test message read status update
    console.log('\n🧪 Testing message read status update...');
    await testEndpoint('PUT', `/api/messages/${testMessageId}/read`, null, 'Mark Message as Read');

    // Test message deletion
    console.log('\n🧪 Testing message deletion...');
    await testEndpoint('DELETE', `/api/messages/${testMessageId}`, null, 'Delete Message');

    console.log('\n✅ Message tests completed successfully');
}

module.exports = { run };