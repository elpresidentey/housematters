/**
 * Utility functions for consistent API responses
 */

// Success response
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

// Error response
const error = (res, message = 'An error occurred', statusCode = 500, code = null, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      timestamp: new Date().toISOString()
    }
  };
  
  if (code) {
    response.error.code = code;
  }
  
  if (details) {
    response.error.details = details;
  }
  
  return res.status(statusCode).json(response);
};

// Paginated response
const paginated = (res, data, pagination, message = 'Success') => {
  return res.json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
};

// Created response (201)
const created = (res, data, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

// No content response (204)
const noContent = (res) => {
  return res.status(204).send();
};

// Bad request response (400)
const badRequest = (res, message = 'Bad request', details = null) => {
  return error(res, message, 400, 'BAD_REQUEST', details);
};

// Unauthorized response (401)
const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401, 'UNAUTHORIZED');
};

// Forbidden response (403)
const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403, 'FORBIDDEN');
};

// Not found response (404)
const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404, 'NOT_FOUND');
};

// Conflict response (409)
const conflict = (res, message = 'Resource already exists') => {
  return error(res, message, 409, 'CONFLICT');
};

// Validation error response (422)
const validationError = (res, details, message = 'Validation failed') => {
  return error(res, message, 422, 'VALIDATION_ERROR', details);
};

// Internal server error response (500)
const serverError = (res, message = 'Internal server error') => {
  return error(res, message, 500, 'INTERNAL_SERVER_ERROR');
};

module.exports = {
  success,
  error,
  paginated,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError
};