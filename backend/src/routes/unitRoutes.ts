import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

const router = Router();

// Забезпечуємо наявність колонки middleName у базі даних (По батькові)
AppDataSource.query('ALTER TABLE "users" ADD COLUMN "middleName" varchar').catch(() => {
  // Ігноруємо помилку, якщо колонка вже існує
});

const getUserId = (req: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Unauthorized');
  const token = authHeader.split(' ')[1];
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  return String(decoded.userId || decoded.id || decoded.tempId);
};

// --- УПРАВЛІННЯ ПІДРОЗДІЛАМИ ТА ЗАПИТАМИ ---

router.get('/', async (req, res) => {
  try {
    // ТИМЧАСОВО ВИМКНЕНО: викликало Race Condition при створенні нового підрозділу
    /*
    const ghostUnits = await AppDataSource.query('SELECT m.id FROM "military_units" m LEFT JOIN "users" u ON m.id = u."unitId" WHERE u.id IS NULL');
    if (ghostUnits.length > 0) {
      for (const ghost of ghostUnits) {
        await AppDataSource.query('DELETE FROM "unit_join_requests" WHERE "unitId" = ?', [ghost.id]);
        await AppDataSource.query('DELETE FROM "unit_chat_messages" WHERE "unitId" = ?', [ghost.id]);
        await AppDataSource.query('DELETE FROM "military_units" WHERE id = ?', [ghost.id]);
      }
    }
    */

    const units = await AppDataSource.query('SELECT u.*, c."lastName" as "commanderName", c."rank" as "commanderRank" FROM "military_units" u LEFT JOIN "users" c ON u."commanderId" = c.id');
    sendSuccess(res, units);
  } catch (e) { sendError(res, 'Помилка сервера', 500); }
});

router.get('/my', async (req, res) => {
  try {
    const userId = getUserId(req);
    const users = await AppDataSource.query('SELECT "unitId" FROM "users" WHERE id = ?', [userId]);
    if (!users[0] || !users[0].unitId) return sendSuccess(res, null);
    
    const units = await AppDataSource.query('SELECT * FROM "military_units" WHERE id = ?', [users[0].unitId]);
    sendSuccess(res, units[0] || null);
  } catch (e) { sendError(res, 'Помилка сервера', 500); }
});

router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name } = req.body;
    const id = crypto.randomUUID();
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    await AppDataSource.query('INSERT INTO "military_units" ("id", "name", "commanderId", "inviteCode") VALUES (?, ?, ?, ?)', [id, name, userId, inviteCode]);
    await AppDataSource.query('UPDATE "users" SET "unitId" = ? WHERE id = ?', [id, userId]);
    sendSuccess(res, { id, name, inviteCode });
  } catch (e) { sendError(res, 'Помилка створення підрозділу', 500); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return sendError(res, 'Назва обов\'язкова', 400);
    await AppDataSource.query('UPDATE "military_units" SET "name" = ? WHERE id = ?', [name, req.params.id]);
    sendSuccess(res, null, 'Назву оновлено');
  } catch (e) { sendError(res, 'Помилка оновлення', 500); }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const unit = await AppDataSource.query('SELECT "commanderId" FROM "military_units" WHERE id = ?', [req.params.id]);
    
    // Перевірка чи це командир (в реальному проекті ще перевірка на адміна)
    // if (unit[0]?.commanderId !== userId) return sendError(res, 'Немає прав', 403);

    // Відв'язуємо всіх користувачів та чистимо сліди
    await AppDataSource.query('UPDATE "users" SET "unitId" = NULL WHERE "unitId" = ?', [req.params.id]);
    await AppDataSource.query('DELETE FROM "unit_join_requests" WHERE "unitId" = ?', [req.params.id]);
    await AppDataSource.query('DELETE FROM "unit_chat_messages" WHERE "unitId" = ?', [req.params.id]);
    await AppDataSource.query('DELETE FROM "military_units" WHERE id = ?', [req.params.id]);
    
    sendSuccess(res, null, 'Підрозділ видалено');
  } catch (e) { 
    console.error(e);
    sendError(res, 'Помилка видалення', 500); 
  }
});

