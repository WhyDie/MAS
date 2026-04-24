import { Response } from 'express';
import { ApiResponse } from '../types/index';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date(),
  } as ApiResponse<T>);
}

export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400,
  message?: string
): Response {
  return res.status(statusCode).json({
    success: false,
    error,
    message: message || error,
    timestamp: new Date(),
  } as ApiResponse);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    timestamp: new Date(),
  });
}
