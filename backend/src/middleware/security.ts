/**
 * Golden Bond - Comprehensive Security Middleware
 * Multiple layers of security protection
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import helmet from 'helmet';

// ===========================================
// 1. HELMET - Security Headers
// ===========================================

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.razorpay.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://checkout.razorpay.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// ===========================================
// 2. RATE LIMITING - Prevent Brute Force
// ===========================================

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
});

// Payment endpoint rate limit
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 payment attempts per hour
  message: 'Too many payment attempts, please try again later.',
});

// Registration rate limit
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: 'Too many registration attempts, please try again later.',
});

// ===========================================
// 3. INPUT VALIDATION - Zod Schemas
// ===========================================

export const registrationSchema = z.object({
  email: z.string().email().min(5).max(100),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(2).max(50).regex(/^[a-zA-Z\s'-]+$/),
  lastName: z.string().min(2).max(50).regex(/^[a-zA-Z\s'-]+$/).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  bio: z.string().max(2000).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
});

export const paymentSchema = z.object({
  planId: z.number().int().positive(),
  provider: z.enum(['stripe', 'razorpay']),
});

// Validation middleware
export function validateInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// ===========================================
// 4. SANITIZATION - Clean User Input
// ===========================================

// Simple HTML tag removal (DOMPurify can be added if needed)
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove HTML tags and sanitize
        req.body[key] = req.body[key]
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+=/gi, ''); // Remove event handlers
      }
    });
  }
  next();
}

// ===========================================
// 5. CSRF PROTECTION
// ===========================================

import csrf from 'csurf';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

export function csrfErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  res.status(403).json({ error: 'Invalid CSRF token' });
}

// ===========================================
// 6. IP WHITELISTING (Optional - for admin)
// ===========================================

const ADMIN_IPS = (process.env.ADMIN_IP_WHITELIST || '').split(',').filter(Boolean);

export function adminIpWhitelist(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || req.socket.remoteAddress;
  
  if (ADMIN_IPS.length > 0 && !ADMIN_IPS.includes(clientIp)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}

// ===========================================
// 7. REQUEST SIZE LIMIT
// ===========================================

export const jsonSizeLimit = (size: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    const maxSize = parseFloat(size) * 1024 * 1024; // Convert MB to bytes
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({ error: 'Request entity too large' });
    }
    
    next();
  };
};

// ===========================================
// 8. SQL INJECTION PROTECTION
// ===========================================

// Using Prisma ORM already protects against SQL injection
// But adding additional validation for raw queries

export function validateQueryParams(req: Request, res: Response, next: NextFunction) {
  const dangerousChars = /[';--]|(\/\*)|(\*\/)|xp_|exec|script/i;
  
  Object.values(req.query).forEach(value => {
    if (typeof value === 'string' && dangerousChars.test(value)) {
      return res.status(400).json({ error: 'Invalid characters in query parameters' });
    }
  });
  
  next();
}

// ===========================================
// 9. CORS CONFIGURATION
// ===========================================

import cors from 'cors';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:8080').split(',');

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

// ===========================================
// 10. SECURITY LOGGING
// ===========================================

export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  // Log suspicious activities
  const suspiciousPatterns = [
    /union.*select/i,
    /drop.*table/i,
    /<script/i,
    /javascript:/i,
    /onerror=/i,
  ];
  
  const requestString = JSON.stringify(req.body) + req.url;
  
  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(requestString)) {
      console.warn(`[SECURITY ALERT] Suspicious activity detected from ${clientIp}:`, {
        ip: clientIp,
        userAgent,
        url: req.url,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  next();
}

// ===========================================
// 11. SESSION SECURITY
// ===========================================

import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

let sessionStore: any = null;

if (process.env.REDIS_URL) {
  const redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch(console.error);
  sessionStore = new RedisStore({ client: redisClient });
}

export const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  store: sessionStore || undefined,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict', // CSRF protection
  },
  name: 'gb.sid', // Don't use default session name
};

