import { Router, Request, Response, NextFunction } from 'express'
import { WhatsAppService } from '../../services/whatsapp.service'

// Create a single instance
const whatsappService = new WhatsAppService()
import { validatePhoneNumber, validateSendMessage, upload } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'

const router = Router()

/**
 * @route   POST /api/whatsapp/login
 * @desc    Initialize WhatsApp and get QR code for scanning
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.body

    if (!clientId) {
      throw new AppError('clientId is required', 400)
    }

    // Initialize WhatsApp client for specific clientId
    await whatsappService.loginClient(clientId)
    
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
    next(new AppError(`${error}`, 500))
  }
})

/**
 * @route   POST /api/whatsapp/check-registration
 * @desc    Check if phone number is registered on WhatsApp
 * @access  Public
 */
router.post('/check-registration', validatePhoneNumber, async (req: Request, res: Response, next: NextFunction) => {
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
    next(new AppError(`Failed to check registration: ${error}`, 500))
  }
})

/**
 * @route   GET /api/whatsapp/status
 * @desc    Get WhatsApp client status
 * @access  Public
 */
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.query

    if (!clientId) {
      throw new AppError('clientId is required', 400)
    }

    const status = await whatsappService.getStatus(clientId as string)

    res.json({
      success: true,
      message: 'Status retrieved successfully',
      data: { 
        clientId,
        status,
      }
    })
  } catch (error) {
    next(new AppError(`Failed to get status: ${error}`, 500))
  }
})

/**
 * @route   GET /api/whatsapp/qr/:clientId
 * @desc    Get current QR code for a specific client
 * @access  Public
 */
router.get('/qr/:clientId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.params

    if (!clientId) {
      throw new AppError('clientId is required', 400)
    }

    // Check if client exists
    if (!whatsappService.getActiveClients().includes(clientId)) {
      throw new AppError(`Client ${clientId} not found`, 404)
    }

    // Get QR code directly from storage
    const qrCode = whatsappService.getQRCodeDirect(clientId)
    
    if (!qrCode) {
      // Check if client is already connected
      const status = await whatsappService.getStatus(clientId)
      if (status === 'CONNECTED') {
        return res.json({
          success: true,
          message: 'Client is already connected',
          data: { 
            clientId,
            qrCode: null,
            status: 'connected'
          }
        })
      }
      
      return res.json({
        success: false,
        message: 'QR code not available yet',
        data: { 
          clientId,
          qrCode: null,
          status: 'waiting_for_qr'
        }
      })
    }

    res.json({
      success: true,
      message: 'QR code retrieved successfully',
      data: { 
        clientId,
        qrCode,
        status: 'qr_available'
      }
    })
  } catch (error) {
    next(new AppError(`Failed to get QR code: ${error}`, 500))
  }
})

/**
 * @route   POST /api/whatsapp/logout/:clientId
 * @desc    Reset a specific client (close and clear)
 * @access  Public
 */
router.post('/logout/:clientId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.params

    if (!clientId) {
      throw new AppError('clientId is required', 400)
    }

    // Check if client exists
    if (!whatsappService.getActiveClients().includes(clientId)) {
      throw new AppError(`Client ${clientId} not found`, 404)
    }

    // Close the client
    await whatsappService.logout(clientId)

    res.json({
      success: true,
      message: `Client ${clientId} reset successfully`,
      data: { 
        status: "LOGGED OUT"
      }
    })
  } catch (error) {
    next(new AppError(`Failed to reset client: ${error}`, 500))
  }
})

/**
 * @route   POST /api/whatsapp/send
 * @desc    Send text message, file, or both to a phone number (FormData)
 * @access  Public
 */
router.post('/send', upload.single('file'), validateSendMessage, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, phone, text } = req.body
    const file = req.file

    console.log('file', file)
    console.log('text', text)
    console.log('clientId', clientId)
    console.log('phone', phone)  

    // Check if client exists
    if (!whatsappService.getActiveClients().includes(clientId)) {
      throw new AppError(`Client ${clientId} not found`, 404)
    }

    // Send message or file (not both)
    if (file) {
      // Send file with message as caption
      const fileBlob = new Blob([file.buffer], { type: file.mimetype })
      await whatsappService.sendFile(clientId, phone, fileBlob, file.originalname, file.mimetype, text)
    } else if (text) {
      // Send text message only if no file
      await whatsappService.sendText(clientId, phone, text)
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        clientId,
        phone,
        message: text || null,
        file: file ? {
          filename: file.originalname,
          type: file.mimetype,
          size: file.size
        } : null
      }
    })
  } catch (error) {
    next(new AppError(`Failed to send message: ${error}`, 500))
  }
})

export default router
