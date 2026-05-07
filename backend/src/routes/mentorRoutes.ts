import { Router } from 'express';
import MentorRequest from '../models/MentorRequest';
import { AppDataSource } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
// import { protect, authorize } from '../middlewares/auth'; // розкоментуйте ваші мідлвари

const router = Router();
const mentorRequestRepository = AppDataSource.getRepository(MentorRequest);

// Отримати всі запити (для ментора)
router.get('/requests', /* protect, authorize('mentor', 'commander', 'admin'), */ async (req, res) => {
  try {
    // У реальному додатку ви б фільтрували по req.user.id
    const requests = await mentorRequestRepository.find({ order: { createdAt: 'DESC' } });
    sendSuccess(res, requests);
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Отримати ВСІ запити системи (для пошуку нічийних)
router.get('/all-requests', async (req, res) => {
  try {
    const rows = await AppDataSource.query(`SELECT m.*, u."firstName", u."lastName", u."rank" FROM "mentorship_requests" m LEFT JOIN "users" u ON m."recruitId" = u."id" ORDER BY m."createdAt" DESC`);
    sendSuccess(res, rows.map((r: any) => ({ ...r, recruit: { firstName: r.firstName, lastName: r.lastName, rank: r.rank } })));
  } catch (e) { 
    sendError(res, 'Помилка сервера', 500); 
  }
});

// Оновити статус запиту (для ментора)
router.put('/requests/:id/status', /* protect, */ async (req, res) => {
  try {
    const { status, response } = req.body;
    const request = await mentorRequestRepository.findOneBy({ id: req.params.id as any });
    if (!request) {
      return sendError(res, 'Запит не знайдено', 404);
    }
    request.status = status;
    if (response) (request as any).response = response;
    if (status === 'completed' || status === 'resolved') (request as any).respondedAt = new Date();
    await mentorRequestRepository.save(request);
    sendSuccess(res, request);
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

// Отримати список підопічних
router.get('/mentees', /* protect, */ async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const mentorId = String(decoded.userId || decoded.tempId);

    const mentees = await AppDataSource.query(
      `SELECT DISTINCT u.id, u."firstName", u."lastName", u.rank, m.status 
       FROM "mentorship_requests" m 
       JOIN "users" u ON m."recruitId" = u.id 
       WHERE m."mentorId" = ? AND m.status IN ('in_progress', 'assigned')`,
      [mentorId]
    );

    let totalModules = 1;
    try {
      const modulesCount = await AppDataSource.query(`SELECT COUNT(*) as cnt FROM "training_modules" WHERE "isActive" = 1`);
      if (modulesCount[0] && modulesCount[0].cnt > 0) totalModules = parseInt(modulesCount[0].cnt);
    } catch(e) {}

    const formattedMentees = await Promise.all(mentees.map(async (m: any) => {
      let progress = 0;
      try {
        const progRes = await AppDataSource.query(`SELECT COUNT(*) as cnt FROM "user_progress" WHERE "userId" = ? AND "status" = 'completed'`, [m.id]);
        const completed = progRes[0] ? parseInt(progRes[0].cnt) : 0;
        progress = Math.min(100, Math.round((completed / totalModules) * 100));
      } catch(e) {}
      
      return { id: m.id, name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Невідомий', rank: m.rank || 'Боєць', status: m.status === 'in_progress' ? 'Активне менторство' : m.status, progress: progress > 0 ? progress : 5 };
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

    await AppDataSource.query(
      'INSERT INTO "mentorship_requests" ("id", "recruitId", "mentorId", "topic", "description", "status", "createdAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, userId, mentorId, topic, description, status]
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

export default router;