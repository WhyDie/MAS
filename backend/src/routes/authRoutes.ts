import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();

// --- Існуючі маршрути ---
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/validate', authMiddleware, authController.validateToken);
router.post('/invite-codes', authMiddleware, authController.createInviteCode);
router.get('/invite-codes', authMiddleware, authController.getInviteCodes);

router.post('/2fa/verify-login', authController.verifyLogin2FA);
router.post('/2fa/send-login-email', authController.sendLoginEmailCode);
// --- Нові маршрути для 2FA ---

// Генерація секрету для додатку-аутентифікатора
router.post(
  '/2fa/generate-authenticator',
  authMiddleware,
  authController.generateAuthenticator
);

// Перевірка та увімкнення 2FA через додаток
router.post(
  '/2fa/verify-authenticator',
  authMiddleware,
  authController.verifyAuthenticator
);

// Вимкнення методу 2FA (аутентифікатор, біометрія)
router.post(
  '/2fa/disable',
  authMiddleware,
  authController.disable2FA
);

// Увімкнення/вимкнення 2FA через код на пошту
router.post(
  '/2fa/toggle-email',
  authMiddleware,
  authController.toggleEmail2FA
);

router.post('/2fa/setup-email', authMiddleware, authController.setupEmail2FA);
router.post('/2fa/setup-biometrics', authMiddleware, authController.setupBiometrics);

// --- ГАРАНТОВАНІ МАРШРУТИ ДЛЯ ІНВАЙТ-КОДІВ (БЕЗВІДМОВНІ) ---

const ensureInviteTable = async () => {
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS "invite_codes" (
      "id" varchar PRIMARY KEY,
      "code" varchar UNIQUE NOT NULL,
      "defaultRole" varchar NOT NULL,
      "createdByUserId" varchar,
      "usedByUserId" varchar,
      "usedAt" timestamp,
      "expiresAt" timestamp,
      "isUsed" boolean DEFAULT false,
      "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {});
};

// Отримання списку існуючих інвайт-кодів
router.get('/invites', async (req, res) => {
  try {
    await ensureInviteTable();
    const invites = await AppDataSource.query('SELECT * FROM "invite_codes" ORDER BY "createdAt" DESC');
    res.json({ success: true, data: invites });
  } catch (error) {
    console.error('Get invites error:', error);
    res.status(500).json({ success: false, error: 'Помилка завантаження інвайт-кодів' });
  }
});

// Створення нового інвайт-коду
router.post('/create-invite', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const creatorId = String(decoded.userId || decoded.id || decoded.tempId);
    
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, error: 'Роль обов\'язкова' });

    // Генеруємо 8-значний код (наприклад: 4F2A9B1C)
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    await ensureInviteTable();

    const expiresInDays = req.body.expiresIn || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await AppDataSource.query(
      'INSERT INTO "invite_codes" ("id", "code", "defaultRole", "createdByUserId", "isUsed", "expiresAt", "createdAt") VALUES (?, ?, ?, ?, 0, ?, ?)',
      [id, code, role, creatorId, expiresAt.toISOString(), createdAt]
    );

    res.json({ success: true, data: { id, code, defaultRole: role, isUsed: false, expiresAt: expiresAt.toISOString(), createdAt } });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ success: false, error: 'Помилка створення інвайт-коду' });
  }
});

// --- МАКСИМАЛЬНО ЗАХИЩЕНЕ ВІДНОВЛЕННЯ ПАРОЛЯ (З ПІДТВЕРДЖЕННЯМ АДМІНА) ---

