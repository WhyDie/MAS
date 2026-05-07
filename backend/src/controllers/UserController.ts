import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { hashPassword, verifyPassword } from '../utils/encryption';

export class UserController {
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: (req.user as any).userId } });

      if (!user) {
        sendError(res, 'Користувача не знайдено', 404);
        return;
      }

      const { firstName, lastName, callsign, rank, position, civilProfession, icon } = req.body;

      // Оновлюємо поля
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (callsign !== undefined) (user as any).callsign = callsign;
      if (rank !== undefined) (user as any).rank = rank;
      if (position !== undefined) (user as any).position = position;
      if (civilProfession !== undefined) (user as any).civilProfession = civilProfession;
      if (icon !== undefined) (user as any).icon = icon;

      await userRepository.save(user);

      await AppDataSource.query('INSERT INTO "user_ext" ("userId", "callsign") VALUES (?, ?) ON CONFLICT("userId") DO UPDATE SET "callsign" = excluded."callsign"', [user.id, callsign || '']);
      const rawUserResult = await AppDataSource.query('SELECT * FROM "user_ext" WHERE "userId" = ?', [user.id]);
      const userExt = rawUserResult[0] || {};

      const { passwordHash, ...userWithoutPassword } = user;
      const updatedUser = {
        ...userWithoutPassword,
        callsign: callsign || '',
        twoFactorStatus: { 
          isAuthenticatorEnabled: !!userExt.isAuthenticatorEnabled, 
          isEmailCodeEnabled: !!userExt.isEmailCodeEnabled, 
          isBiometricsEnabled: !!userExt.isBiometricsEnabled 
        }
      };

      sendSuccess(res, updatedUser, 'Профіль успішно оновлено');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Помилка оновлення профілю', 500);
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: (req.user as any).userId } });
      if (!user) { sendError(res, 'Користувача не знайдено', 404); return; }

      const { currentPassword, newPassword } = req.body;
      const isMatch = verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) { sendError(res, 'Невірний поточний пароль', 400); return; }

      user.passwordHash = hashPassword(newPassword);
      await userRepository.save(user);

      sendSuccess(res, null, 'Пароль успішно змінено');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Помилка зміни пароля', 500);
    }
  }

  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: (req.user as any).userId } });
      if (!user) { sendError(res, 'Користувача не знайдено', 404); return; }

      user.isActive = false; // М'яке видалення, щоб не ламати пов'язані таблиці (статистику, розклад)
      await userRepository.save(user);
      sendSuccess(res, null, 'Акаунт успішно видалено');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Помилка видалення акаунту', 500);
    }
  }
}

export const userController = new UserController();