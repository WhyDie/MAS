import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import * as crypto from 'crypto';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const faqs = await AppDataSource.query('SELECT * FROM "faq" ORDER BY "createdAt" DESC');
    sendSuccess(res, faqs);
  } catch (error) {
    sendError(res, 'Failed to fetch FAQ', 500);
  }
});

router.post('/', async (req, res) => {
  try {
    const { q, a, category } = req.body;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await AppDataSource.query(
      'INSERT INTO "faq" ("id", "q", "a", "category", "createdAt") VALUES (?, ?, ?, ?, ?)',
      [id, q, a, category || 'Інше', createdAt]
    );

    // Створюємо сповіщення для всіх користувачів
    const users = await AppDataSource.query('SELECT id FROM "users"');
    for (const u of users) {
      await AppDataSource.query(
        'INSERT INTO "notifications" ("id", "userId", "title", "message", "type", "createdAt") VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), String(u.id), '❓ Нове в FAQ', q, 'faq', createdAt]
      );
    }

    const newItem = await AppDataSource.query('SELECT * FROM "faq" WHERE "id" = ?', [id]);
    sendSuccess(res, newItem[0], 'Питання створено', 201);
  } catch (error) {
    sendError(res, 'Помилка створення FAQ', 500);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { q, a, category } = req.body;
    await AppDataSource.query(
      'UPDATE "faq" SET "q" = ?, "a" = ?, "category" = ? WHERE "id" = ?',
      [q, a, category, req.params.id]
    );
    const updatedItem = await AppDataSource.query('SELECT * FROM "faq" WHERE "id" = ?', [req.params.id]);
    if (updatedItem.length === 0) return sendError(res, 'Не знайдено', 404);
    sendSuccess(res, updatedItem[0], 'Питання оновлено');
  } catch (error) {
    sendError(res, 'Помилка оновлення FAQ', 500);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await AppDataSource.query('DELETE FROM "faq" WHERE "id" = ?', [req.params.id]);
    sendSuccess(res, null, 'Питання видалено');
  } catch (error) {
    sendError(res, 'Помилка видалення FAQ', 500);
  }
});

export default router;