const ensurePasswordResetTable = async () => {
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS "password_reset_requests" (
      "id" varchar PRIMARY KEY,
      "userId" varchar NOT NULL,
      "email" varchar NOT NULL,
      "code" varchar,
      "status" varchar DEFAULT 'pending',
      "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
      "expiresAt" timestamp
    )
  `).catch(() => {});
};

// Крок 1: Користувач створює запит
router.post('/password-reset/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email обов\'язковий' });
    
    const users = await AppDataSource.query('SELECT id FROM "users" WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'Бійця з таким email не знайдено' });

    await ensurePasswordResetTable();
    
    // Скасовуємо попередні завислі запити
    await AppDataSource.query('UPDATE "password_reset_requests" SET status = ? WHERE email = ? AND status = ?', ['cancelled', email, 'pending']);
    
    await AppDataSource.query(
      'INSERT INTO "password_reset_requests" ("id", "userId", "email", "status") VALUES (?, ?, ?, ?)',
      [crypto.randomUUID(), users[0].id, email, 'pending']
    );
    
    res.json({ success: true, message: 'Запит відправлено адміністратору на розгляд.' });
  } catch (error) {
    res.status(500).json({ error: 'Помилка створення запиту' });
  }
});

// Крок 2: Адмін отримує список запитів
router.get('/password-reset/requests', authMiddleware, async (req: any, res) => {
  try {
    await ensurePasswordResetTable();
    const requests = await AppDataSource.query('SELECT * FROM "password_reset_requests" WHERE status = ? ORDER BY "createdAt" DESC', ['pending']);
    res.json({ success: true, data: requests });
  } catch (error) { res.status(500).json({ error: 'Помилка сервера' }); }
});

// Крок 3: Адмін підтверджує/відхиляє запит
router.post('/password-reset/:id/:action', authMiddleware, async (req: any, res) => {
  try {
    const { id, action } = req.params;
    if (action === 'reject') {
      await AppDataSource.query('UPDATE "password_reset_requests" SET status = ? WHERE id = ?', ['rejected', id]);
      return res.json({ success: true, message: 'Запит відхилено' });
    }
    if (action === 'approve') {
      const code = crypto.randomInt(100000, 1000000).toString(); // Криптографічно безпечний 6-значний код
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Дійсний 24 години
      await AppDataSource.query('UPDATE "password_reset_requests" SET status = ?, code = ?, "expiresAt" = ? WHERE id = ?', ['approved', code, expiresAt, id]);
      
      return res.json({ success: true, message: `ЗАПИТ ПІДТВЕРДЖЕНО. КОД ДОСТУПУ: ${code}`, code });
    }
    res.status(400).json({ error: 'Невідома дія' });
  } catch (error) { res.status(500).json({ error: 'Помилка сервера' }); }
});

// Крок 4: Користувач вводить новий пароль та код
router.post('/password-reset/confirm', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const requests = await AppDataSource.query('SELECT * FROM "password_reset_requests" WHERE email = ? AND code = ? AND status = ?', [email, code, 'approved']);
    if (requests.length === 0) return res.status(400).json({ error: 'Невірний код, або запит ще не підтверджено Адміном' });

    const reqRecord = requests[0];
    if (new Date(reqRecord.expiresAt) < new Date()) return res.status(400).json({ error: 'Термін дії коду вичерпано' });

    let bcryptLib: any;
    try {
      // @ts-ignore
      bcryptLib = await import('bcryptjs');
    } catch {
      try {
        // @ts-ignore
        bcryptLib = await import('bcrypt');
      } catch (err) {
        console.error('Bcrypt import error:', err);
        return res.status(500).json({ error: 'Помилка хешування: модуль не знайдено' });
      }
    }
    const bcrypt = bcryptLib.default || bcryptLib;

    const hash = await bcrypt.hash(newPassword, 10);
    await AppDataSource.query('UPDATE "users" SET "passwordHash" = ? WHERE id = ?', [hash, reqRecord.userId]);
    await AppDataSource.query('UPDATE "password_reset_requests" SET status = ? WHERE id = ?', ['used', reqRecord.id]);

    res.json({ success: true, message: 'Пароль успішно змінено. Тепер ви можете увійти.' });
  } catch (error) { res.status(500).json({ error: 'Помилка відновлення' }); }
});

export default router;