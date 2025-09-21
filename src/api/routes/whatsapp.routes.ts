import { Router, Request, Response } from 'express'
import { WhatsAppService } from '../../services/whatsapp.service'
import { validatePhoneNumber } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import QRCode from 'qrcode'

const router = Router()

// Initialize service
const whatsappService = new WhatsAppService()

/**
 * @route   POST /api/whatsapp/login
 * @desc    Initialize WhatsApp and get QR code for scanning
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Initialize WhatsApp client
    await whatsappService.initializeClient()
    
    // Get QR code as base64 image
    const qrCodeDataUrl = await whatsappService.getQRCode()
    
    res.json({
      success: true,
      message: 'WhatsApp initialized successfully. Scan the QR code to connect.',
      data: {
        qrCode: qrCodeDataUrl,
        status: 'waiting_for_scan'
      }
    })
  } catch (error) {
    throw new AppError(`Failed to initialize WhatsApp: ${error}`, 500)
  }
})

/**
 * @route   POST /api/whatsapp/check-registration
 * @desc    Check if phone number is registered on WhatsApp
 * @access  Public
 */
router.post('/check-registration', validatePhoneNumber, async (req: Request, res: Response) => {
  try {
    const { phone } = req.body

    const isRegistered = await whatsappService.isRegisteredUser(phone)

    res.json({
      success: true,
      message: 'Registration status checked',
      data: { phone, isRegistered }
    })
  } catch (error) {
    throw new AppError(`Failed to check registration: ${error}`, 500)
  }
})

/**
 * @route   POST /api/whatsapp/bulk-check-registration
 * @desc    Check registration status for multiple phone numbers
 * @access  Public
 */
router.post('/bulk-check-registration', async (req: Request, res: Response) => {
  try {
    const { phones } = req.body

    if (!phones || !Array.isArray(phones)) {
      throw new AppError('Phones array is required', 400)
    }

    // Validate all phone numbers
    const phoneRegex = /^\+92[0-9]{10}$/
    const invalidPhones = phones.filter((phone: string) => !phoneRegex.test(phone))
    
    if (invalidPhones.length > 0) {
      throw new AppError(`Invalid phone numbers: ${invalidPhones.join(', ')}`, 400)
    }

    const results = await Promise.all(
      phones.map(async (phone: string) => {
        try {
          const isRegistered = await whatsappService.isRegisteredUser(phone)
          return { phone, isRegistered, error: null }
        } catch (error: any) {
          return { phone, isRegistered: false, error: error.message }
        }
      })
    )

    res.json({
      success: true,
      message: 'Bulk registration check completed',
      data: { results }
    })
  } catch (error) {
    throw new AppError(`Failed to check bulk registration: ${error}`, 500)
  }
})

/**
 * @route   GET /api/whatsapp/status
 * @desc    Get WhatsApp client status
 * @access  Public
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await whatsappService.getStatus()

    res.json({
      success: true,
      message: 'Status retrieved successfully',
      data: { status }
    })
  } catch (error) {
    throw new AppError(`Failed to get status: ${error}`, 500)
  }
})


export default router