router.post('/my/leave', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    // Знаходимо поточний підрозділ користувача
    const userRows = await AppDataSource.query('SELECT "unitId" FROM "users" WHERE id = ?', [userId]);
    const unitId = userRows[0]?.unitId;
    if (!unitId) return sendSuccess(res, null, 'Ви не в підрозділі');

    // Перевіряємо чи був цей користувач командиром
    const unitRows = await AppDataSource.query('SELECT "commanderId" FROM "military_units" WHERE id = ?', [unitId]);
    const wasCommander = unitRows[0]?.commanderId === userId;

    // Видаляємо користувача з підрозділу
    await AppDataSource.query('UPDATE "users" SET "unitId" = NULL WHERE id = ?', [userId]);

    // Перевіряємо скільки людей залишилось у підрозділі
    const remainingUsers = await AppDataSource.query('SELECT id FROM "users" WHERE "unitId" = ? ORDER BY "createdAt" ASC LIMIT 1', [unitId]);

    if (remainingUsers.length === 0) {
      // У підрозділі нікого не залишилось - повністю чистимо систему від нього
      await AppDataSource.query('DELETE FROM "unit_join_requests" WHERE "unitId" = ?', [unitId]);
      await AppDataSource.query('DELETE FROM "unit_chat_messages" WHERE "unitId" = ?', [unitId]);
      await AppDataSource.query('DELETE FROM "military_units" WHERE id = ?', [unitId]);
    } else if (wasCommander) {
      // Якщо залишились люди і вийшов саме командир, передаємо повноваження наступному
      await AppDataSource.query('UPDATE "military_units" SET "commanderId" = ? WHERE id = ?', [remainingUsers[0].id, unitId]);
    }

    sendSuccess(res, null, 'Ви покинули підрозділ');
  } catch (e) { 
    sendError(res, 'Помилка виходу', 500); 
  }
});

router.post('/:id/request-join', async (req, res) => {
  try {
    const userId = getUserId(req);
    const existing = await AppDataSource.query('SELECT id FROM "unit_join_requests" WHERE "unitId" = ? AND "userId" = ? AND "status" = ?', [req.params.id, userId, 'pending']);
    if (existing.length > 0) return sendError(res, 'Запит вже відправлено', 400);
    
    await AppDataSource.query('INSERT INTO "unit_join_requests" ("id", "unitId", "userId") VALUES (?, ?, ?)', [crypto.randomUUID(), req.params.id, userId]);
    sendSuccess(res, null, 'Запит відправлено командиру');
  } catch (e) { sendError(res, 'Помилка відправки запиту', 500); }
});

router.get('/:id/requests', async (req, res) => {
  try {
    const requests = await AppDataSource.query('SELECT r.*, u."firstName", u."lastName", u."middleName", u."rank", u."position" FROM "unit_join_requests" r JOIN "users" u ON r."userId" = u.id WHERE r."unitId" = ? AND r."status" = ?', [req.params.id, 'pending']);
    sendSuccess(res, requests);
  } catch (e) { sendError(res, 'Помилка сервера', 500); }
});

