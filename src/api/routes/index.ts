import { Router } from 'express'
import whatsappRoutes from './whatsapp.routes'

const router = Router()

// API Routes
router.use('/whatsapp', whatsappRoutes)

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Business Bot API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

export default router
