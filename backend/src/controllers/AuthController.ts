import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { authService } from '../services/AuthService';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { InviteCode } from '../models/InviteCode';
import { generateInviteCode } from '../utils/inviteCode';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const inviteRepository = AppDataSource.getRepository(InviteCode);

// --- TOTP (Authenticator) Справжня логіка генерації та перевірки ---
const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function generateBase32Secret() {
  let secret = '';
  for (let i = 0; i < 16; i++) { secret += base32chars[Math.floor(Math.random() * base32chars.length)]; }
  return secret;
}
function base32ToBuffer(base32: string) {
  let bits = 0, value = 0, index = 0;
  const output = new Uint8Array(Math.ceil(base32.length * 5 / 8));
  for (let i = 0; i < base32.length; i++) {
    value = (value << 5) | base32chars.indexOf(base32[i].toUpperCase());
    bits += 5;
    if (bits >= 8) { output[index++] = (value >>> (bits - 8)) & 255; bits -= 8; }
  }
  return Buffer.from(output.buffer);
}
function generateTOTP(secretBase32: string, timeOffset = 0) {
  const key = base32ToBuffer(secretBase32);
  const time = Math.floor(Date.now() / 1000 / 30) + timeOffset;
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(time / 0x100000000), 0); buf.writeUInt32BE(time % 0x100000000, 4);
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, '0');
}
function verifyTOTP(secretBase32: string, token: string) {
  for (let offset = -1; offset <= 1; offset++) { if (generateTOTP(secretBase32, offset) === token) return true; }
  return false;
}

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, inviteCode } = req.body;

      if (!email || !password || !firstName || !lastName || !inviteCode) {
        sendError(res, 'Missing required fields', 400);
        return;
      }

      // Verify invite code
      const invite = await inviteRepository.findOne({
        where: { code: inviteCode, isUsed: false },
      });

      if (!invite || invite.expiresAt < new Date()) {
        sendError(res, 'Invalid or expired invite code', 400);
        return;
      }

      const { user, token } = await authService.registerWithInvite(
        email,
        password,
        firstName,
        lastName,
        inviteCode
      );

      // Mark invite as used
      invite.isUsed = true;
      invite.usedAt = new Date();
      invite.usedByUserId = user.id;
      await inviteRepository.save(invite);

      const userData = { 
        ...user, 
        callsign: '', 
        twoFactorStatus: { isAuthenticatorEnabled: false, isEmailCodeEnabled: false, isBiometricsEnabled: false } 
      };

      sendSuccess(
        res,
        { user: userData, token },
        'Registration successful',
        201
      );
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Registration failed', 400);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        sendError(res, 'Email and password required', 400);
        return;
      }

      const { user, token } = await authService.login(email, password);

      // Перевірка 2FA при логіні
      const ext = await AppDataSource.query('SELECT * FROM "user_ext" WHERE "userId" = ?', [user.id]);
      const userExt = ext[0];
      const methods = [];
      if (userExt?.isAuthenticatorEnabled) methods.push('authenticator');
      if (userExt?.isEmailCodeEnabled) methods.push('email');
      if (userExt?.isBiometricsEnabled) methods.push('biometrics');

      if (methods.length > 0) {
        const tempToken = jwt.sign({ tempId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
        sendSuccess(res, { require2FA: true, tempToken, methods }, '2FA required', 200);
        return;
      }

      const userData = {
        ...user,
        callsign: userExt?.callsign || '',
        twoFactorStatus: { isAuthenticatorEnabled: !!userExt?.isAuthenticatorEnabled, isEmailCodeEnabled: !!userExt?.isEmailCodeEnabled, isBiometricsEnabled: !!userExt?.isBiometricsEnabled }
      };

      sendSuccess(
        res,
        { user: userData, token },
        'Login successful',
        200
      );
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Login failed', 401);
    }
  }

  async validateToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'No user', 401);
        return;
      }

      const user = await authService.validateToken(req.user.userId);

      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      const ext = await AppDataSource.query('SELECT * FROM "user_ext" WHERE "userId" = ?', [user.id]);
      const userData = {
        ...user,
        callsign: ext[0]?.callsign || '',
        twoFactorStatus: { isAuthenticatorEnabled: !!ext[0]?.isAuthenticatorEnabled, isEmailCodeEnabled: !!ext[0]?.isEmailCodeEnabled, isBiometricsEnabled: !!ext[0]?.isBiometricsEnabled }
      };

      sendSuccess(res, { user: userData });
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Validation failed', 400);
    }
  }

  async createInviteCode(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const { role, expiresIn } = req.body;

      // Check permissions
      if (req.user.role !== 'commander' && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        sendError(res, 'Insufficient permissions', 403);
        return;
      }

      // Commanders can only create recruit and mentor codes
      if (req.user.role === 'commander' && !['recruit', 'mentor'].includes(role)) {
        sendError(res, 'Commanders can only create recruit and mentor codes', 403);
        return;
      }

      // Admins can create all except superadmin
      if (req.user.role === 'admin' && role === 'superadmin') {
        sendError(res, 'Only superadmins can create superadmin codes', 403);
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (expiresIn || 7));

      const code = await inviteRepository.save({
        code: generateInviteCode(),
        createdByUserId: req.user.userId,
        defaultRole: role,
        expiresAt,
        unitId: req.user.unitId,
      });

      sendSuccess(res, {
        id: code.id,
        code: code.code,
        defaultRole: code.defaultRole,
        expiresAt: code.expiresAt,
        createdAt: code.createdAt,
      }, 'Invite code created', 201);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to create code', 400);
    }
  }

  async getInviteCodes(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      let codes;
      if (req.user.role === 'superadmin') {
        codes = await inviteRepository.find();
      } else {
        codes = await inviteRepository.find({
          where: { createdByUserId: req.user.userId },
        });
      }

      sendSuccess(res, codes);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch codes', 500);
    }
  }

  // --- 2FA Methods ---
  
  async generateAuthenticator(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
      const users = await AppDataSource.query('SELECT email FROM "users" WHERE id = ?', [req.user.userId]);
      if (!users[0]) { sendError(res, 'User not found', 404); return; }

      const secret = generateBase32Secret();
      const otpAuthUrl = `otpauth://totp/MilitarySystem:${users[0].email}?secret=${secret}&issuer=MilitarySystem`;
      await AppDataSource.query('INSERT INTO "user_ext" ("userId", "twoFactorSecret") VALUES (?, ?) ON CONFLICT("userId") DO UPDATE SET "twoFactorSecret" = excluded."twoFactorSecret"', [req.user.userId, secret]);

      sendSuccess(res, { secret, otpAuthUrl }, 'Authenticator generated');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Generation failed', 500);
    }
  }

  async verifyAuthenticator(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
      const { code } = req.body;
      
      const rawUser = await AppDataSource.query('SELECT "twoFactorSecret" FROM "user_ext" WHERE "userId" = ?', [req.user.userId]);
      const isValid = verifyTOTP(rawUser[0]?.twoFactorSecret || '', code);
      if (!isValid) {
        sendError(res, 'Невірний код', 400);
        return;
      }

      await AppDataSource.query('UPDATE "user_ext" SET "isAuthenticatorEnabled" = 1 WHERE "userId" = ?', [req.user.userId]);

      sendSuccess(res, null, 'Authenticator enabled');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Verification failed', 500);
    }
  }

  async disable2FA(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
      const { method } = req.body;

      if (method === 'authenticator') await AppDataSource.query('UPDATE "user_ext" SET "isAuthenticatorEnabled" = 0, "twoFactorSecret" = NULL WHERE "userId" = ?', [req.user.userId]);
      if (method === 'biometrics') await AppDataSource.query('UPDATE "user_ext" SET "isBiometricsEnabled" = 0, "webAuthnCredentialId" = NULL WHERE "userId" = ?', [req.user.userId]);
      if (method === 'email') await AppDataSource.query('UPDATE "user_ext" SET "isEmailCodeEnabled" = 0, "emailFor2FA" = NULL WHERE "userId" = ?', [req.user.userId]);

      sendSuccess(res, null, '2FA method disabled');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to disable 2FA', 500);
    }
  }

  async setupBiometrics(req: Request, res: Response): Promise<void> {
    try {
      const { credentialId } = req.body;
      await AppDataSource.query('INSERT INTO "user_ext" ("userId", "isBiometricsEnabled", "webAuthnCredentialId") VALUES (?, 1, ?) ON CONFLICT("userId") DO UPDATE SET "isBiometricsEnabled" = 1, "webAuthnCredentialId" = excluded."webAuthnCredentialId"', [req.user!.userId, credentialId]);
      sendSuccess(res, null, 'Biometrics setup successful');
    } catch (error) { sendError(res, 'Failed to setup biometrics', 500); }
  }

  async setupEmail2FA(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await AppDataSource.query('INSERT INTO "user_ext" ("userId", "isEmailCodeEnabled", "emailFor2FA") VALUES (?, 1, ?) ON CONFLICT("userId") DO UPDATE SET "isEmailCodeEnabled" = 1, "emailFor2FA" = excluded."emailFor2FA"', [req.user!.userId, email]);
      sendSuccess(res, { isEnabled: true }, 'Email setup successful');
    } catch (error) { sendError(res, 'Failed to setup email 2FA', 500); }
  }

  async toggleEmail2FA(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Unauthorized', 401); return; }

      const rawUser = await AppDataSource.query('SELECT "isEmailCodeEnabled" FROM "user_ext" WHERE "userId" = ?', [req.user.userId]);
      const newState = rawUser[0]?.isEmailCodeEnabled ? 0 : 1;
      
      await AppDataSource.query('INSERT INTO "user_ext" ("userId", "isEmailCodeEnabled") VALUES (?, ?) ON CONFLICT("userId") DO UPDATE SET "isEmailCodeEnabled" = excluded."isEmailCodeEnabled"', [req.user.userId, newState]);
      sendSuccess(res, { isEnabled: !!newState }, 'Email 2FA toggled');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Toggle failed', 500);
    }
  }

  async sendLoginEmailCode(req: Request, res: Response): Promise<void> {
    try {
      const { tempToken } = req.body;
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret') as any;
      const code = crypto.randomInt(100000, 1000000).toString();
      await AppDataSource.query('UPDATE "user_ext" SET "emailCode2FA" = ? WHERE "userId" = ?', [code, decoded.tempId]);
      
      const userExt = await AppDataSource.query('SELECT "emailFor2FA" FROM "user_ext" WHERE "userId" = ?', [decoded.tempId]);
      const userCore = await AppDataSource.query('SELECT "email" FROM "users" WHERE id = ?', [decoded.tempId]);
      const targetEmail = userExt[0]?.emailFor2FA || userCore[0]?.email;
      
      console.log(`\n\n🛡️ [БЕЗПЕКА] КОД 2FA ДЛЯ ${targetEmail}: ${code} \n\n`);

      // Реальна відправка листа
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"Система Адаптації ЗСУ" <noreply@military-system.ua>',
          to: targetEmail,
          subject: 'Код підтвердження (2FA) - Система Адаптації',
          text: `Ваш код для входу: ${code}. Нікому не передавайте його.`,
          html: `<div style="font-family: sans-serif; padding: 20px; max-w: 600px; margin: 0 auto; border: 1px solid #333; background: #0a0a0a; color: #fff;">
            <h2 style="color: #c9a227; text-transform: uppercase; letter-spacing: 2px;">Авторизація в системі</h2>
            <p style="color: #aaa;">Ваш одноразовий код доступу:</p>
            <div style="background: #111; padding: 15px; text-align: center; border: 1px solid #333; margin: 20px 0;">
              <span style="color: #c9a227; font-size: 36px; font-family: monospace; letter-spacing: 8px; font-weight: bold;">${code}</span>
            </div>
            <p style="color: #ef4444; font-size: 12px;">⚠️ Нікому не повідомляйте цей код. Якщо це були не ви, негайно зверніться до адміністратора.</p>
          </div>`,
        });
      }

      sendSuccess(res, null, 'Code sent');
    } catch (error) { sendError(res, 'Failed to send code', 500); }
  }

  async verifyLogin2FA(req: Request, res: Response): Promise<void> {
    try {
      const { tempToken, method, code, credentialId } = req.body;
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret') as any;
      const users = await AppDataSource.query('SELECT * FROM "users" WHERE id = ?', [decoded.tempId]);
      const user = users[0];
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      const extArr = await AppDataSource.query('SELECT * FROM "user_ext" WHERE "userId" = ?', [decoded.tempId]);
      const userExt = extArr[0];

      let isValid = false;
      if (method === 'authenticator' && userExt?.isAuthenticatorEnabled) { isValid = verifyTOTP(userExt.twoFactorSecret, code); }
      else if (method === 'email' && userExt?.isEmailCodeEnabled) { isValid = userExt.emailCode2FA === code; }
      else if (method === 'biometrics' && userExt?.isBiometricsEnabled) { isValid = userExt.webAuthnCredentialId === credentialId; }

      if (!isValid) {
        sendError(res, 'Невірний код або метод перевірки', 400);
        return;
      }
      if (method === 'email') await AppDataSource.query('UPDATE "user_ext" SET "emailCode2FA" = NULL WHERE "userId" = ?', [user.id]);

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: (process.env.JWT_EXPIRE || '7d') as any });
      const userData = {
        ...user,
        callsign: userExt?.callsign || '',
        twoFactorStatus: { isAuthenticatorEnabled: !!userExt?.isAuthenticatorEnabled, isEmailCodeEnabled: !!userExt?.isEmailCodeEnabled, isBiometricsEnabled: !!userExt?.isBiometricsEnabled }
      };
      sendSuccess(res, { user: userData, token }, 'Login successful');
    } catch (error) { sendError(res, '2FA verification failed', 500); }
  }
}

export const authController = new AuthController();
