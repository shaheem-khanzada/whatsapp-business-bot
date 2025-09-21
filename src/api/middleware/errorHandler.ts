import { Request, Response, NextFunction } from 'express'

export interface ApiError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export class AppError extends Error implements ApiError {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error('API Error:', err)

  // Default error
  if (!error.statusCode) {
    error.statusCode = 500
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404)
  next(error)
}
