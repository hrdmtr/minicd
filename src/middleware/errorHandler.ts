import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const isOperational = 'isOperational' in err ? err.isOperational : false;

  // Log non-operational errors (programming errors) for debugging
  if (!isOperational) {
    console.error('Non-operational error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};