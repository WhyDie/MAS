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

      const { rank, position, civilProfession, icon } = req.body;

      // Оновлюємо поля
      if (rank !== undefined) (user as any).rank = rank;
      if (position !== undefined) (user as any).position = position;
      if (civilProfession !== undefined) (user as any).civilProfession = civilProfession;
      if (icon !== undefined) (user as any).icon = icon;

      await userRepository.save(user);

      const { passwordHash, ...userWithoutPassword } = user;
      sendSuccess(res, userWithoutPassword, 'Профіль успішно оновлено');
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
}

export const userController = new UserController();