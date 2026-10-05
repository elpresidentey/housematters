#!/usr/bin/env node

/**
 * Simple script to test server functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

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
    
    const response = await axios(config);
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
    
    return response;
  } catch (error) {
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`📄 Error Response:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting House Matters API Tests');
  console.log('=====================================');
  
  // Test health endpoint
  await testEndpoint('GET', '/health', null, 'Health Check');
  
  // Test API info endpoint
  await testEndpoint('GET', '/api', null, 'API Information');
  
  // Test validation middleware with valid data
  await testEndpoint('POST', '/api/test/validation', {
    email: 'test@example.com',
    password: 'password123'
  }, 'Validation Middleware - Valid Data');
  
  // Test validation middleware with invalid data
  await testEndpoint('POST', '/api/test/validation', {
    email: 'invalid-email',
    password: '123'
  }, 'Validation Middleware - Invalid Data');
  
  // Test rate limiting (multiple requests)
  console.log('\n🧪 Testing Rate Limiting (sending 5 rapid requests)');
  for (let i = 1; i <= 5; i++) {
    console.log(`Request ${i}:`);
    await testEndpoint('GET', '/api', null, `Rate Limit Test ${i}`);
  }
  
  // Test 404 handling
  await testEndpoint('GET', '/api/nonexistent', null, '404 Error Handling');
  
  console.log('\n✨ Tests completed!');
  console.log('=====================================');
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const isRunning = await checkServer();
  
  if (!isRunning) {
    console.log('❌ Server is not running!');
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  }
  
  await runTests();
}

// Add axios to dev dependencies if running this script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEndpoint, runTests };