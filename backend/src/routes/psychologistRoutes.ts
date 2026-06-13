import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

const router = Router();

// Отримати всі психологічні запити (для психолога)
router.get('/requests', async (req, res) => {
  try {
    const requests = await AppDataSource.query('SELECT * FROM "psychological_support" ORDER BY "createdAt" DESC');
    sendSuccess(res, requests);
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Отримати всі запити системи
router.get('/all-requests', async (req, res) => {
  try {
    const rows = await AppDataSource.query(`SELECT p.*, u."firstName", u."lastName", u."rank" FROM "psychological_support" p LEFT JOIN "users" u ON p."userId" = u."id" ORDER BY p."createdAt" DESC`);
    sendSuccess(res, rows.map((r: any) => ({ ...r, user: { firstName: r.firstName, lastName: r.lastName, rank: r.rank } })));
  } catch (e) { 
    sendError(res, 'Помилка сервера', 500); 
  }
});

// Оновити статус запиту (для психолога)
router.put('/requests/:id/status', async (req, res) => {
  try {
    const { status, response } = req.body;
    const requests = await AppDataSource.query('SELECT * FROM "psychological_support" WHERE id = ?', [req.params.id]);
    if (requests.length === 0) {
      return sendError(res, 'Запит не знайдено', 404);
    }
    const request = requests[0];

    request.status = status;
    if (response) request.response = response;

    await AppDataSource.query(
      'UPDATE "psychological_support" SET "status" = ?, "response" = ?, "respondedAt" = CURRENT_TIMESTAMP WHERE "id" = ?',
      [status, response || null, req.params.id]
    );
    sendSuccess(res, request);
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Отримати аналітику настрою
router.get('/analytics', async (req, res) => {
  try {
    const stats = { totalPolled: 0, good: 0, normal: 0, stressed: 0, critical: 0 };
    const requests = await AppDataSource.query('SELECT * FROM "psychological_support"');
    
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

    const topic = req.body.topic || 'Психологічна підтримка';
    const severity = req.body.severity || 'medium';
    const description = req.body.description || req.body.text || '';
    const status = req.body.status || 'pending';
    const id = crypto.randomUUID();

    await AppDataSource.query(
      'INSERT INTO "psychological_support" ("id", "userId", "topic", "severity", "description", "status", "createdAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, userId, topic, severity, description, status]
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

export default router;