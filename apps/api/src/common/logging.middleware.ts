import type { NextFunction, Request, Response } from 'express';


export function httpRequestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const { statusCode } = res;
    
    // Log with clear prefix for visibility
    console.log(
      `[HTTP] ${method} ${originalUrl} ${statusCode} - ${durationMs}ms`,
    );
  });

  next();
}
