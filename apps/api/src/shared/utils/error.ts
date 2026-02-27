class AppError extends Error {
  statusCode: number;
  errors: unknown;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, errors: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

export default AppError;
