import { User } from '../models/User';
import { AppDataSource } from '../config/database';
import { hashPassword, verifyPassword, encryptData, decryptData } from '../utils/encryption';
import { generateAccessToken } from '../utils/jwt';
import { UserRole } from '../types/index';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async registerWithInvite(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    inviteCode: string
  ): Promise<{ user: User; token: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Find and validate invite code
    const { InviteCode } = await import('../models/InviteCode');
    const inviteCodeRepo = AppDataSource.getRepository(InviteCode);
    const code = await inviteCodeRepo.findOne({
      where: { code: inviteCode, isUsed: false },
    });

    if (!code) {
      throw new Error('Invalid or expired invite code');
    }

    if (code.expiresAt < new Date()) {
      throw new Error('Invite code has expired');
    }

    const user = new User();
    user.email = email;
    user.passwordHash = hashPassword(password);
    user.firstName = firstName;
    user.lastName = lastName;
    
    // Use the role from the invite code
    user.role = code.defaultRole as UserRole;

    const savedUser = await this.userRepository.save(user);

    // Mark invite code as used
    code.isUsed = true;
    code.usedByUserId = savedUser.id;
    code.usedAt = new Date();
    await inviteCodeRepo.save(code);

    const token = generateAccessToken({
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    });

    return { user: savedUser, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!verifyPassword(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      unitId: user.unitId,
    });

    return { user, token };
  }

  async validateToken(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    user.preferences = preferences;
    return this.userRepository.save(user);
  }
}

export const authService = new AuthService();
