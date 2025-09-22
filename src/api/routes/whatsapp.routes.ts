import { Router, Request, Response } from 'express'
import { whatsappService } from '../../services/global'
import { validatePhoneNumber } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'

const router = Router()

/**
 * @route   POST /api/whatsapp/login
 * @desc    Initialize WhatsApp and get QR code for scanning
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.body

    if (!clientId) {
      throw new AppError('clientId is required', 400)
    }

    // Initialize WhatsApp client for specific clientId
    await whatsappService.initializeClient(clientId)
    
    // Get QR code as base64 image
    const qrCodeDataUrl = await whatsappService.getQRCode(clientId)
    
    res.json({
      success: true,
      message: `WhatsApp initialized successfully for client ${clientId}. Scan the QR code to connect.`,
      data: {
        clientId,
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
    const { clientId, phone } = req.body

    if (!clientId) {
      throw new AppError('clientId is required', 400)
    }

    const isRegistered = await whatsappService.isRegisteredUser(clientId, phone)

    res.json({
      success: true,
      message: 'Registration status checked',
      data: { clientId, phone, isRegistered }
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
    const { clientId, phones } = req.body

    if (!clientId) {
      throw new AppError('clientId is required', 400)
    }

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
          const isRegistered = await whatsappService.isRegisteredUser(clientId, phone)
          return { phone, isRegistered, error: null }
        } catch (error: any) {
          return { phone, isRegistered: false, error: error.message }
        }
      })
    )

    res.json({
      success: true,
      message: 'Bulk registration check completed',
      data: { clientId, results }
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
    const { clientId } = req.query

    if (!clientId) {
      throw new AppError('clientId is required', 400)
    }

    const status = await whatsappService.getStatus(clientId as string)
    const clientStatus = whatsappService.getClientStatus(clientId as string)

    res.json({
      success: true,
      message: 'Status retrieved successfully',
      data: { 
        clientId,
        status,
        isReady: clientStatus?.isReady || false,
        isInitialized: clientStatus?.isInitialized || false
      }
    })
  } catch (error) {
    throw new AppError(`Failed to get status: ${error}`, 500)
  }
})

/**
 * @route   GET /api/whatsapp/clients
 * @desc    Get all active clients
 * @access  Public
 */
router.get('/clients', async (req: Request, res: Response) => {
  try {
    const activeClients = whatsappService.getActiveClients()
    const clientsWithStatus = activeClients.map(clientId => {
      const status = whatsappService.getClientStatus(clientId)
      return {
        clientId,
        isReady: status?.isReady || false,
        isInitialized: status?.isInitialized || false
      }
    })

    res.json({
      success: true,
      message: 'Active clients retrieved successfully',
      data: { clients: clientsWithStatus }
    })
  } catch (error) {
    throw new AppError(`Failed to get clients: ${error}`, 500)
  }
})


export default router
