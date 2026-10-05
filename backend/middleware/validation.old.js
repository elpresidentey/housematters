const Joi = require('joi');

// Custom JoiPhone extension for phone number validation
const JoiPhone = Joi.extend((joi) => ({
    type: 'phone',
    base: joi.string(),
    messages: {
        'phone.invalid': '{{#label}} must be a valid phone number'
    },
    validate(value, helpers) {
        const phoneRegex = /^\+?[\d\s-()]{8,20}$/;
        if (!phoneRegex.test(value)) {
            return { value, errors: helpers.error('phone.invalid') };
        }
        return { value };
    }
}));

// Enhanced validation middleware with better error handling
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const options = {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
            errors: {
                wrap: {
                    label: ''
                }
            }
        };

        const { error, value } = schema.validate(req[property], options);

        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value,
                type: detail.type
            }));

            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details
                }
            });
        }

        req[property] = value;
        next();
    };
};

// Common validation schemas
// Validation middleware creators
const validateMessage = validate(messageSchema);

// Profile update validation schema
const profileUpdateSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).max(20),
    bio: Joi.string().trim().max(500),
    preferences: Joi.object({
        currency: Joi.string().valid('USD', 'EUR', 'GBP').default('USD'),
        language: Joi.string().valid('en', 'es', 'fr').default('en'),
        darkMode: Joi.boolean().default(false),
        emailNotifications: Joi.boolean().default(true),
        pushNotifications: Joi.boolean().default(true)
    }),
    notificationSettings: Joi.object({
        newMessages: Joi.boolean().default(true),
        bookingRequests: Joi.boolean().default(true),
        bookingUpdates: Joi.boolean().default(true),
        propertyUpdates: Joi.boolean().default(true),
        marketing: Joi.boolean().default(false)
    })
});

// Validation middleware creators
const validateProfileUpdate = validate(profileUpdateSchema);

