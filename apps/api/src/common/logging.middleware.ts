import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export function httpRequestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    Logger.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`,
      'HTTP',
    );
  });

  next();
}
