const request = require('supertest');
const express = require('express');
const { validate, schemas } = require('../middleware/validation');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Test route with validation
  app.post('/test-validation', validate(schemas.userLogin), (req, res) => {
    res.json({ success: true, data: req.body });
  });
  
  // Test route without validation
  app.get('/test-health', (req, res) => {
    res.json({ status: 'OK' });
  });
  
  return app;
};

describe('Middleware Tests', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  describe('Validation Middleware', () => {
    test('should pass valid login data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/test-validation')
        .send(validData)
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
    
    test('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/test-validation')
        .send(invalidData)
        .expect(400);
        
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
    
    test('should reject missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // missing password
      };
      
      const response = await request(app)
        .post('/test-validation')
        .send(incompleteData)
        .expect(400);
        
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveLength(1);
    });
    
    test('should sanitize and normalize data', async () => {
      const dataWithWhitespace = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/test-validation')
        .send(dataWithWhitespace)
        .expect(200);
        
      expect(response.body.data.email).toBe('test@example.com');
    });
  });
  
  describe('Health Check', () => {
    test('should return OK status', async () => {
      const response = await request(app)
        .get('/test-health')
        .expect(200);
        
      expect(response.body.status).toBe('OK');
    });
  });
});

// Test validation schemas
describe('Validation Schemas', () => {
  describe('User Registration Schema', () => {
    test('should validate complete registration data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'tenant'
      };
      
      const { error } = schemas.userRegistration.validate(validData);
      expect(error).toBeUndefined();
    });
    
    test('should reject invalid role', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'invalid_role'
      };
      
      const { error } = schemas.userRegistration.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
  
  describe('Property Schema', () => {
    test('should validate complete property data', () => {
      const validData = {
        title: 'Beautiful 2BR Apartment',
        description: 'A lovely apartment in the heart of the city with modern amenities.',
        address: '123 Main Street, Apt 4B',
        city: 'New York',
        state: 'NY',
        rent: 2500.00,
        bedrooms: 2,
        bathrooms: 1,
        amenities: ['parking', 'gym', 'pool']
      };
      
      const { error } = schemas.property.validate(validData);
      expect(error).toBeUndefined();
    });
    
    test('should reject negative rent', () => {
      const invalidData = {
        title: 'Test Property',
        description: 'Test description that is long enough',
        address: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        rent: -100,
        bedrooms: 1,
        bathrooms: 1
      };
      
      const { error } = schemas.property.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});