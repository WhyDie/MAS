import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { authService } from '../services/AuthService';
import { AppDataSource } from '../config/database';
import { InviteCode } from '../models/InviteCode';
import { generateInviteCode } from '../utils/inviteCode';

const inviteRepository = AppDataSource.getRepository(InviteCode);

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

      sendSuccess(
        res,
        { user: { id: user.id, email: user.email, role: user.role }, token },
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

      sendSuccess(
        res,
        { user: { id: user.id, email: user.email, role: user.role }, token },
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

      sendSuccess(res, { user: { id: user.id, email: user.email, role: user.role } });
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
}

export const authController = new AuthController();
