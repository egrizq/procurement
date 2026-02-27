import AppError from '#shared/utils/error.ts';
import { z } from 'zod';

const validate = (schema) => (req, res, next) => {
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
    next(new AppError('Validation error', 400, err.message));
  }
};

export default validate;