router.post('/requests/:reqId/approve', async (req, res) => {
  try {
    const request = await AppDataSource.query('SELECT * FROM "unit_join_requests" WHERE id = ?', [req.params.reqId]);
    if (!request[0]) return sendError(res, 'Запит не знайдено', 404);
    
    await AppDataSource.query('UPDATE "unit_join_requests" SET "status" = ? WHERE id = ?', ['approved', req.params.reqId]);
    await AppDataSource.query('UPDATE "users" SET "unitId" = ? WHERE id = ?', [request[0].unitId, request[0].userId]);
    sendSuccess(res, null, 'Бійця додано');
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.post('/requests/:reqId/reject', async (req, res) => {
  try {
    await AppDataSource.query('UPDATE "unit_join_requests" SET "status" = ? WHERE id = ?', ['rejected', req.params.reqId]);
    sendSuccess(res, null, 'Відхилено');
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.get('/:id/members', async (req, res) => {
  try {
    // Збагачений запит для Панелі Командира: підтягуємо статистику та останній логін кожного бійця
    const members = await AppDataSource.query(`
      SELECT 
        u.id, u."firstName", u."lastName", u."middleName", u."rank", u."role", u."position", u."lastLoginAt",
        (SELECT COUNT(*) FROM "xt_user_progress" p WHERE p."userId" = u.id AND p.status = 'completed') as "completedModules",
        (SELECT AVG(score) FROM "xt_simulator_attempts" s WHERE s."userId" = u.id) as "avgSimScore"
      FROM "users" u 
      WHERE u."unitId" = ? 
      ORDER BY u."role", u."rank"
    `, [req.params.id]);
    sendSuccess(res, members);
  } catch (e) { sendError(res, 'Помилка сервера', 500); }
});

router.post('/:id/add-user', async (req, res) => {
  try {
    await AppDataSource.query('UPDATE "users" SET "unitId" = ? WHERE id = ?', [req.params.id, req.body.userId]);
    sendSuccess(res, null, 'Бійця додано примусово');
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.post('/:id/remove-user', async (req, res) => {
  try {
    await AppDataSource.query('UPDATE "users" SET "unitId" = NULL WHERE id = ? AND "unitId" = ?', [req.body.userId, req.params.id]);
    sendSuccess(res, null, 'Бійця відсторонено від підрозділу');
  } catch (e) { sendError(res, 'Помилка відсторонення', 500); }
});

// Отримати зведену аналітику по підрозділу для Панелі Командира
router.get('/:id/analytics', async (req, res) => {
  try {
    // Кількість бійців
    const memRes = await AppDataSource.query('SELECT COUNT(*) as count FROM "users" WHERE "unitId" = ?', [req.params.id]);
    const totalMembers = parseInt(memRes[0]?.count || '0');

    // Статистика симуляторів
    const simRes = await AppDataSource.query(`
      SELECT COUNT(*) as count, AVG(score) as avgScore 
      FROM "xt_simulator_attempts" s 
      JOIN "users" u ON s."userId" = u.id 
      WHERE u."unitId" = ?
    `, [req.params.id]);
    const completedSims = parseInt(simRes[0]?.count || '0');
    const avgScore = Math.round(parseFloat(simRes[0]?.avgScore || '0'));

    // Психологічні запити
    const psychRes = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM "psychological_support" p
      JOIN "users" u ON p."userId" = u.id
      WHERE u."unitId" = ? AND p."severity" IN ('high', 'critical')
    `, [req.params.id]);
    const criticalPsych = parseInt(psychRes[0]?.count || '0');

    sendSuccess(res, { totalMembers, completedSims, avgScore, criticalPsych });
  } catch (e) { sendError(res, 'Помилка аналітики', 500); }
});

// Отримати лідерборд підрозділу
router.get('/my/leaderboard', async (req, res) => {
  try {
    const userId = getUserId(req);
    const uRes = await AppDataSource.query('SELECT "unitId" FROM "users" WHERE id = ?', [userId]);
    const unitId = uRes[0]?.unitId;
    if (!unitId) return sendSuccess(res, []);

    const topUsers = await AppDataSource.query(`
      SELECT 
        u.id, u."firstName", u."lastName", u."middleName", u."callsign", u."rank", u."role", u."profilePictureUrl",
        (
          (SELECT COUNT(*) FROM "xt_user_progress" p WHERE p."userId" = u.id AND p.status = 'completed') * 500 +
          COALESCE((SELECT AVG(score) * 10 FROM "xt_simulator_attempts" s WHERE s."userId" = u.id), 0) +
          COALESCE((SELECT SUM(xp) FROM "mentorship_quests" q WHERE q."recruitId" = u.id AND q.status = 'completed'), 0)
        ) as "combatScore"
      FROM "users" u
      WHERE u."unitId" = ?
      ORDER BY "combatScore" DESC
      LIMIT 10
    `, [unitId]);
    
    sendSuccess(res, topUsers);
  } catch (e) { sendError(res, 'Помилка завантаження рейтингу', 500); }
});

// --- ПОШУК ТА ЧАТИ ---

router.get('/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || String(q).length < 2) return sendSuccess(res, []);
    const query = `%${q}%`;
    const users = await AppDataSource.query('SELECT id, "firstName", "lastName", "middleName", "rank", "position" FROM "users" WHERE "firstName" LIKE ? OR "lastName" LIKE ? OR "middleName" LIKE ? LIMIT 10', [query, query, query]);
    sendSuccess(res, users);
  } catch (e) { sendError(res, 'Помилка пошуку', 500); }
});

router.get('/chat/contacts', async (req, res) => {
  try {
    const userId = getUserId(req);
    const contacts = await AppDataSource.query(`
      SELECT DISTINCT u.id, u."firstName", u."lastName", u."middleName", u.rank 
      FROM "users" u 
      JOIN "direct_messages" m ON u.id = m."senderId" OR u.id = m."receiverId" 
      WHERE (m."senderId" = ? OR m."receiverId" = ?) AND u.id != ?
    `, [userId, userId, userId]);
    sendSuccess(res, contacts);
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.get('/:id/chat/:channel', async (req, res) => {
  try {
    const channel = req.params.channel || 'general';
    const messages = await AppDataSource.query(`SELECT m.*, u."firstName", u."lastName", u."middleName", u."rank" FROM "unit_chat_messages" m JOIN "users" u ON m."senderId" = u.id WHERE m."unitId" = ? AND m.channel = ? ORDER BY m."createdAt" ASC LIMIT 200`, [req.params.id, channel]);
    sendSuccess(res, messages);
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.post('/:id/chat/:channel', async (req, res) => {
  try {
    const userId = getUserId(req);
    const channel = req.params.channel || 'general';
    
    if (channel === 'info') {
      const unit = await AppDataSource.query('SELECT "commanderId" FROM "military_units" WHERE id = ?', [req.params.id]);
      if (unit[0]?.commanderId !== userId) return sendError(res, 'Тільки командир може писати в Інфо-канал', 403);
    }

    const { encryptedContent, iv } = req.body;
    
    // Захист: якщо стовпчик channel ще не створився, ми його примусово додаємо
    try {
      await AppDataSource.query('INSERT INTO "unit_chat_messages" ("id", "unitId", "channel", "senderId", "encryptedContent", "iv", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), req.params.id, channel, userId, encryptedContent, iv, new Date().toISOString()]);
    } catch (dbErr: any) {
      if (dbErr.message && dbErr.message.includes('channel')) {
        await AppDataSource.query(`ALTER TABLE "unit_chat_messages" ADD COLUMN "channel" varchar DEFAULT 'general'`);
        await AppDataSource.query('INSERT INTO "unit_chat_messages" ("id", "unitId", "channel", "senderId", "encryptedContent", "iv", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), req.params.id, channel, userId, encryptedContent, iv, new Date().toISOString()]);
      } else throw dbErr;
    }
    sendSuccess(res, null);
  } catch (e: any) { sendError(res, e.message || 'Помилка відправки', 500); }
});

router.get('/dm/:userId', async (req, res) => {
  try {
    const me = getUserId(req);
    const them = req.params.userId;
    const messages = await AppDataSource.query(`SELECT m.*, u."firstName", u."lastName", u."middleName", u."rank" FROM "direct_messages" m JOIN "users" u ON m."senderId" = u.id WHERE (m."senderId" = ? AND m."receiverId" = ?) OR (m."senderId" = ? AND m."receiverId" = ?) ORDER BY m."createdAt" ASC LIMIT 100`, [me, them, them, me]);
    sendSuccess(res, messages);
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.post('/dm/:userId', async (req, res) => {
  try {
    const { encryptedContent, iv } = req.body;
    await AppDataSource.query('INSERT INTO "direct_messages" ("id", "senderId", "receiverId", "encryptedContent", "iv", "createdAt") VALUES (?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), getUserId(req), req.params.userId, encryptedContent, iv, new Date().toISOString()]);
    sendSuccess(res, null);
  } catch (e: any) { sendError(res, e.message || 'Помилка відправки', 500); }
});

export default router;