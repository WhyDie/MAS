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
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';

// ===== ГЛОБАЛЬНИЙ ЩИТ ВІД ПАДІННЯ СЕРВЕРА =====
process.on('uncaughtException', (err) => {
  console.error('🔥 КРИТИЧНА ПОМИЛКА (Uncaught Exception):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 НЕОБРОБЛЕНА ПРОМІС-ПОМИЛКА (Unhandled Rejection):', reason);
});

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
      frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://www.youtube-nocookie.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
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
    
    // УВІМКНЕННЯ WAL-РЕЖИМУ (Write-Ahead Logging) ДЛЯ SQLITE
    // Це вирішує проблему блокування бази (SQLITE_BUSY), коли багато бійців 
    // одночасно пишуть у чат (кожні 5 сек) або зберігають рапорти.
    try {
      await AppDataSource.query('PRAGMA journal_mode = WAL;');
    } catch (e) { console.error('Помилка активації WAL:', e); }

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
    const announcementRoutes = (await import('./routes/announcementRoutes')).default;
    const faqRoutes = (await import('./routes/faqRoutes')).default;
    const notificationRoutes = (await import('./routes/notificationRoutes')).default;
    const achievementsRoutes = (await import('./routes/achievementsRoutes')).default;
    const unitRoutes = (await import('./routes/unitRoutes')).default;
    const slangRoutes = (await import('./routes/slang')).default;

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

    // --- Announcements & FAQ Schema Setup ---
    try {
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "announcements" (
          "id" varchar PRIMARY KEY,
          "title" varchar,
          "text" text,
          "type" varchar,
          "author" varchar,
          "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "faq" (
          "id" varchar PRIMARY KEY,
          "category" varchar,
          "q" text,
          "a" text,
          "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch(e) { console.error('Announcements/FAQ schema error', e) }

    // --- Notifications Schema Setup ---
    try {
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "notifications" (
          "id" varchar PRIMARY KEY,
          "userId" varchar,
          "title" varchar,
          "message" text,
          "type" varchar,
          "isRead" boolean DEFAULT 0,
          "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch(e) { console.error('Notifications schema error', e) }

    // --- Progress & Stats Schema Setup ---
    try {
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "xt_simulator_attempts" (
          "id" varchar PRIMARY KEY,
          "userId" varchar,
          "simulatorId" varchar,
          "score" integer,
          "maxScore" integer,
          "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "xt_user_progress" (
          "id" varchar PRIMARY KEY,
          "userId" varchar,
          "moduleId" varchar,
          "status" varchar,
          "progress" integer,
          "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch(e) { console.error('Stats schema error', e) }

    // --- Units & Encrypted Chat Schema Setup ---
    try {
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "military_units" (
          "id" varchar PRIMARY KEY,
          "name" varchar NOT NULL,
          "commanderId" varchar,
          "inviteCode" varchar,
          "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "unit_chat_messages" (
          "id" varchar PRIMARY KEY, "unitId" varchar NOT NULL, "senderId" varchar NOT NULL, "encryptedContent" text NOT NULL, "iv" varchar NOT NULL, "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch(e) { console.error('Units schema error', e) }
    
    // --- Unit Requests & Direct Messages Schema Setup ---
    try {
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "unit_join_requests" (
          "id" varchar PRIMARY KEY, "unitId" varchar NOT NULL, "userId" varchar NOT NULL, "status" varchar DEFAULT 'pending', "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "direct_messages" (
          "id" varchar PRIMARY KEY, "senderId" varchar NOT NULL, "receiverId" varchar NOT NULL, "encryptedContent" text NOT NULL, "iv" varchar NOT NULL, "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Додаємо підтримку каналів (general, info)
      await AppDataSource.query(`ALTER TABLE "unit_chat_messages" ADD COLUMN "channel" varchar DEFAULT 'general'`).catch(() => {});
    } catch(e) { console.error('Requests/DM schema error', e) }

    // 0. Глобальний перехоплювач POST та PUT-запитів для надсилання сповіщень про контент
    app.use('/api', (req, res, next) => {
      if (req.method === 'POST' || req.method === 'PUT') {
        const path = req.originalUrl;
        const messageStr = req.body?.title || req.body?.name || req.body?.topic || req.body?.q || (req.method === 'POST' ? 'Додано нову інформацію' : 'Оновлено інформацію');

        res.on('finish', () => {
          if (res.statusCode === 201 || res.statusCode === 200) {
            let notifTitle = '';
            let notifType = 'system';
            let targetRoles: string[] | null = null;
            const isNew = req.method === 'POST';

            if (path.includes('/schedule/events')) {
              notifTitle = isNew ? '📅 Нова подія в розпорядку' : '📅 Розпорядок оновлено';
              notifType = 'schedule';
            } else if (path.includes('/training-simulators')) {
              notifTitle = isNew ? '🎮 Новий бойовий симулятор' : '🎮 Симулятор оновлено';
              notifType = 'simulator';
            } else if (path.includes('/training/modules')) {
              notifTitle = isNew ? '🎓 Новий навчальний модуль' : '🎓 Навчальний модуль оновлено';
              notifType = 'training';
            } else if (path.includes('/knowledge-base')) {
              notifTitle = isNew ? '📚 Новий запис у Базі Знань' : '📚 Запис Базі Знань оновлено';
              notifType = 'knowledge-base';
            } else if (path.includes('/unit-guide')) {
              notifTitle = '🛡️ Зміни у Довіднику частини';
              notifType = 'unit-guide';
            } else if (path.includes('/mentorship/requests') && isNew) {
              notifTitle = '🤝 Новий запит на менторство';
              notifType = 'mentorship';
              targetRoles = ['mentor', 'commander', 'admin', 'superadmin'];
            } else if (path.includes('/psychological-support/requests') && isNew) {
              notifTitle = '💚 Новий запит до психолога';
              notifType = 'support';
              targetRoles = ['psychologist', 'commander', 'admin', 'superadmin'];
            }

            if (notifTitle) {
                let query = 'SELECT id FROM "users"';
                let params: any[] = [];
                
                if (targetRoles) {
                  query += ` WHERE "role" IN (${targetRoles.map(() => '?').join(',')})`;
                  params = targetRoles;
                }
                
                AppDataSource.query(query, params).then(async users => {
                  for (const u of users) {
                    try {
                      await AppDataSource.query(
                        'INSERT INTO "notifications" ("id", "userId", "title", "message", "type", "createdAt") VALUES (?, ?, ?, ?, ?, ?)',
                        [crypto.randomUUID(), String(u.id), notifTitle, messageStr, notifType, new Date().toISOString()]
                      );
                    } catch (e) { console.error('INSERT notif error:', e); }
                  }
                }).catch(e => console.error('Notification error:', e));
            }
          }
        });
      }
      next();
    });

    // 1. Гарантоване збереження результатів симуляторів (оминаючи старі контролери)
    app.post('/api/training-simulators/:id/finish', async (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const userId = String(decoded.userId || decoded.tempId);
        
        const simulatorId = req.params.id;
        const score = req.body?.score !== undefined ? Number(req.body.score) : 0;
        const total = req.body?.total !== undefined ? Number(req.body.total) : 100;

        await AppDataSource.query(
          'INSERT INTO "xt_simulator_attempts" ("id", "userId", "simulatorId", "score", "maxScore") VALUES (?, ?, ?, ?, ?)',
          [crypto.randomUUID(), userId, simulatorId, score, total]
        );
        
        res.json({ success: true });
      } catch (e) {
        console.error('Simulator finish error:', e);
        res.status(500).json({ success: false, error: 'Internal Error' });
      }
    });

    // 3. Гарантоване збереження проходження модулів
    app.post('/api/training/modules/:id/complete', async (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const userId = String(decoded.userId || decoded.id || decoded.tempId);
        const moduleId = req.params.id;

        const existing = await AppDataSource.query('SELECT id FROM "xt_user_progress" WHERE "userId" = ? AND "moduleId" = ?', [userId, moduleId]);
        if (existing.length > 0) {
          await AppDataSource.query('UPDATE "xt_user_progress" SET "status" = ?, "progress" = 100, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?', ['completed', existing[0].id]);
        } else {
          await AppDataSource.query('INSERT INTO "xt_user_progress" ("id", "userId", "moduleId", "status", "progress") VALUES (?, ?, ?, ?, ?)', [crypto.randomUUID(), userId, moduleId, 'completed', 100]);
        }
        res.json({ success: true });
      } catch (e) {
        console.error('Module complete error:', e);
        res.status(500).json({ success: false, error: 'Internal Error' });
      }
    });

    // 4. Перевірка статусу проходження модуля
    app.get('/api/training/modules/:id/check-progress', async (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.json({ completed: false });
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const userId = String(decoded.userId || decoded.id || decoded.tempId);

        const existing = await AppDataSource.query('SELECT * FROM "xt_user_progress" WHERE "userId" = ? AND "moduleId" = ? AND "status" = ?', [userId, req.params.id, 'completed']);
        res.json({ completed: existing.length > 0 });
      } catch (e) {
        res.json({ completed: false });
      }
    });

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
    app.use('/api/announcements', announcementRoutes);
    app.use('/api/faq', faqRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/achievements', achievementsRoutes);
    app.use('/api/units', unitRoutes);
    app.use('/api/slang', slangRoutes);

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
