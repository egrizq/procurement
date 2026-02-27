import { describe, it, expect } from 'vitest';
import AppError from './error';

describe('AppError', () => {
  it('should create an error with default values', () => {
    const error = new AppError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.errors).toBe(null);
    expect(error.isOperational).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should create an error with custom status code', () => {
    const error = new AppError('Not found', 404);

    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.errors).toBe(null);
    expect(error.isOperational).toBe(true);
  });

  it('should create an error with validation errors', () => {
    const validationErrors = [
      { field: 'email', message: 'Invalid email' },
      { field: 'password', message: 'Too short' },
    ];
    const error = new AppError('Validation failed', 400, validationErrors);

    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.errors).toEqual(validationErrors);
    expect(error.isOperational).toBe(true);
  });

  it('should be an instance of Error', () => {
    const error = new AppError('Test');
    
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AppError).toBe(true);
  });

  it('should have correct error stack', () => {
    const error = new AppError('Stack test');
    
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Stack test');
  });
});
