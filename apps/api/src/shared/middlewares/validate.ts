import type { Request, Response, NextFunction } from 'express';
import AppError from '#shared/utils/error.ts';
import { z, type ZodSchema } from 'zod';

const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return next(new AppError('Validation error', 400, errors));
    }
    next(new AppError('Validation error', 400, (err as Error).message));
  }
};

export default validate;
