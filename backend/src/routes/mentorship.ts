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

// Отримати всі запити (для ментора)
router.get('/requests', async (req, res) => {
  try {
    const userId = getUserId(req);
    const requests = await AppDataSource.query(`SELECT m.* FROM "mentorship_requests" m JOIN "users" u ON m."recruitId" = u.id WHERE u."unitId" = (SELECT "unitId" FROM "users" WHERE id = ?) ORDER BY m."createdAt" DESC`, [userId]);
    sendSuccess(res, requests);
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Отримати ВСІ запити системи (для пошуку нічийних)
router.get('/all-requests', async (req, res) => {
  try {
    const userId = getUserId(req);
    const rows = await AppDataSource.query(`SELECT m.*, u."firstName", u."lastName", u."rank" FROM "mentorship_requests" m LEFT JOIN "users" u ON m."recruitId" = u."id" WHERE u."unitId" = (SELECT "unitId" FROM "users" WHERE id = ?) ORDER BY m."createdAt" DESC`, [userId]);
    sendSuccess(res, rows.map((r: any) => ({ ...r, recruit: { firstName: r.firstName, lastName: r.lastName, rank: r.rank } })));
  } catch (e) { 
    sendError(res, 'Помилка сервера', 500); 
  }
});

// Оновити статус запиту (для ментора)
router.put('/requests/:id/status', async (req, res) => {
  try {
    const { status, response } = req.body;
    await AppDataSource.query(
      'UPDATE "mentorship_requests" SET "status" = ?, "response" = ?, "respondedAt" = CURRENT_TIMESTAMP WHERE "id" = ?',
      [status, response || null, req.params.id]
    );
    sendSuccess(res, null, 'Оновлено');
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Отримати список підопічних
router.get('/mentees', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const mentorId = String(decoded.userId || decoded.tempId);

    const mentees = await AppDataSource.query(
      `SELECT DISTINCT u.id, u."firstName", u."lastName", u.rank, m.status
       FROM "users" u
       JOIN "mentorship_requests" m ON u.id = m."recruitId"
       WHERE u."unitId" = (SELECT "unitId" FROM "users" WHERE id = ?)
       AND m.status IN ('open', 'assigned', 'in_progress')`,
      [mentorId] // Знаходимо всіх, хто подав запит у моєму підрозділі
    );

    let totalModules = 1;
    try {
      const modulesCount = await AppDataSource.query(`SELECT COUNT(*) as cnt FROM "training_modules" WHERE "isActive" = 1`);
      if (modulesCount[0] && modulesCount[0].cnt > 0) totalModules = parseInt(modulesCount[0].cnt);
    } catch(e) {}

    const formattedMentees = await Promise.all(mentees.map(async (m: any) => {
      let completedModules = 0;
      let simAttempts = 0;
      let avgSimScore = 0;
      let requestsCount = 0;

      try {
        const [progRes, simRes, reqRes] = await Promise.all([
          AppDataSource.query(`SELECT COUNT(DISTINCT "moduleId") as cnt FROM "xt_user_progress" WHERE "userId" = ? AND "status" = 'completed'`, [m.id]),
          AppDataSource.query(`SELECT AVG(score) as avgScore, COUNT(*) as attempts FROM "xt_simulator_attempts" WHERE "userId" = ?`, [m.id]),
          AppDataSource.query(`SELECT COUNT(*) as cnt FROM "mentorship_requests" WHERE "recruitId" = ?`, [m.id])
        ]);

        completedModules = parseInt(progRes[0]?.cnt || '0');
        simAttempts = parseInt(simRes[0]?.attempts || '0');
        avgSimScore = Math.round(parseFloat(simRes[0]?.avgscore || '0'));
        requestsCount = parseInt(reqRes[0]?.cnt || '0');

      } catch(e) {}
      
      return { id: m.id, name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Невідомий', rank: m.rank || 'Боєць', status: m.status, lastLoginAt: m.lastLoginAt, completedModules, simAttempts, avgSimScore, requestsCount };
    }));

    sendSuccess(res, formattedMentees);
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Створити новий запит (для бійця)
const createRequest = async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);

    const mentorId = req.body.mentorId || null;
    const status = mentorId ? 'assigned' : 'open';
    const topic = req.body.topic || 'Загальне питання';
    const description = req.body.description || req.body.text || '';
    const id = crypto.randomUUID();

    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS "mentorship_requests" (
        "id" varchar PRIMARY KEY,
        "recruitId" varchar,
        "mentorId" varchar,
        "topic" varchar,
        "description" text,
        "response" text,
        "status" varchar,
        "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
        "respondedAt" datetime
      )
    `).catch(() => {});

    await AppDataSource.query(
      'INSERT INTO "mentorship_requests" ("id", "recruitId", "mentorId", "topic", "description", "status", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, mentorId, topic, description, status, new Date().toISOString()]
    );

    const saved = await AppDataSource.query('SELECT * FROM "mentorship_requests" WHERE id = ?', [id]);
    sendSuccess(res, saved[0], 'Запит створено', 201);
  } catch (error) {
    console.error('Mentor request err:', error);
    sendError(res, 'Помилка створення запиту', 500);
  }
};

router.post('/requests', createRequest);
router.post('/request', createRequest);

router.post('/requests/:id/assign', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const mentorId = String(decoded.userId || decoded.tempId);

    await AppDataSource.query('UPDATE "mentorship_requests" SET "mentorId" = ?, "status" = ? WHERE "id" = ?', [mentorId, 'in_progress', req.params.id]);
    sendSuccess(res, null, 'Успішно призначено');
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Отримати доступних менторів
router.get('/mentors/available', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { topic } = req.query;
    
    let query = `
      SELECT u.id, u."firstName", u."lastName", u.rank, u.position, u.role, u."profilePictureUrl",
             COUNT(CASE WHEN m.status IN ('completed', 'in_progress') THEN 1 END) as "completedRequests",
             AVG(CASE WHEN m.status = 'completed' THEN m."rating" END) as "rating"
      FROM "users" u
      LEFT JOIN "mentorship_requests" m ON u.id = m."mentorId" AND m.status IN ('completed', 'in_progress')
      WHERE u.role IN ('mentor', 'commander', 'admin')
      AND u."unitId" = (SELECT "unitId" FROM "users" WHERE id = ?)
    `;
    
    const params: any[] = [userId];
    
    if (topic) {
      query += ` AND (u.position LIKE ? OR u."civilProfession" LIKE ?)`;
      params.push(`%${topic}%`, `%${topic}%`);
    }
    
    query += ` GROUP BY u.id ORDER BY "rating" DESC, "completedRequests" DESC`;
    
    const mentors = await AppDataSource.query(query, params);
    
    const formattedMentors = mentors.map((mentor: any) => ({
      id: mentor.id,
      name: `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() || 'Ментор',
      firstName: mentor.firstName,
      lastName: mentor.lastName,
      rank: mentor.rank,
      position: mentor.position,
      profilePictureUrl: mentor.profilePictureUrl,
      completedRequests: parseInt(mentor.completedRequests) || 0,
      rating: mentor.rating ? Math.round(mentor.rating * 10) / 10 : 0,
      availability: true,
      skills: mentor.position ? [mentor.position] : []
    }));
    
    sendSuccess(res, formattedMentors);
  } catch (error) {
    console.error('Error fetching available mentors:', error);
    sendError(res, 'Помилка при завантаженні менторів', 500);
  }
});

// Отримати мої запити
router.get('/recruit/requests', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);

    const requests = await AppDataSource.query(
      `SELECT m.*, u."firstName", u."lastName", u.rank 
       FROM "mentorship_requests" m 
       LEFT JOIN "users" u ON m."mentorId" = u.id 
       WHERE m."recruitId" = ?
       ORDER BY m."createdAt" DESC`,
      [userId]
    );

    const formattedRequests = requests.map((r: any) => ({
      ...r,
      mentor: r.mentorId ? {
        id: r.mentorId,
        name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Ментор',
        rank: r.rank
      } : null
    }));

    sendSuccess(res, formattedRequests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    sendError(res, 'Помилка при завантаженні запитів', 500);
  }
});

