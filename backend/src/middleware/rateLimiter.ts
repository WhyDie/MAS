import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

// Rate limiter store
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Configuration
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // max requests per window
const MAX_AUTH_REQUESTS = 5; // max auth requests per window

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Stricter limits for auth endpoints
  const isAuthEndpoint = req.path.includes('/auth/login') || req.path.includes('/auth/register');
  const maxRequests = isAuthEndpoint ? MAX_AUTH_REQUESTS : MAX_REQUESTS;

  let record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + WINDOW_MS };
    requestCounts.set(ip, record);
  } else {
    record.count++;
  }

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

  if (record.count > maxRequests) {
    sendError(res, 'Too many requests, please try again later', 429);
    return;
  }

  next();
}

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 60 * 60 * 1000);
