import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import jwt from 'jsonwebtoken';

const router = Router();

// Запускаємо ініціалізацію колонок миттєво під час завантаження файлу
(async () => {
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "birthDate" date').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "serviceStartDate" date').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "contractEndDate" date').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "dutyCount" integer DEFAULT 0').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "lastDutyDate" datetime').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "weaponName" varchar').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "weaponNumber" varchar').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "callsign" varchar').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "signature" text').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "middleName" varchar').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "currentStatus" varchar DEFAULT \'active\'').catch(()=>{});
  await AppDataSource.query('ALTER TABLE "users" ADD COLUMN "commanderNotes" text').catch(()=>{});
})();

// Маршрут для отримання повного (розширеного) профілю, який не обрізається TypeORM
router.get('/me-extended', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);
    
    const users = await AppDataSource.query('SELECT * FROM "users" WHERE id = ?', [userId]);
    res.json({ success: true, data: users[0] });
  } catch (err) {
    res.status(500).json({ error: 'Помилка отримання профілю' });
  }
});

// Оновлення розширеного профілю користувача
router.put('/profile-extended', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);

    // Додано middleName, weaponName та weaponNumber
    const { firstName, lastName, middleName, callsign, rank, position, civilProfession, icon, signature, birthDate, serviceStartDate, contractEndDate, weaponName, weaponNumber } = req.body;

    const updateFields = [];
    const updateValues = [];
    
    if (firstName !== undefined) { updateFields.push('"firstName" = ?'); updateValues.push(firstName); }
    if (lastName !== undefined) { updateFields.push('"lastName" = ?'); updateValues.push(lastName); }
    if (middleName !== undefined) { updateFields.push('"middleName" = ?'); updateValues.push(middleName); }
    if (rank !== undefined) { updateFields.push('"rank" = ?'); updateValues.push(rank); }
    if (position !== undefined) { updateFields.push('"position" = ?'); updateValues.push(position); }
    if (civilProfession !== undefined) { updateFields.push('"civilProfession" = ?'); updateValues.push(civilProfession); }
    if (icon !== undefined) { updateFields.push('"profilePictureUrl" = ?'); updateValues.push(icon); }
    if (birthDate !== undefined) { updateFields.push('"birthDate" = ?'); updateValues.push(birthDate); }
    if (serviceStartDate !== undefined) { updateFields.push('"serviceStartDate" = ?'); updateValues.push(serviceStartDate); }
    if (contractEndDate !== undefined) { updateFields.push('"contractEndDate" = ?'); updateValues.push(contractEndDate); }
    if (weaponName !== undefined) { updateFields.push('"weaponName" = ?'); updateValues.push(weaponName); }
    if (weaponNumber !== undefined) { updateFields.push('"weaponNumber" = ?'); updateValues.push(weaponNumber); }
    if (callsign !== undefined) { updateFields.push('"callsign" = ?'); updateValues.push(callsign); }
    if (signature !== undefined) { updateFields.push('"signature" = ?'); updateValues.push(signature); }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      await AppDataSource.query(`UPDATE "users" SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    res.json({ success: true, message: 'Профіль оновлено' });
  } catch (err: any) {
    console.error('Profile update error:', err);
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Сесія закінчилась. Будь ласка, увійдіть знову.' });
    }
    res.status(500).json({ error: 'Помилка оновлення профілю' });
  }
});

// Зміна пароля користувача
router.put('/change-password', authMiddleware, userController.changePassword);

export default router;