// --- БОЙОВІ КВЕСТИ (TASK TRACKER) ---

const ensureQuestsTable = async () => {
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS "mentorship_quests" (
      "id" varchar PRIMARY KEY,
      "mentorId" varchar NOT NULL,
      "recruitId" varchar NOT NULL,
      "title" varchar NOT NULL,
      "description" text,
      "xp" integer DEFAULT 0,
      "status" varchar DEFAULT 'pending',
      "createdAt" datetime DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {});
};

// Отримати квести (як ментора, так і бійця)
router.get('/quests', async (req, res) => {
  try {
    await ensureQuestsTable();
    const userId = getUserId(req);
    
    const quests = await AppDataSource.query(`
      SELECT q.*, 
             m."lastName" as "mentorLastName", m.rank as "mentorRank",
             r."lastName" as "recruitLastName", r.rank as "recruitRank"
      FROM "mentorship_quests" q
      LEFT JOIN "users" m ON q."mentorId" = m.id
      LEFT JOIN "users" r ON q."recruitId" = r.id
      WHERE q."mentorId" = ? OR q."recruitId" = ?
      ORDER BY q."createdAt" DESC
    `, [userId, userId]);

    sendSuccess(res, quests);
  } catch (error) { sendError(res, 'Помилка завантаження квестів', 500); }
});

// Створити квест (тільки для ментора)
router.post('/quests', async (req, res) => {
  try {
    await ensureQuestsTable();
    const mentorId = getUserId(req);
    const { recruitId, title, description, xp } = req.body;
    if (!recruitId || !title) return sendError(res, 'Всі поля обов\'язкові', 400);
    const id = crypto.randomUUID();
    await AppDataSource.query('INSERT INTO "mentorship_quests" ("id", "mentorId", "recruitId", "title", "description", "xp", "status") VALUES (?, ?, ?, ?, ?, ?, ?)', [id, mentorId, recruitId, title, description, xp || 100, 'pending']);
    sendSuccess(res, { id }, 'Квест призначено');
  } catch (error) { sendError(res, 'Помилка створення квесту', 500); }
});

// Оновити статус квесту (для звітування та перевірки)
router.put('/quests/:id/status', async (req, res) => {
  try {
    await AppDataSource.query('UPDATE "mentorship_quests" SET "status" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?', [req.body.status, req.params.id]);
    sendSuccess(res, null, 'Статус оновлено');
  } catch (error) { sendError(res, 'Помилка оновлення статусу', 500); }
});

export default router;
