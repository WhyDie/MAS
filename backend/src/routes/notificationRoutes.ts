import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.tempId);

    const notifications = await AppDataSource.query(
      'SELECT * FROM "notifications" WHERE "userId" = ? ORDER BY "createdAt" DESC LIMIT 50',
      [userId]
    );

    // Конвертуємо SQLite 0/1 у boolean для фронтенду
    const formatted = notifications.map((n: any) => ({
      ...n,
      isRead: n.isRead === 1 || n.isRead === true
    }));

    sendSuccess(res, formatted);
  } catch (error) {
    sendError(res, 'Помилка', 500);
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await AppDataSource.query('UPDATE "notifications" SET "isRead" = 1 WHERE "id" = ?', [req.params.id]);
    sendSuccess(res, null);
  } catch (error) {
    sendError(res, 'Помилка', 500);
  }
});

router.put('/read-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.tempId);

    await AppDataSource.query('UPDATE "notifications" SET "isRead" = 1 WHERE "userId" = ?', [userId]);
    sendSuccess(res, null);
  } catch (error) {
    sendError(res, 'Помилка', 500);
  }
});

router.delete('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.tempId);

    await AppDataSource.query('DELETE FROM "notifications" WHERE "userId" = ?', [userId]);
    sendSuccess(res, null);
  } catch (error) {
    sendError(res, 'Помилка', 500);
  }
});

export default router;