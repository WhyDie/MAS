import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { initializeDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import userRoutes from './routes/userRoutes';
import Database from 'better-sqlite3';
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

    // --- PATCH: Гарантована робота дашбордів Ментора та Психолога ---

    // Інтерцептор: додаємо позивний (callsign) до всіх відповідей з даними користувача
    app.use((req, res, next) => {
      const originalJson = res.json;
      res.json = function (body) {
        if (body && body.data) {
          const userObj = body.data.user || (body.data.email ? body.data : null);
          if (userObj && userObj.id) {
            try {
              const db = new Database(getDbPath(), { timeout: 1000 });

                // Примусово підтягуємо найсвіжіші дані з правильної БД (ігноруємо кеш TypeORM)
                try {
                  const realUser = db.prepare('SELECT "firstName", "lastName", "profilePictureUrl", "rank", "position", "civilProfession" FROM "users" WHERE "id" = ?').get(userObj.id) as any;
                  if (realUser) {
                    if (realUser.firstName) userObj.firstName = realUser.firstName;
                    if (realUser.lastName) userObj.lastName = realUser.lastName;
                    if (realUser.profilePictureUrl) userObj.profilePictureUrl = realUser.profilePictureUrl;
                    if (realUser.rank) userObj.rank = realUser.rank;
                    if (realUser.position) userObj.position = realUser.position;
                    if (realUser.civilProfession) userObj.civilProfession = realUser.civilProfession;
                  }
                } catch (e) {}

              db.prepare('CREATE TABLE IF NOT EXISTS "user_ext" ("userId" varchar PRIMARY KEY, "callsign" varchar)').run();
              const ext = db.prepare('SELECT callsign FROM "user_ext" WHERE "userId" = ?').get(userObj.id) as any;
              if (ext && ext.callsign) userObj.callsign = ext.callsign;
              db.close();
            } catch (e) {}
          }
        }
        return originalJson.call(this, body);
      };
      next();
    });

    // 1. Перехоплюємо створення запиту, щоб примусово записати mentorId в БД
    app.use('/api/mentorship/requests', (req, res, next) => {
      if (req.method === 'POST' && req.body.mentorId) {
        const originalJson = res.json;
        res.json = function (body) {
          if (body && body.data && body.data.id) {
            try {
              const db = new Database(getDbPath(), { fileMustExist: true, timeout: 5000 });
              db.prepare('UPDATE "mentorship_requests" SET "mentorId" = ? WHERE "id" = ?').run(req.body.mentorId, body.data.id);
              db.close();
            } catch (e) { console.error('Patch error:', e); }
          }
          return originalJson.call(this, body);
        };
      }
      next();
    });

    // 2. Ендпоінт для отримання ВСІХ запитів менторства (напряму з БД)
    app.get('/api/mentorship/all-requests', (req, res) => {
      try {
        const db = new Database(getDbPath(), { fileMustExist: true, timeout: 5000 });
        const rows = db.prepare(`SELECT m.*, u."firstName", u."lastName", u."rank" FROM "mentorship_requests" m LEFT JOIN "users" u ON m."recruitId" = u."id" ORDER BY m."createdAt" DESC`).all();
        db.close();
        res.json({ success: true, data: rows.map((r: any) => ({ ...r, recruit: { firstName: r.firstName, lastName: r.lastName, rank: r.rank } })) });
      } catch (e) { res.status(500).json({ success: false }); }
    });

    // 3. Ендпоінт для отримання ВСІХ запитів психологом (напряму з БД)
    app.get('/api/psychological-support/all-requests', (req, res) => {
      try {
        const db = new Database(getDbPath(), { fileMustExist: true, timeout: 5000 });
        const rows = db.prepare(`SELECT p.*, u."firstName", u."lastName", u."rank" FROM "psychological_support" p LEFT JOIN "users" u ON p."userId" = u."id" ORDER BY p."createdAt" DESC`).all();
        db.close();
        res.json({ success: true, data: rows.map((r: any) => ({ ...r, user: { firstName: r.firstName, lastName: r.lastName, rank: r.rank } })) });
      } catch (e) { res.status(500).json({ success: false }); }
    });

    // 3. Безвідмовні ендпоінти для зміни статусів
    app.put('/api/psychological-support/requests/:id/status', express.json(), (req, res) => {
      try {
        const db = new Database(getDbPath(), { fileMustExist: true, timeout: 5000 });
        const { status, response } = req.body;
        if (response && status === 'resolved') {
          db.prepare('UPDATE "psychological_support" SET "status" = ?, "response" = ?, "respondedAt" = datetime("now"), "updatedAt" = datetime("now") WHERE "id" = ?').run(status, response, req.params.id);
        } else {
          db.prepare('UPDATE "psychological_support" SET "status" = ?, "updatedAt" = datetime("now") WHERE "id" = ?').run(status, req.params.id);
        }
        db.close();
        res.json({ success: true });
      } catch (e) { res.status(500).json({ success: false }); }
    });

    app.put('/api/mentorship/requests/:id/status', express.json(), (req, res) => {
      try {
        const db = new Database(getDbPath(), { fileMustExist: true, timeout: 5000 });
        const { status, response } = req.body;
        if (response && (status === 'completed' || status === 'resolved')) {
          db.prepare('UPDATE "mentorship_requests" SET "status" = ?, "response" = ?, "respondedAt" = datetime("now"), "updatedAt" = datetime("now") WHERE "id" = ?').run(status, response, req.params.id);
        } else {
          db.prepare('UPDATE "mentorship_requests" SET "status" = ?, "updatedAt" = datetime("now") WHERE "id" = ?').run(status, req.params.id);
        }
        db.close();
        res.json({ success: true });
      } catch (e) { res.status(500).json({ success: false }); }
    });

    // 4. Надійний ендпоінт для збереження розширеного профілю
    app.put('/api/users/profile-extended', express.json(), (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          res.status(401).json({ success: false, error: 'Unauthorized' });
          return;
        }
        const token = authHeader.split(' ')[1];
        const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString();
        const payload = JSON.parse(payloadStr);
        const userId = payload.id || payload.userId || payload.sub;
        
        if (userId) {
          const activeDbPath = getDbPath();
          console.log('[Profile Patch] Оновлення профілю у БД:', activeDbPath);
          const db = new Database(activeDbPath, { fileMustExist: true, timeout: 5000 });
          
          // 1. Оновлюємо стандартні поля TypeORM
          const stmt = db.prepare('UPDATE "users" SET "firstName" = ?, "lastName" = ?, "profilePictureUrl" = ?, "rank" = ?, "position" = ?, "civilProfession" = ? WHERE "id" = ?');
          const result = stmt.run(
            req.body.firstName || '', 
            req.body.lastName || '', 
            req.body.icon || '', 
            req.body.rank || '', 
            req.body.position || '', 
            req.body.civilProfession || '', 
            userId
          );
          
          // 2. Зберігаємо позивний в окрему таблицю, щоб TypeORM його не видалив
          db.prepare('CREATE TABLE IF NOT EXISTS "user_ext" ("userId" varchar PRIMARY KEY, "callsign" varchar)').run();
          db.prepare('INSERT INTO "user_ext" ("userId", "callsign") VALUES (?, ?) ON CONFLICT("userId") DO UPDATE SET "callsign" = excluded."callsign"')
            .run(userId, req.body.callsign || '');

          console.log('[Profile Patch] Оновлено рядків:', result.changes);
          db.close();
          res.json({ success: true, changes: result.changes });
        } else {
          res.status(400).json({ success: false, error: 'No user ID' });
        }
      } catch (e) {
        console.error('Profile patch error:', e);
        res.status(500).json({ success: false, error: 'Server error' });
      }
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
