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
  // Default error
  if (!error.statusCode) {
    error.statusCode = 500
  }

  // Determine error type and message
  let errorMessage = error.message || 'Internal Server Error'
  let errorType = 'INTERNAL_ERROR'

  if (error.statusCode === 400) {
    errorType = 'VALIDATION_ERROR'
  } else if (error.statusCode === 401) {
    errorType = 'UNAUTHORIZED'
  } else if (error.statusCode === 403) {
    errorType = 'FORBIDDEN'
  } else if (error.statusCode === 404) {
    errorType = 'NOT_FOUND'
  } else if (error.statusCode === 409) {
    errorType = 'CONFLICT'
  } else if (error.statusCode === 422) {
    errorType = 'UNPROCESSABLE_ENTITY'
  } else if (error.statusCode >= 500) {
    errorType = 'INTERNAL_ERROR'
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      type: errorType,
      message: errorMessage,
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    },
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  })
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404)
  next(error)
}
