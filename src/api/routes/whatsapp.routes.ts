import { Router, Request, Response, NextFunction } from 'express'
import { whatsAppService } from '../../services/global'

import { validatePhoneNumber, validateSendMessage, upload } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'

const router = Router()

/**
 * @route   POST /api/whatsapp/login
 * @desc    Initialize WhatsApp and wait for client to be ready
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.body

    // Validate required fields
    if (!clientId) {
      return next(new AppError('Client ID is required to initialize WhatsApp connection', 400))
    }

    if (typeof clientId !== 'string' || clientId.trim().length === 0) {
      return next(new AppError('Client ID must be a non-empty string', 400))
    }

    // Initialize WhatsApp client and wait for ready state
    await whatsAppService.loginClient(clientId, { waitForReady: true })
    
    // Get current status
    const status = await whatsAppService.getStatus(clientId)
    
    res.status(200).json({
      success: true,
      message: `WhatsApp client '${clientId}' is ready and connected.`,
    })
  } catch (error) {
    console.error('Login error:', error)
    next(new AppError(`Failed to initialize WhatsApp client: ${error instanceof Error ? error.message : 'Unknown error'}`, 500))
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

    // Validate required fields
    if (!clientId) {
      return next(new AppError('Client ID is required to check phone registration', 400))
    }

    if (typeof clientId !== 'string' || clientId.trim().length === 0) {
      return next(new AppError('Client ID must be a non-empty string', 400))
    }

    // Check if client exists
    if (!whatsAppService.getActiveClients().includes(clientId)) {
      return next(new AppError(`WhatsApp client '${clientId}' not found. Please initialize the client first.`, 404))
    }

    const isRegistered = await whatsAppService.isRegisteredUser(clientId, phone)

    res.status(200).json({
      success: true,
      message: `Phone number registration status checked successfully`,
      data: { 
        isRegistered,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Check registration error:', error)
    next(new AppError(`Failed to check phone registration: ${error instanceof Error ? error.message : 'Unknown error'}`, 500))
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

    // Validate required fields
    if (!clientId) {
      return next(new AppError('Client ID is required to check WhatsApp status', 400))
    }

    if (typeof clientId !== 'string' || clientId.trim().length === 0) {
      return next(new AppError('Client ID must be a non-empty string', 400))
    }

    const status = await whatsAppService.getStatus(clientId as string)

    res.status(200).json({
      success: true,
      message: `WhatsApp client '${clientId}' status retrieved successfully`,
      data: { 
        clientId,
        status,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Status check error:', error)
    next(new AppError(`Failed to get WhatsApp status: ${error instanceof Error ? error.message : 'Unknown error'}`, 500))
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

    // Validate required fields
    if (!clientId) {
      return next(new AppError('Client ID is required to get QR code', 400))
    }

    if (typeof clientId !== 'string' || clientId.trim().length === 0) {
      return next(new AppError('Client ID must be a non-empty string', 400))
    }

    // Check if client exists
    if (!whatsAppService.getActiveClients().includes(clientId)) {
      return next(new AppError(`WhatsApp client '${clientId}' not found. Please initialize the client first.`, 404))
    }

    // Get QR code directly from storage
    const qrCode = whatsAppService.getQRCodeDirect(clientId)
    
    if (!qrCode) {
      // Check if client is already connected
      const status = await whatsAppService.getStatus(clientId)
      if (status === 'CONNECTED') {
        return res.status(200).json({
          success: true,
          message: `WhatsApp client '${clientId}' is already connected`,
          data: { 
            clientId,
            qrCode: null,
            status: 'CONNECTED',
            timestamp: new Date().toISOString()
          }
        })
      }
      
      return res.status(200).json({
        success: true,
        message: `QR code for client '${clientId}' is not available yet`,
        data: { 
          clientId,
          qrCode: null,
          status: 'AUTHENTICATING',
          timestamp: new Date().toISOString()
        }
      })
    }

    res.status(200).json({
      success: true,
      message: `QR code for client '${clientId}' retrieved successfully`,
      data: { 
        clientId,
        qrCode,
        status: 'AUTHENTICATING',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('QR code retrieval error:', error)
    next(new AppError(`Failed to get QR code: ${error instanceof Error ? error.message : 'Unknown error'}`, 500))
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

    // Validate required fields
    if (!clientId) {
      return next(new AppError('Client ID is required to logout WhatsApp client', 400))
    }

    if (typeof clientId !== 'string' || clientId.trim().length === 0) {
      return next(new AppError('Client ID must be a non-empty string', 400))
    }

    // Check if client exists
    if (!whatsAppService.getActiveClients().includes(clientId)) {
      return next(new AppError(`WhatsApp client '${clientId}' not found. Please initialize the client first.`, 404))
    }

    // Close the client
    await whatsAppService.logout(clientId)

    res.status(200).json({
      success: true,
      message: `WhatsApp client '${clientId}' logged out successfully`,
      data: { 
        clientId,
        status: "DISCONNECTED",
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Logout error:', error)
    next(new AppError(`Failed to logout WhatsApp client: ${error instanceof Error ? error.message : 'Unknown error'}`, 500))
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

    // Check if client exists
    if (!whatsAppService.getActiveClients().includes(clientId)) {
      return next(new AppError(`WhatsApp client '${clientId}' not found. Please initialize the client first.`, 404))
    }

    // Check if client is ready
    const isReady = await whatsAppService.isClientReady(clientId)
    if (!isReady) {
      return next(new AppError(`WhatsApp client '${clientId}' is not ready. Please ensure the client is connected.`, 422))
    }

    // Send message or file (not both)
    if (file) {
      // Send file with message as caption
      const fileBlob = new Blob([file.buffer], { type: file.mimetype })
      const message = await whatsAppService.sendFile(clientId, phone, fileBlob, file.originalname, file.mimetype, text)
      
      res.status(200).json({
        success: true,
        message: `File sent successfully to ${phone}`,
        data: {
          message: message,
          timestamp: new Date().toISOString()
        }
      })
    } else if (text) {
      // Send text message only if no file
      const message = await whatsAppService.sendText(clientId, phone, text)
      
      res.status(200).json({
        success: true,
        message: `Text message sent successfully to ${phone}`,
        data: {
          message: message,
          timestamp: new Date().toISOString()
        }
      })
    }
  } catch (error) {
    console.error('Send message error:', error)
    next(new AppError(`${error instanceof Error ? error.message : 'Unknown error'}`, 500))
  }
})

export default router
