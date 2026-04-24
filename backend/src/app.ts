import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { initializeDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Express = express();

// ===== SECURITY HEADERS =====
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://openrouter.ai"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS with strict origins
app.use(
  cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    maxAge: 600, // Cache preflight for 10 minutes
  })
);

// Rate limiting - strict for auth, moderate for API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 auth attempts per 15 min
  message: { success: false, error: 'Too many authentication attempts', message: 'Please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests', message: 'Please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply limiters
app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);

// Body parser with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Remove X-Powered-By header
app.disable('x-powered-by');

// Health check (public)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date(), version: '1.0.0' });
});

export async function startServer(): Promise<void> {
  try {
    // Initialize database FIRST
    await initializeDatabase();

    // THEN import and setup routes
    const authRoutes = (await import('./routes/auth')).default;
    const trainingRoutes = (await import('./routes/training')).default;
    const trainingSimulatorRoutes = (await import('./routes/training-simulator')).default;
    const syncRoutes = (await import('./routes/sync')).default;
    const onboardingRoutes = (await import('./routes/onboarding')).default;
    const scheduleRoutes = (await import('./routes/schedule')).default;
    const knowledgeBaseRoutes = (await import('./routes/knowledge-base')).default;
    const mentorshipRoutes = (await import('./routes/mentorship')).default;
    const equipmentRoutes = (await import('./routes/equipment')).default;
    const psychologicalSupportRoutes = (await import('./routes/psychological-support')).default;
    const unitGuideRoutes = (await import('./routes/unit-guide')).default;
    const aiRoutes = (await import('./routes/ai')).default;

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/training', trainingRoutes);
    app.use('/api/training-simulators', trainingSimulatorRoutes);
    app.use('/api/sync', syncRoutes);
    app.use('/api/onboarding', onboardingRoutes);
    app.use('/api/schedule', scheduleRoutes);
    app.use('/api/knowledge-base', knowledgeBaseRoutes);
    app.use('/api/mentorship', mentorshipRoutes);
    app.use('/api/equipment', equipmentRoutes);
    app.use('/api/psychological-support', psychologicalSupportRoutes);
    app.use('/api/unit-guide', unitGuideRoutes);
    app.use('/api/ai', aiRoutes);

    // 404 handler
    app.use(notFoundHandler);

    // Error handler
    app.use(errorHandler);

    const PORT = config.app.port;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${config.app.nodeEnv}`);
      console.log(`API URL: ${config.app.apiUrl}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

export default app;
