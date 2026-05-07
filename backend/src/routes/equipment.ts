import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();

const getUserId = (req: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  return String(decoded.userId || decoded.id || decoded.tempId);
};

const ensureTable = async () => {
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS "user_equipment" (
      "id" varchar PRIMARY KEY,
      "userId" varchar NOT NULL,
      "name" varchar NOT NULL,
      "category" varchar NOT NULL,
      "weight" float DEFAULT 0,
      "type" varchar DEFAULT 'personal',
      "cost" float DEFAULT 0,
      "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {});
};

router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const items = await AppDataSource.query('SELECT * FROM "user_equipment" WHERE "userId" = ? ORDER BY "createdAt" DESC', [getUserId(req)]);
    sendSuccess(res, items);
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.post('/', async (req, res) => {
  try {
    await ensureTable();
    const { name, category, weight, type, cost } = req.body;
    const id = crypto.randomUUID();
    await AppDataSource.query('INSERT INTO "user_equipment" ("id", "userId", "name", "category", "weight", "type", "cost") VALUES (?, ?, ?, ?, ?, ?, ?)', [id, getUserId(req), name, category, weight || 0, type, cost || 0]);
    sendSuccess(res, { id });
  } catch (e) { sendError(res, 'Помилка', 500); }
});

router.delete('/:id', async (req, res) => {
  try { await AppDataSource.query('DELETE FROM "user_equipment" WHERE id = ? AND "userId" = ?', [req.params.id, getUserId(req)]); sendSuccess(res, null); } catch (e) { sendError(res, 'Помилка', 500); }
});
export default router;