import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

const router = Router();

router.post('/save-simulator', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);
    
    const { simulatorId, score, total } = req.body;
    
    await AppDataSource.query(
      'INSERT INTO "xt_simulator_attempts" ("id", "userId", "simulatorId", "score", "maxScore") VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), userId, String(simulatorId), Number(score) || 0, Number(total) || 100]
    );
    
    sendSuccess(res, null, 'Saved');
  } catch (error) {
    sendError(res, 'Помилка збереження', 500);
  }
});

router.post('/save-module', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);
    
    const { moduleId } = req.body;
    
    const existing = await AppDataSource.query('SELECT id FROM "xt_user_progress" WHERE "userId" = ? AND "moduleId" = ?', [userId, String(moduleId)]);
    if (existing.length > 0) {
      await AppDataSource.query('UPDATE "xt_user_progress" SET "status" = ?, "progress" = 100, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?', ['completed', existing[0].id]);
    } else {
      await AppDataSource.query('INSERT INTO "xt_user_progress" ("id", "userId", "moduleId", "status", "progress") VALUES (?, ?, ?, ?, ?)', [crypto.randomUUID(), userId, String(moduleId), 'completed', 100]);
    }
    
    sendSuccess(res, null, 'Saved');
  } catch (error) {
    sendError(res, 'Помилка збереження', 500);
  }
});

router.get('/stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return sendError(res, 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = String(decoded.userId || decoded.id || decoded.tempId);

    // 1. Модулі (user_progress)
    let modulesCompleted = 0;
    try {
      const modRes = await AppDataSource.query(`SELECT COUNT(DISTINCT "moduleId") as cnt FROM "xt_user_progress" WHERE "userId" = ? AND "status" = 'completed'`, [userId]);
      modulesCompleted = parseInt(modRes[0]?.cnt || 0);
    } catch(e) {}

    // 2. Симулятори
    let simAttempts = 0;
    let perfectSims = 0;
    let simAverageScore = 0;
    try {
      const simRes = await AppDataSource.query(`SELECT score, "maxScore" FROM "xt_simulator_attempts" WHERE "userId" = ?`, [userId]);
      simAttempts = simRes.length;
      perfectSims = simRes.filter((a: any) => a.score === a.maxScore && a.maxScore > 0).length;
      
      let totalPct = 0;
      simRes.forEach((a: any) => {
        if (a.maxScore > 0) totalPct += Math.min(100, (a.score / a.maxScore) * 100);
      });
      if (simAttempts > 0) simAverageScore = Math.round(totalPct / simAttempts);
    } catch(e) {}

    // 3. Менторство
    let mentorshipCompleted = 0;
    try {
      const menRes = await AppDataSource.query(`SELECT COUNT(*) as cnt FROM "mentorship_requests" WHERE "recruitId" = ? AND status IN ('completed', 'resolved')`, [userId]);
      mentorshipCompleted = parseInt(menRes[0]?.cnt || 0);
    } catch(e) {}

    // 4. Психолог
    let psychRequests = 0;
    try {
      const psychRes = await AppDataSource.query(`SELECT COUNT(*) as cnt FROM "psychological_support" WHERE "userId" = ?`, [userId]);
      psychRequests = parseInt(psychRes[0]?.cnt || 0);
    } catch(e) {}

    // 5. Розрахунок днів служби (ДМБ Трекер)
    let daysServed = 0;
    let serviceStartDate = null;
    let contractEndDate = null;
    try {
      const userRes = await AppDataSource.query(`SELECT "serviceStartDate", "contractEndDate" FROM "users" WHERE id = ?`, [userId]);
      if (userRes[0] && userRes[0].serviceStartDate) {
        serviceStartDate = userRes[0].serviceStartDate;
        contractEndDate = userRes[0].contractEndDate;
        const start = new Date(serviceStartDate).getTime();
        const now = new Date().getTime();
        if (now > start) {
          daysServed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        }
      }
    } catch(e) {}

    // 5. Розрахунок загального досвіду (XP)
    // Додаємо +10 XP за кожен день служби
    const xp = (modulesCompleted * 100) + 
               (simAttempts * 50) + 
               (perfectSims * 100) + 
               (mentorshipCompleted * 200) + 
               (psychRequests * 50) + 
               (daysServed * 10);

    sendSuccess(res, {
      modulesCompleted,
      simAttempts,
      perfectSims,
      simAverageScore,
      mentorshipCompleted,
      psychRequests,
      xp,
      daysServed,
      serviceStartDate,
      contractEndDate
    });
  } catch (error) {
    sendError(res, 'Помилка сервера', 500);
  }
});

export default router;