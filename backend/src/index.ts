/**
 * Golden Bond - Backend API Server
 * Main entry point
 */

import express from 'express';
import session from 'express-session';
import { PORT, FRONTEND_URL, IS_PRODUCTION } from './config';

// Import security middleware
import {
  securityHeaders,
  apiLimiter,
  authLimiter,
  paymentLimiter,
  registerLimiter,
  corsOptions,
  securityLogger,
  validateQueryParams,
  jsonSizeLimit,
  sessionConfig,
} from './middleware/security';

// Import routes
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import searchRoutes from './routes/search';
import matchesRoutes from './routes/matches';
import membershipRoutes from './routes/membership';
import aiRoutes from './routes/ai';
import messagesRoutes from './routes/messages';
import paymentsRoutes from './routes/payments';

const app = express();

// ===========================================
// SECURITY MIDDLEWARE (Applied First)
// ===========================================

// 1. Security headers (Helmet)
app.use(securityHeaders);

// 2. Trust proxy (for rate limiting behind proxy)
app.set('trust proxy', 1);

// 3. CORS with strict configuration
import cors from 'cors';
app.use(cors(corsOptions));

// 4. Session management
app.use(session(sessionConfig));

// 5. Security logging (detect suspicious activity)
app.use(securityLogger);

// 6. Query parameter validation (SQL injection protection)
app.use(validateQueryParams);

// 7. Body parsing with size limits
app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(jsonSizeLimit('10mb'));

// 8. Rate limiting by endpoint
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/payments', paymentLimiter);

// Request logging (development)
if (!IS_PRODUCTION) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
  });
}

// ===========================================
// ROUTES
// ===========================================

// Health check
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'Golden Bond API',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/payments', paymentsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: IS_PRODUCTION ? 'Internal server error' : err.message
  });
});

// ===========================================
// START SERVER
// ===========================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   💍 Golden Bond API Server                       ║
║                                                   ║
║   Running on: http://localhost:${PORT}              ║
║   Environment: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}                       ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;

