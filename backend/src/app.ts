import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { initializeDatabase, AppDataSource } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import userRoutes from './routes/userRoutes';
import fs from 'fs';
import path from 'path';

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
  max: 100, // 100 auth attempts per 15 min (збільшено для розробки)
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Remove X-Powered-By header
app.disable('x-powered-by');

// Health check (public)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date(), version: '1.0.0' });
});

// Точний пошук файлу бази даних TypeORM
function getDbPath() {
  const possiblePaths = [
    process.env.DB_PATH ? path.resolve(process.cwd(), process.env.DB_PATH) : '',
    process.env.DB_PATH ? path.resolve(__dirname, '..', process.env.DB_PATH) : '',
    path.join(process.cwd(), 'database.sqlite'),
    path.join(__dirname, '..', 'database.sqlite'),
    path.join(process.cwd(), 'backend', 'database.sqlite'),
    path.join(process.cwd(), 'military_system.db'),
    path.join(__dirname, '..', 'military_system.db'),
    path.join(process.cwd(), 'backend', 'military_system.db'),
    path.join(__dirname, '..', 'data', 'military_system.db')
  ].filter(Boolean);

  let realDb = possiblePaths[0] || path.join(__dirname, '..', 'database.sqlite');
  let maxSize = -1;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const size = fs.statSync(p).size;
      if (size > maxSize) { maxSize = size; realDb = p; }
    }
  }
  return realDb;
}

export async function startServer(): Promise<void> {
  try {
    // Initialize database FIRST
    await initializeDatabase();

    // THEN import and setup routes
    const authRoutes = (await import('./routes/authRoutes')).default;
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

    // --- 2FA Schema Setup ---
    try {
      // Переносимо всі поля безпеки в таблицю user_ext, яку TypeORM не контролює і не видаляє при рестарті
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "user_ext" (
          "userId" varchar PRIMARY KEY,
          "callsign" varchar,
          "twoFactorSecret" varchar,
          "emailFor2FA" varchar,
          "emailCode2FA" varchar,
          "webAuthnCredentialId" varchar,
          "isAuthenticatorEnabled" boolean DEFAULT 0,
          "isEmailCodeEnabled" boolean DEFAULT 0,
          "isBiometricsEnabled" boolean DEFAULT 0
        )
      `);
      
      const cols = ['twoFactorSecret', 'emailFor2FA', 'emailCode2FA', 'webAuthnCredentialId'];
      const bools = ['isAuthenticatorEnabled', 'isEmailCodeEnabled', 'isBiometricsEnabled'];
      
      for (const col of cols) {
        try { await AppDataSource.query(`ALTER TABLE "user_ext" ADD COLUMN "${col}" varchar`); } catch(e) {}
      }
      for (const col of bools) {
        try { await AppDataSource.query(`ALTER TABLE "user_ext" ADD COLUMN "${col}" boolean DEFAULT 0`); } catch(e) {}
      }
    } catch(e) { console.error('2FA schema error', e) }

    // 1. Перехоплюємо створення запиту, щоб примусово записати mentorId в БД
    app.use('/api/mentorship/requests', async (req, res, next) => {
      if (req.method === 'POST' && req.body.mentorId) {
        const originalJson = res.json;
        res.json = function (body) {
          if (body && body.data && body.data.id) {
            AppDataSource.query('UPDATE "mentorship_requests" SET "mentorId" = ? WHERE "id" = ?', [req.body.mentorId, body.data.id]).catch(e => console.error('Patch error:', e));
          }
          return originalJson.call(this, body);
        };
      }
      next();
    });

    // 2. Ендпоінт для отримання ВСІХ запитів менторства (напряму з БД)
    app.get('/api/mentorship/all-requests', async (req, res) => {
      try {
        const rows = await AppDataSource.query(`SELECT m.*, u."firstName", u."lastName", u."rank" FROM "mentorship_requests" m LEFT JOIN "users" u ON m."recruitId" = u."id" ORDER BY m."createdAt" DESC`);
        res.json({ success: true, data: rows.map((r: any) => ({ ...r, recruit: { firstName: r.firstName, lastName: r.lastName, rank: r.rank } })) });
      } catch (e) { res.status(500).json({ success: false }); }
    });

    // 3. Ендпоінт для отримання ВСІХ запитів психологом (напряму з БД)
    app.get('/api/psychological-support/all-requests', async (req, res) => {
      try {
        const rows = await AppDataSource.query(`SELECT p.*, u."firstName", u."lastName", u."rank" FROM "psychological_support" p LEFT JOIN "users" u ON p."userId" = u."id" ORDER BY p."createdAt" DESC`);
        res.json({ success: true, data: rows.map((r: any) => ({ ...r, user: { firstName: r.firstName, lastName: r.lastName, rank: r.rank } })) });
      } catch (e) { res.status(500).json({ success: false }); }
    });

    // 3. Безвідмовні ендпоінти для зміни статусів
    app.put('/api/psychological-support/requests/:id/status', express.json(), async (req, res) => {
      try {
        const { status, response } = req.body;
        if (response && status === 'resolved') {
          await AppDataSource.query('UPDATE "psychological_support" SET "status" = ?, "response" = ?, "respondedAt" = datetime("now"), "updatedAt" = datetime("now") WHERE "id" = ?', [status, response, req.params.id]);
        } else {
          await AppDataSource.query('UPDATE "psychological_support" SET "status" = ?, "updatedAt" = datetime("now") WHERE "id" = ?', [status, req.params.id]);
        }
        res.json({ success: true });
      } catch (e) { res.status(500).json({ success: false }); }
    });

    app.put('/api/mentorship/requests/:id/status', express.json(), async (req, res) => {
      try {
        const { status, response } = req.body;
        if (response && (status === 'completed' || status === 'resolved')) {
          await AppDataSource.query('UPDATE "mentorship_requests" SET "status" = ?, "response" = ?, "respondedAt" = datetime("now"), "updatedAt" = datetime("now") WHERE "id" = ?', [status, response, req.params.id]);
        } else {
          await AppDataSource.query('UPDATE "mentorship_requests" SET "status" = ?, "updatedAt" = datetime("now") WHERE "id" = ?', [status, req.params.id]);
        }
        res.json({ success: true });
      } catch (e) { res.status(500).json({ success: false }); }
    });
    // ----------------------------------------------------------------

    // API Routes
    app.use('/api/users', userRoutes);
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
