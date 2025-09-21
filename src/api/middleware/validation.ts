import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'

export const validatePhoneNumber = (req: Request, res: Response, next: NextFunction) => {
  const { phone } = req.body
  
  if (!phone) {
    return next(new AppError('Phone number is required', 400))
  }

  // Basic phone number validation (Pakistani format)
  const phoneRegex = /^\+92[0-9]{10}$/
  if (!phoneRegex.test(phone)) {
    return next(new AppError('Invalid phone number format. Use +92XXXXXXXXXX', 400))
  }

  next()
}

export const validateCustomer = (req: Request, res: Response, next: NextFunction) => {
  const { name, phone, address, deliveryArea } = req.body

  if (!name || !phone || !address || !deliveryArea) {
    return next(new AppError('Name, phone, address, and delivery area are required', 400))
  }

  next()
}

export const validateDelivery = (req: Request, res: Response, next: NextFunction) => {
  const { customerId, bottlesDelivered, emptyBottlesCollected, totalAmount } = req.body

  if (!customerId || bottlesDelivered === undefined || emptyBottlesCollected === undefined || !totalAmount) {
    return next(new AppError('Customer ID, bottles delivered, empty bottles collected, and total amount are required', 400))
  }

  if (bottlesDelivered < 0 || emptyBottlesCollected < 0 || totalAmount < 0) {
    return next(new AppError('Values cannot be negative', 400))
  }

  next()
}

export const validateInvoice = (req: Request, res: Response, next: NextFunction) => {
  const { customerId, totalAmount, items } = req.body

  if (!customerId || !totalAmount || !items || !Array.isArray(items)) {
    return next(new AppError('Customer ID, total amount, and items are required', 400))
  }

  if (totalAmount <= 0) {
    return next(new AppError('Total amount must be greater than 0', 400))
  }

  next()
}

export const validateVacation = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate, reason, resumptionDate } = req.body

  if (!startDate || !endDate || !reason || !resumptionDate) {
    return next(new AppError('Start date, end date, reason, and resumption date are required', 400))
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const resumption = new Date(resumptionDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(resumption.getTime())) {
    return next(new AppError('Invalid date format', 400))
  }

  if (start >= end || end >= resumption) {
    return next(new AppError('Invalid date sequence', 400))
  }

  next()
}
