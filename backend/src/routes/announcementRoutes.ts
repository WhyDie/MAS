import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const announcements = await AppDataSource.query('SELECT * FROM "announcements" ORDER BY "createdAt" DESC');
    sendSuccess(res, announcements);
  } catch (error) {
    sendError(res, 'Failed to fetch announcements', 500);
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, text, type } = req.body;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    let author = 'Штаб';
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const users = await AppDataSource.query('SELECT "firstName", "lastName" FROM "users" WHERE id = ?', [decoded.userId || decoded.tempId]);
        if (users[0]) {
          author = `${users[0].firstName} ${users[0].lastName}`.trim() || 'Штаб';
        }
      }
    } catch(e) {}

    await AppDataSource.query(
      'INSERT INTO "announcements" ("id", "title", "text", "type", "author", "createdAt") VALUES (?, ?, ?, ?, ?, ?)',
      [id, title, text, type || 'info', author, createdAt]
    );

    // Створюємо сповіщення для всіх користувачів
    const users = await AppDataSource.query('SELECT id FROM "users"');
    for (const u of users) {
      await AppDataSource.query(
        'INSERT INTO "notifications" ("id", "userId", "title", "message", "type", "createdAt") VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), String(u.id), '📢 Нове оголошення', title, 'announcement', createdAt]
      );
    }

    const newItem = await AppDataSource.query('SELECT * FROM "announcements" WHERE "id" = ?', [id]);
    sendSuccess(res, newItem[0], 'Оголошення створено', 201);
  } catch (error) {
    sendError(res, 'Помилка створення оголошення', 500);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, text, type } = req.body;
    await AppDataSource.query(
      'UPDATE "announcements" SET "title" = ?, "text" = ?, "type" = ? WHERE "id" = ?',
      [title, text, type, req.params.id]
    );
    const updatedItem = await AppDataSource.query('SELECT * FROM "announcements" WHERE "id" = ?', [req.params.id]);
    if (updatedItem.length === 0) return sendError(res, 'Не знайдено', 404);
    sendSuccess(res, updatedItem[0], 'Оголошення оновлено');
  } catch (error) {
    sendError(res, 'Помилка оновлення', 500);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await AppDataSource.query('DELETE FROM "announcements" WHERE "id" = ?', [req.params.id]);
    sendSuccess(res, null, 'Оголошення видалено');
  } catch (error) {
    sendError(res, 'Помилка видалення', 500);
  }
});

export default router;