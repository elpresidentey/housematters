const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const db = require('../config/database');

// Rate limiting for authentication attempts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_ATTEMPTS',
            message: 'Too many login attempts. Please try again later.'
        }
    }
});

// CSRF Protection
const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

// Token management
const generateTokens = async (user) => {
    const accessToken = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    // Store refresh token in database
    await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
        [user.id, refreshToken]
    );

    return { accessToken, refreshToken };
};

// Enhanced authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Access token is required'
                }
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists and is active
        const userResult = await db.query(
            'SELECT active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].active) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'USER_INACTIVE',
                    message: 'User account is inactive or deleted'
                }
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Access token has expired'
                }
            });
        }

        return res.status(403).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid token'
            }
        });
    }
};

// Refresh token middleware
const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'NO_REFRESH_TOKEN',
                message: 'Refresh token is required'
            }
        });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Check if refresh token exists in database and is not expired
        const tokenResult = await db.query(
            'SELECT * FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
            [decoded.userId, refreshToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'INVALID_REFRESH_TOKEN',
                    message: 'Invalid or expired refresh token'
                }
            });
        }

        // Get user details
        const userResult = await db.query(
            'SELECT id, email, role, active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].active) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'USER_INACTIVE',
                    message: 'User account is inactive or deleted'
                }
            });
        }

        const user = userResult.rows[0];

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

        // Invalidate old refresh token
        await db.query(
            'DELETE FROM refresh_tokens WHERE token = $1',
            [refreshToken]
        );

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Invalid refresh token'
            }
        });
    }
};

// Role-based authorization with permission checking
const authorize = (roles = [], permissions = []) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            // Check role
            if (roles.length > 0 && !roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_ROLE',
                        message: 'Insufficient role permissions'
                    }
                });
            }

            // Check permissions
            if (permissions.length > 0) {
                const userPermissions = await db.query(
                    'SELECT permissions FROM user_permissions WHERE user_id = $1',
                    [req.user.userId]
                );

                const hasPermissions = permissions.every(permission =>
                    userPermissions.rows[0]?.permissions?.includes(permission)
                );

                if (!hasPermissions) {
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'Insufficient permissions'
                        }
                    });
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Session management
const validateSession = async (req, res, next) => {
    try {
        if (!req.user) return next();

        // Check if user has an active session
        const session = await db.query(
            'SELECT * FROM user_sessions WHERE user_id = $1 AND expires_at > NOW()',
            [req.user.userId]
        );

        if (session.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'SESSION_EXPIRED',
                    message: 'Session has expired. Please log in again.'
                }
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    authLimiter,
    csrfProtection,
    generateTokens,
    authenticateToken,
    refreshAccessToken,
    authorize,
    validateSession
};