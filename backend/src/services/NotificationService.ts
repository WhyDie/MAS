import { AppDataSource } from '../config/database';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { EmailService } from './EmailService';

export class NotificationService {
  private notificationRepo = AppDataSource.getRepository(Notification);
  private userRepo = AppDataSource.getRepository(User);
  private emailService = new EmailService();

  /**
   * Створення сповіщення для одного користувача з опціональною відправкою email
   */
  async notifyUser(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    link?: string,
    severity: Notification['severity'] = 'info',
    sendEmail: boolean = true
  ) {
    // 1. Зберігаємо в БД (In-App notification)
    const notification = this.notificationRepo.create({
      userId,
      title,
      message,
      type,
      link,
      severity,
    });
    await this.notificationRepo.save(notification);

    // 2. Відправляємо Email, якщо потрібно
    if (sendEmail) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user && user.email) {
        await this.emailService.sendEmail(user.email, title, message);
      }
    }
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string) {
    await this.notificationRepo.update({ id, userId }, { isRead: true });
  }
}