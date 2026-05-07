import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

const router = Router();

const getUserId = (req: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Unauthorized');
  const token = authHeader.split(' ')[1];
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  return String(decoded.userId || decoded.id || decoded.tempId);
};

// Отримати всі психологічні запити (для психолога)
router.get('/requests', async (req, res) => {
  try {
    const userId = getUserId(req);
    const requests = await AppDataSource.query(`SELECT p.* FROM "psychological_support" p JOIN "users" u ON p."userId" = u.id WHERE u."unitId" = (SELECT "unitId" FROM "users" WHERE id = ?) ORDER BY p."createdAt" DESC`, [userId]);
    sendSuccess(res, requests);
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Отримати всі запити системи
router.get('/all-requests', async (req, res) => {
  try {
    const userId = getUserId(req);
    const rows = await AppDataSource.query(`SELECT p.*, u."firstName", u."lastName", u."middleName", u."rank" FROM "psychological_support" p LEFT JOIN "users" u ON p."userId" = u."id" WHERE u."unitId" = (SELECT "unitId" FROM "users" WHERE id = ?) ORDER BY p."createdAt" DESC`, [userId]);
    sendSuccess(res, rows.map((r: any) => ({ ...r, user: { firstName: r.firstName, lastName: r.lastName, middleName: r.middleName, rank: r.rank } })));
  } catch (e) { 
    sendError(res, 'Помилка сервера', 500); 
  }
});

// Оновити статус запиту (для психолога)
router.put('/requests/:id/status', async (req, res) => {
  try {
    const { status, response } = req.body;
    await AppDataSource.query(
      'UPDATE "psychological_support" SET "status" = ?, "response" = ?, "respondedAt" = CURRENT_TIMESTAMP WHERE "id" = ?',
      [status, response || null, req.params.id]
    );
    sendSuccess(res, null, 'Оновлено');
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Отримати аналітику настрою
router.get('/analytics', async (req, res) => {
  try {
    const userId = getUserId(req);
    const stats = { totalPolled: 0, good: 0, normal: 0, stressed: 0, critical: 0 };
    const requests = await AppDataSource.query(`SELECT p.* FROM "psychological_support" p JOIN "users" u ON p."userId" = u.id WHERE u."unitId" = (SELECT "unitId" FROM "users" WHERE id = ?)`, [userId]);
    
    stats.totalPolled = requests.length;
    requests.forEach((r: any) => {
      const sev = String(r.severity || r.topic || '').toLowerCase();
      if (sev.includes('низьк') || sev.includes('low') || sev.includes('добр')) stats.good++;
      else if (sev.includes('середн') || sev.includes('medium') || sev.includes('норм')) stats.normal++;
      else if (sev.includes('висок') || sev.includes('high') || sev.includes('стрес')) stats.stressed++;
      else if (sev.includes('критич') || sev.includes('critical') || sev.includes('птср')) stats.critical++;
      else stats.normal++; // default fallback
    });

    sendSuccess(res, stats);
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Створити запит на психологічну підтримку (для бійця)
const createRequest = async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);

    const message = req.body.message || req.body.description || req.body.text || 'Потребую психологічної підтримки';
    const contactType = req.body.contactType || 'anonymous';
    const severity = req.body.severity || 'medium';
    const status = req.body.status || 'pending';
    const isEscalated = req.body.isEscalated || false;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Ensure table exists with all columns
    try {
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS "psychological_support" (
          "id" varchar PRIMARY KEY,
          "userId" varchar,
          "message" text,
          "contactType" varchar DEFAULT 'anonymous',
          "psychologistId" varchar,
          "response" text,
          "respondedAt" datetime,
          "respondedByUserId" varchar,
          "status" varchar DEFAULT 'pending',
          "severity" varchar DEFAULT 'medium',
          "keywords" text,
          "isEscalated" boolean DEFAULT 0,
          "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    } catch(e) { console.error('Create table error:', e); }

    // Add missing columns if they don't exist
    const columnsToAdd = [
      { name: 'message', sql: 'ALTER TABLE "psychological_support" ADD COLUMN "message" text' },
      { name: 'contactType', sql: 'ALTER TABLE "psychological_support" ADD COLUMN "contactType" varchar DEFAULT \'anonymous\'' },
      { name: 'severity', sql: 'ALTER TABLE "psychological_support" ADD COLUMN "severity" varchar DEFAULT \'medium\'' },
      { name: 'isEscalated', sql: 'ALTER TABLE "psychological_support" ADD COLUMN "isEscalated" boolean DEFAULT 0' },
    ];
    
    for (const col of columnsToAdd) {
      try {
        await AppDataSource.query(col.sql).catch(() => {});
      } catch(e) {}
    }

    await AppDataSource.query(
      'INSERT INTO "psychological_support" ("id", "userId", "message", "contactType", "severity", "status", "isEscalated", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, message, contactType, severity, status, isEscalated ? 1 : 0, createdAt, createdAt]
    );

    const saved = await AppDataSource.query('SELECT * FROM "psychological_support" WHERE id = ?', [id]);
    sendSuccess(res, saved[0], 'Запит створено', 201);
  } catch (error) {
    console.error('Psych request err:', error);
    sendError(res, 'Помилка створення запиту', 500);
  }
};

router.post('/requests', createRequest);
router.post('/request', createRequest);

// Отримати мої запити на психологічну підтримку
router.get('/user/requests', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);

    const requests = await AppDataSource.query(
      `SELECT * FROM "psychological_support" WHERE "userId" = ? ORDER BY "createdAt" DESC`,
      [userId]
    );

    sendSuccess(res, requests);
  } catch (error) {
    sendError(res, 'Помилка при завантаженні запитів', 500);
  }
});

// Alias for frontend compatibility
router.get('/my-requests', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);

    const requests = await AppDataSource.query(
      `SELECT * FROM "psychological_support" WHERE "userId" = ? ORDER BY "createdAt" DESC`,
      [userId]
    );

    sendSuccess(res, requests);
  } catch (error) {
    sendError(res, 'Помилка при завантаженні запитів', 500);
  }
});

// Зберегти настрій
router.post('/mood', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { mood, notes } = req.body;
    
    if (typeof mood !== 'number' || mood < 1 || mood > 10) {
      return sendError(res, 'Невірне значення настрою', 400);
    }

    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS "mood_logs" (
        "id" varchar PRIMARY KEY,
        "userId" varchar NOT NULL,
        "mood" integer NOT NULL,
        "notes" text,
        "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    await AppDataSource.query(
      'INSERT INTO "mood_logs" ("id", "userId", "mood", "notes") VALUES (?, ?, ?, ?)',
      [crypto.randomUUID(), userId, mood, notes || null]
    );

    sendSuccess(res, null, 'Настрій збережено');
  } catch (error) {
    sendError(res, 'Помилка збереження настрою', 500);
  }
});

// Отримати тренди настрою
router.get('/trends', async (req, res) => {
  try {
    const userId = getUserId(req);
    const days = parseInt(req.query.days as string) || 30;
    
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS "mood_logs" (
        "id" varchar PRIMARY KEY,
        "userId" varchar NOT NULL,
        "mood" integer NOT NULL,
        "notes" text,
        "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    const logs = await AppDataSource.query(
      `SELECT mood, notes, "createdAt" as timestamp 
       FROM "mood_logs" 
       WHERE "userId" = ? 
       ORDER BY "createdAt" DESC 
       LIMIT ?`,
      [userId, days]
    );

    const formattedLogs = logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp).toLocaleDateString('uk-UA')
    }));

    sendSuccess(res, { moodTrend: formattedLogs });
  } catch (error) {
    sendError(res, 'Помилка отримання трендів', 500);
  }
});

export default router;
