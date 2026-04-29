import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const message = err instanceof Error ? err.message : 'Internal server error';
  const status = (err as { status?: number }).status ?? 500;

  if (status >= 500) {
    console.error('[Error]', err);
  }

  res.status(status).json({ error: message });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}
