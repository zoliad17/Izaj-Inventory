const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// Different rate limits for different endpoints
const rateLimits = {
    // General API rate limit - Increased for business operations
    general: createRateLimit(
        15 * 60 * 1000, // 15 minutes
        500, // 500 requests per window (5x increase)
        'Too many requests from this IP, please try again later'
    ),

    // Login rate limit (stricter)
    login: createRateLimit(
        15 * 60 * 1000, // 15 minutes
        10, // 10 login attempts per window (2x increase)
        'Too many login attempts, please try again later'
    ),

    // Password reset rate limit
    passwordReset: createRateLimit(
        60 * 60 * 1000, // 1 hour
        5, // 5 password reset attempts per hour
        'Too many password reset attempts, please try again later'
    ),

    // User creation rate limit
    userCreation: createRateLimit(
        60 * 60 * 1000, // 1 hour
        20, // 20 user creation attempts per hour (2x increase)
        'Too many user creation attempts, please try again later'
    ),

    // Product operations rate limit - Critical for stock management
    productOps: createRateLimit(
        15 * 60 * 1000, // 15 minutes
        200, // 200 product operations per window (4x increase)
        'Too many product operations, please try again later'
    ),

    // Dashboard stats rate limit - Real-time monitoring needs
    dashboardStats: createRateLimit(
        5 * 60 * 1000, // 5 minutes
        100, // 100 requests per 5 minutes (5x increase)
        'Too many dashboard requests, please try again later'
    ),

    // User management rate limit - For frequent user lookups
    userManagement: createRateLimit(
        5 * 60 * 1000, // 5 minutes
        150, // 150 user requests per 5 minutes
        'Too many user management requests, please try again later'
    ),

    // Stock monitoring rate limit - Most critical for business
    stockMonitoring: createRateLimit(
        5 * 60 * 1000, // 5 minutes
        300, // 300 stock requests per 5 minutes
        'Too many stock monitoring requests, please try again later'
    ),

    // Product requests rate limit - For requisition system
    productRequests: createRateLimit(
        5 * 60 * 1000, // 5 minutes
        200, // 200 request operations per 5 minutes
        'Too many product request operations, please try again later'
    ),

    // Audit logs rate limit - For audit log queries
    auditLogs: createRateLimit(
        5 * 60 * 1000, // 5 minutes
        100, // 100 audit log requests per 5 minutes
        'Too many audit log requests, please try again later'
    )
};

// Security headers middleware
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// CORS configuration for desktop app
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests from localhost for desktop app
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'tauri://localhost', // Tauri desktop app
            'https://tauri.localhost', // Tauri HTTPS
            'https://izaj-inventory.onrender.com'
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        // Log only errors (removed slow request logging)
        if (res.statusCode >= 400) {
            console.log('Request:', logData);
        }
    });

    next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: isDevelopment ? err.message : 'Invalid input data'
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing authentication'
        });
    }

    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'CORS Error',
            message: 'Origin not allowed'
        });
    }

    // Default error
    res.status(500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? err.message : 'Something went wrong'
    });
};

// Request size limiter
const requestSizeLimiter = (limit = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('content-length') || '0');
        const maxSize = parseInt(limit) * 1024 * 1024; // Convert MB to bytes

        if (contentLength > maxSize) {
            return res.status(413).json({
                error: 'Request too large',
                message: `Request size exceeds ${limit} limit`
            });
        }

        next();
    };
};

// Lightweight authentication middleware
const authenticateUser = async (req, res, next) => {
    try {
        // Get user_id from body (POST/PUT), query params (GET/DELETE), or URL params (route params)
        const user_id = req.body?.user_id || req.query?.user_id || req.params?.userId || req.params?.user_id;

        if (!user_id) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'User ID is required in request body, query parameters, or URL parameters'
            });
        }

        // Validate user exists and is active
        const { data: user, error } = await supabase
            .from("user")
            .select("user_id, name, email, status, role_id, branch_id")
            .eq("user_id", user_id)
            .single();

        if (error || !user) {
            return res.status(401).json({
                error: 'Invalid user',
                message: 'User not found'
            });
        }

        if (user.status?.toLowerCase() !== "active") {
            return res.status(403).json({
                error: 'Account inactive',
                message: 'User account is not active'
            });
        }

        // Attach user info to request for use in route handlers
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: 'Internal server error during authentication'
        });
    }
};

module.exports = {
    rateLimits,
    securityHeaders,
    corsOptions,
    requestLogger,
    errorHandler,
    requestSizeLimiter,
    authenticateUser
};
