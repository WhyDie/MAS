import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import jwt from 'jsonwebtoken';

const router = Router();



// Оновлення розширеного профілю користувача
router.put('/profile-extended', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);

    const { firstName, lastName, callsign, rank, position, civilProfession, icon, signature } = req.body;

    const updateFields = [];
    const updateValues = [];
    
    if (firstName !== undefined) { updateFields.push('"firstName" = ?'); updateValues.push(firstName); }
    if (lastName !== undefined) { updateFields.push('"lastName" = ?'); updateValues.push(lastName); }
    if (rank !== undefined) { updateFields.push('"rank" = ?'); updateValues.push(rank); }
    if (position !== undefined) { updateFields.push('"position" = ?'); updateValues.push(position); }
    if (civilProfession !== undefined) { updateFields.push('"civilProfession" = ?'); updateValues.push(civilProfession); }
    if (icon !== undefined) { updateFields.push('"profilePictureUrl" = ?'); updateValues.push(icon); }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      await AppDataSource.query(`UPDATE "users" SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    if (callsign !== undefined) {
      const extExists = await AppDataSource.query('SELECT "userId" FROM "user_ext" WHERE "userId" = ?', [userId]);
      if (extExists.length > 0) {
        await AppDataSource.query('UPDATE "user_ext" SET "callsign" = ? WHERE "userId" = ?', [callsign, userId]);
      } else {
        await AppDataSource.query('INSERT INTO "user_ext" ("userId", "callsign") VALUES (?, ?)', [userId, callsign]);
      }
    }

    if (signature !== undefined) {
      await AppDataSource.query(`ALTER TABLE "user_ext" ADD COLUMN "signature" text`).catch(() => {});
      const extExists = await AppDataSource.query('SELECT "userId" FROM "user_ext" WHERE "userId" = ?', [userId]);
      if (extExists.length > 0) {
        await AppDataSource.query('UPDATE "user_ext" SET "signature" = ? WHERE "userId" = ?', [signature, userId]);
      } else {
        await AppDataSource.query('INSERT INTO "user_ext" ("userId", "signature") VALUES (?, ?)', [userId, signature]);
      }
    }

    res.json({ success: true, message: 'Профіль оновлено' });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Помилка оновлення профілю' });
  }
});

// Зміна пароля користувача
router.put('/change-password', authMiddleware, userController.changePassword);

export default router;