const schemas = {
    // User registration validation with enhanced password requirements
    userRegistration: Joi.object({
        firstName: Joi.string().trim().min(2).max(50).required()
            .messages({
                'string.min': 'First name must be at least 2 characters long',
                'string.max': 'First name cannot exceed 50 characters',
                'any.required': 'First name is required'
            }),
        lastName: Joi.string().trim().min(2).max(50).required()
            .messages({
                'string.min': 'Last name must be at least 2 characters long',
                'string.max': 'Last name cannot exceed 50 characters',
                'any.required': 'Last name is required'
            }),
        email: Joi.string().email().lowercase().required()
            .messages({
                'string.email': 'Please enter a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string().min(8).max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
            .required()
            .messages({
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'string.min': 'Password must be at least 8 characters long',
                'string.max': 'Password cannot exceed 128 characters',
                'any.required': 'Password is required'
            }),
        role: Joi.string().valid('landlord', 'tenant').required()
            .messages({
                'any.only': 'Role must be either landlord or tenant',
                'any.required': 'Role is required'
            }),
        phone: JoiPhone.phone().optional()
    }).prefs({ convert: true }),

    // User login validation with trimming and conversion
    userLogin: Joi.object({
        email: Joi.string().email().lowercase().required()
            .messages({
                'string.email': 'Please enter a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string().required()
            .messages({
                'any.required': 'Password is required'
            })
    }).prefs({ convert: true }),

    // Token validations with length and format checks
    emailVerification: Joi.object({
        token: Joi.string().length(64).required()
            .messages({
                'string.length': 'Invalid verification token',
                'any.required': 'Verification token is required'
            })
    }),

    passwordResetRequest: Joi.object({
        email: Joi.string().email().lowercase().required()
            .messages({
                'string.email': 'Please enter a valid email address',
                'any.required': 'Email is required'
            })
    }),

    passwordReset: Joi.object({
        token: Joi.string().length(64).required()
            .messages({
                'string.length': 'Invalid reset token',
                'any.required': 'Reset token is required'
            }),
        password: Joi.string().min(8).max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
            .required()
            .messages({
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'string.min': 'Password must be at least 8 characters long',
                'string.max': 'Password cannot exceed 128 characters',
                'any.required': 'Password is required'
            })
    }),

    // Property creation/update with comprehensive validation
    property: Joi.object({
        title: Joi.string().trim().min(5).max(200).required()
            .messages({
                'string.min': 'Title must be at least 5 characters long',
                'string.max': 'Title cannot exceed 200 characters',
                'any.required': 'Title is required'
            }),
        description: Joi.string().trim().min(20).max(2000).required()
            .messages({
                'string.min': 'Description must be at least 20 characters long',
                'string.max': 'Description cannot exceed 2000 characters',
                'any.required': 'Description is required'
            }),
        address: Joi.string().trim().min(10).max(500).required()
            .messages({
                'string.min': 'Address must be at least 10 characters long',
                'string.max': 'Address cannot exceed 500 characters',
                'any.required': 'Address is required'
            }),
        city: Joi.string().trim().min(2).max(100).required()
            .messages({
                'string.min': 'City must be at least 2 characters long',
                'string.max': 'City cannot exceed 100 characters',
                'any.required': 'City is required'
            }),
        state: Joi.string().trim().min(2).max(100).required()
            .messages({
                'string.min': 'State must be at least 2 characters long',
                'string.max': 'State cannot exceed 100 characters',
                'any.required': 'State is required'
            }),
        rent: Joi.number().positive().precision(2).required()
            .messages({
                'number.base': 'Rent must be a number',
                'number.positive': 'Rent must be greater than 0',
                'any.required': 'Rent is required'
            }),
        bedrooms: Joi.number().integer().min(0).max(20).required()
            .messages({
                'number.base': 'Number of bedrooms must be a number',
                'number.integer': 'Number of bedrooms must be a whole number',
                'number.min': 'Number of bedrooms cannot be negative',
                'number.max': 'Number of bedrooms cannot exceed 20',
                'any.required': 'Number of bedrooms is required'
            }),
        bathrooms: Joi.number().integer().min(0).max(20).required()
            .messages({
                'number.base': 'Number of bathrooms must be a number',
                'number.integer': 'Number of bathrooms must be a whole number',
                'number.min': 'Number of bathrooms cannot be negative',
                'number.max': 'Number of bathrooms cannot exceed 20',
                'any.required': 'Number of bathrooms is required'
            }),
        amenities: Joi.array().items(Joi.string().trim().max(100))
            .unique()
            .max(20)
            .default([])
            .messages({
                'array.unique': 'Amenities must be unique',
                'array.max': 'Maximum 20 amenities allowed'
            }),
        isAvailable: Joi.boolean().default(true),
        latitude: Joi.number().min(-90).max(90).optional()
            .messages({
                'number.min': 'Invalid latitude value',
                'number.max': 'Invalid latitude value'
            }),
        longitude: Joi.number().min(-180).max(180).optional()
            .messages({
                'number.min': 'Invalid longitude value',
                'number.max': 'Invalid longitude value'
            }),
        propertyType: Joi.string()
            .valid('house', 'apartment', 'condo', 'townhouse', 'studio')
            .required()
            .messages({
                'any.only': 'Invalid property type',
                'any.required': 'Property type is required'
            })
    }),

    // Enhanced property search/filter with validation
    propertySearch: Joi.object({
        query: Joi.string().trim().max(100).optional()
            .messages({
                'string.max': 'Search query cannot exceed 100 characters'
            }),
        city: Joi.string().trim().max(100).optional(),
        state: Joi.string().trim().max(100).optional(),
        minRent: Joi.number().positive().optional()
            .messages({
                'number.positive': 'Minimum rent must be greater than 0'
            }),
        maxRent: Joi.number().positive().greater(Joi.ref('minRent')).optional()
            .messages({
                'number.positive': 'Maximum rent must be greater than 0',
                'number.greater': 'Maximum rent must be greater than minimum rent'
            }),
        bedrooms: Joi.number().integer().min(0).optional(),
        bathrooms: Joi.number().integer().min(0).optional(),
        amenities: Joi.array().items(Joi.string().trim()).unique().optional(),
        propertyType: Joi.array()
            .items(Joi.string().valid('house', 'apartment', 'condo', 'townhouse', 'studio'))
            .unique()
            .optional(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(50).default(10),
        sortBy: Joi.string()
            .valid('rent', 'createdAt', 'bedrooms', 'bathrooms')
            .default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
        radius: Joi.number().positive().max(100).optional()
            .messages({
                'number.positive': 'Radius must be greater than 0',
                'number.max': 'Radius cannot exceed 100 kilometers'
            })
    }).prefs({ convert: true }),

    // Message creation with content validation
    message: Joi.object({
        receiverId: Joi.string().uuid().required()
            .messages({
                'string.guid': 'Invalid receiver ID format',
                'any.required': 'Receiver ID is required'
            }),
        propertyId: Joi.string().uuid().optional()
            .messages({
                'string.guid': 'Invalid property ID format'
            }),
        content: Joi.string().trim().min(1).max(1000).required()
            .messages({
                'string.min': 'Message cannot be empty',
                'string.max': 'Message cannot exceed 1000 characters',
                'any.required': 'Message content is required'
            })
    }),

    // Booking creation with date validation
    booking: Joi.object({
        propertyId: Joi.string().uuid().required()
            .messages({
                'string.guid': 'Invalid property ID format',
                'any.required': 'Property ID is required'
            }),
        startDate: Joi.date().iso().min('now').required()
            .messages({
                'date.base': 'Invalid start date',
                'date.min': 'Start date must be in the future',
                'any.required': 'Start date is required'
            }),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
            .messages({
                'date.base': 'Invalid end date',
                'date.min': 'End date must be after start date',
                'any.required': 'End date is required'
            }),
        notes: Joi.string().trim().max(500).optional()
            .messages({
                'string.max': 'Notes cannot exceed 500 characters'
            })
    }),

    // Review creation with rating validation
    review: Joi.object({
        revieweeId: Joi.string().uuid().required()
            .messages({
                'string.guid': 'Invalid reviewee ID format',
                'any.required': 'Reviewee ID is required'
            }),
        propertyId: Joi.string().uuid().optional()
            .messages({
                'string.guid': 'Invalid property ID format'
            }),
        rating: Joi.number().integer().min(1).max(5).required()
            .messages({
                'number.base': 'Rating must be a number',
                'number.integer': 'Rating must be a whole number',
                'number.min': 'Rating must be at least 1',
                'number.max': 'Rating cannot exceed 5',
                'any.required': 'Rating is required'
            }),
        comment: Joi.string().trim().min(10).max(1000).optional()
            .messages({
                'string.min': 'Comment must be at least 10 characters long',
                'string.max': 'Comment cannot exceed 1000 characters'
            })
    }),

    // Profile update with enhanced validation
    profileUpdate: Joi.object({
        firstName: Joi.string().trim().min(2).max(50).optional()
            .messages({
                'string.min': 'First name must be at least 2 characters long',
                'string.max': 'First name cannot exceed 50 characters'
            }),
        lastName: Joi.string().trim().min(2).max(50).optional()
            .messages({
                'string.min': 'Last name must be at least 2 characters long',
                'string.max': 'Last name cannot exceed 50 characters'
            }),
        phone: JoiPhone.phone().optional(),
        profileImage: Joi.string().uri().optional()
            .messages({
                'string.uri': 'Invalid profile image URL'
            }),
        bio: Joi.string().trim().max(500).optional()
            .messages({
                'string.max': 'Bio cannot exceed 500 characters'
            }),
        preferences: Joi.object({
            currency: Joi.string().valid('USD', 'EUR', 'GBP').default('USD'),
            language: Joi.string().valid('en', 'es', 'fr').default('en'),
            darkMode: Joi.boolean().default(false),
            emailNotifications: Joi.boolean().default(true),
            pushNotifications: Joi.boolean().default(true)
        }).default()
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),

    // Parameter validation
    uuidParam: Joi.object({
        id: Joi.string().uuid().required()
            .messages({
                'string.guid': 'Invalid ID format',
                'any.required': 'ID is required'
            })
    })
};

// Create validation middleware instances
const validateUserRegistration = validate(schemas.userRegistration);
const validateUserLogin = validate(schemas.userLogin);
const validateEmailVerification = validate(schemas.emailVerification);
const validatePasswordResetRequest = validate(schemas.passwordResetRequest);
const validatePasswordReset = validate(schemas.passwordReset);
const validateProperty = validate(schemas.property);
const validatePropertySearch = validate(schemas.propertySearch);
const validateMessage = validate(schemas.message);
const validateBooking = validate(schemas.booking);
const validateReview = validate(schemas.review);
const validateProfileUpdate = validate(schemas.profileUpdate);
const validateUuidParam = validate(schemas.uuidParam, 'params');

module.exports = {
    // Validation middleware instances
    validateUserRegistration,
    validateUserLogin,
    validateEmailVerification,
    validatePasswordResetRequest,
    validatePasswordReset,
    validateProperty,
    validatePropertySearch,
    validateMessage,
    validateBooking,
    validateReview,
    validateProfileUpdate,
    validateUuidParam,
    // Core components for custom validation
    validate,
    schemas,
    JoiPhone
};