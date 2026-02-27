import { error } from '#shared/utils/response.ts';

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return error(res, message, statusCode, err.errors || null);
};

export default errorHandler;
