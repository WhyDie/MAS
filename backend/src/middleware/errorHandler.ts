import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { config } from '../config/config';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (config.app.nodeEnv === 'development') {
    sendError(res, message, statusCode, err.stack);
  } else {
    sendError(res, message, statusCode);
  }
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  sendError(res, `Route not found: ${req.method} ${req.path}`, 404);
}
