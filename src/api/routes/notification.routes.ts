import { Router, Request, Response } from 'express'
import { NotificationService } from '../../services/notification.service'
import { WhatsAppService } from '../../services/whatsapp.service'
import { validateVacation, validatePhoneNumber } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import { Customer, VacationNotification, Notification } from '../../types/business'

const router = Router()

// Initialize services
const whatsappService = new WhatsAppService()
const notificationService = new NotificationService(whatsappService)

/**
 * @route   POST /api/notifications/announcement
 * @desc    Send service announcement to all customers
 * @access  Public
 */
router.post('/announcement', async (req: Request, res: Response) => {
  try {
    const { title, message, customerIds, targetArea } = req.body

    if (!title || !message) {
      throw new AppError('Title and message are required', 400)
    }

    // In a real app, you'd fetch customers from database
    let customers: Customer[] = customerIds ? 
      customerIds.map((id: string) => ({
        id,
        name: 'Customer',
        phone: '+923161137297',
        address: 'Address',
        deliveryArea: targetArea || 'Area',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })) : [
        {
          id: '1',
          name: 'Shaheem Khan',
          phone: '+923161137297',
          address: '123 Main Street, Karachi',
          deliveryArea: targetArea || 'Gulshan-e-Iqbal',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

    if (targetArea) {
      await notificationService.sendAreaNotification(customers, targetArea, title, message)
    } else {
      await notificationService.sendServiceAnnouncement(customers, title, message)
    }

    res.json({
      success: true,
      message: `Announcement sent to ${customers.length} customers`,
      data: { title, message, targetArea }
    })
  } catch (error) {
    throw new AppError(`Failed to send announcement: ${error}`, 500)
  }
})

/**
 * @route   POST /api/notifications/delivery-delay
 * @desc    Send delivery delay notification
 * @access  Public
 */
router.post('/delivery-delay', async (req: Request, res: Response) => {
  try {
    const { customerIds, reason, estimatedDelay } = req.body

    if (!customerIds || !Array.isArray(customerIds) || !reason) {
      throw new AppError('Customer IDs and reason are required', 400)
    }

    // In a real app, you'd fetch customers from database
    const customers: Customer[] = customerIds.map((id: string) => ({
      id,
      name: 'Customer',
      phone: '+923161137297',
      address: 'Address',
      deliveryArea: 'Area',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    await notificationService.sendDeliveryDelayNotification(customers, reason, estimatedDelay)

    res.json({
      success: true,
      message: `Delay notifications sent to ${customers.length} customers`,
      data: { reason, estimatedDelay }
    })
  } catch (error) {
    throw new AppError(`Failed to send delay notifications: ${error}`, 500)
  }
})

/**
 * @route   POST /api/notifications/service-resumption
 * @desc    Send service resumption notification
 * @access  Public
 */
router.post('/service-resumption', async (req: Request, res: Response) => {
  try {
    const { customerIds, resumptionDate } = req.body

    if (!customerIds || !Array.isArray(customerIds) || !resumptionDate) {
      throw new AppError('Customer IDs and resumption date are required', 400)
    }

    // In a real app, you'd fetch customers from database
    const customers: Customer[] = customerIds.map((id: string) => ({
      id,
      name: 'Customer',
      phone: '+923161137297',
      address: 'Address',
      deliveryArea: 'Area',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    await notificationService.sendServiceResumptionNotification(customers, new Date(resumptionDate))

    res.json({
      success: true,
      message: `Resumption notifications sent to ${customers.length} customers`,
      data: { resumptionDate }
    })
  } catch (error) {
    throw new AppError(`Failed to send resumption notifications: ${error}`, 500)
  }
})

/**
 * @route   POST /api/notifications/emergency
 * @desc    Send emergency notification
 * @access  Public
 */
router.post('/emergency', async (req: Request, res: Response) => {
  try {
    const { customerIds, message } = req.body

    if (!customerIds || !Array.isArray(customerIds) || !message) {
      throw new AppError('Customer IDs and message are required', 400)
    }

    // In a real app, you'd fetch customers from database
    const customers: Customer[] = customerIds.map((id: string) => ({
      id,
      name: 'Customer',
      phone: '+923161137297',
      address: 'Address',
      deliveryArea: 'Area',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    await notificationService.sendEmergencyNotification(customers, message)

    res.json({
      success: true,
      message: `Emergency notifications sent to ${customers.length} customers`,
      data: { message }
    })
  } catch (error) {
    throw new AppError(`Failed to send emergency notifications: ${error}`, 500)
  }
})

/**
 * @route   POST /api/notifications/weather-alert
 * @desc    Send weather alert
 * @access  Public
 */
router.post('/weather-alert', async (req: Request, res: Response) => {
  try {
    const { customerIds, weatherCondition, impact } = req.body

    if (!customerIds || !Array.isArray(customerIds) || !weatherCondition || !impact) {
      throw new AppError('Customer IDs, weather condition, and impact are required', 400)
    }

    // In a real app, you'd fetch customers from database
    const customers: Customer[] = customerIds.map((id: string) => ({
      id,
      name: 'Customer',
      phone: '+923161137297',
      address: 'Address',
      deliveryArea: 'Area',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    await notificationService.sendWeatherAlert(customers, weatherCondition, impact)

    res.json({
      success: true,
      message: `Weather alerts sent to ${customers.length} customers`,
      data: { weatherCondition, impact }
    })
  } catch (error) {
    throw new AppError(`Failed to send weather alerts: ${error}`, 500)
  }
})


export default router
