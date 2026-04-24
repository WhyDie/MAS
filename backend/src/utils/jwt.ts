import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { JWTPayload } from '../types/index';

// Access token: 15 minutes
const ACCESS_TOKEN_EXPIRY = '15m';
// Refresh token: 7 days
const REFRESH_TOKEN_EXPIRY = '7d';

export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload as jwt.JwtPayload, config.jwt.secret as string, {
    expiresIn: ACCESS_TOKEN_EXPIRY as any,
  });
}

export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload as jwt.JwtPayload, config.jwt.secret as string, {
    expiresIn: REFRESH_TOKEN_EXPIRY as any,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1];
}
