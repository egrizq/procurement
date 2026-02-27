import type { Request, Response, NextFunction } from 'express';
import { error } from '#shared/utils/response.ts';

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return error(res, message, statusCode, err.errors || null);
};

export default errorHandler;
