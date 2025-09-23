import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'
import multer from 'multer'

// Configure multer for file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true)
  }
})

/**
 * Validate send message request (FormData)
 */
export const validateSendMessage = (req: Request, res: Response, next: NextFunction) => {
  const { clientId, phone, text } = req.body
  const file = req.file

  // Validate required fields
  if (!clientId) {
    return next(new AppError('clientId is required', 400))
  }

  if (!phone) {
    return next(new AppError('phone number is required', 400))
  }

  // Validate phone number format
  const phoneRegex = /^\+92[0-9]{10}$/
  if (!phoneRegex.test(phone)) {
    return next(new AppError('Invalid phone number format. Use +92XXXXXXXXXX', 400))
  }

  // Validate that either message or file is provided
  if (!text && !file) {
    return next(new AppError('Either message or file is required', 400))
  }

  // Validate file if provided
  if (file) {
    if (!file.originalname) {
      return next(new AppError('File must have a filename', 400))
    }

    if (!file.mimetype) {
      return next(new AppError('File must have a MIME type', 400))
    }
  }

  // Validate message if provided
  if (text && typeof text !== 'string') {
    return next(new AppError('Message must be a string', 400))
  }

  next()
}

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+92[0-9]{10}$/
  return phoneRegex.test(phone)
}

/**
 * Validate base64 string
 */
export const validateBase64 = (str: string): boolean => {
  try {
    return btoa(atob(str)) === str
  } catch (err) {
    return false
  }
}