import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
};

export const notFoundMiddleware = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'Route not found' });
};
