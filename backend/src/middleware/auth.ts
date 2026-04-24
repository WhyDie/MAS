import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { getTokenFromHeader, verifyToken } from '../utils/jwt';
import { JWTPayload } from '../types/index';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      sendError(res, 'No token provided', 401, 'Unauthorized');
      return;
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      sendError(res, 'Invalid token', 401, 'Unauthorized');
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    sendError(res, 'Authentication failed', 401, 'Unauthorized');
  }
}

export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        req.user = payload;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
}

export function roleMiddleware(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403, 'Forbidden');
      return;
    }

    next();
  };
}
