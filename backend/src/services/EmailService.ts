import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    // Налаштуйте свої SMTP дані (напр. Gmail, SendGrid тощо) в .env
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      await this.transporter.sendMail({
        from: `"Система Адаптації ЗСУ" <${process.env.SMTP_USER}>`,
        to,
        subject: `[Військова Система] ${subject}`,
        text,
        html: html || `<div style="font-family: monospace; padding: 20px; border: 1px solid #333; background: #0a0a0a; color: #fff;"><h3>${subject}</h3><p>${text}</p></div>`,
      });
      console.log(`✉️ Email sent to ${to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      // Не кидаємо помилку далі, щоб не блокувати основний процес (наприклад, створення запиту)
    }
  }
}