import { Router } from 'express'
import deliveryRoutes from './delivery.routes'
import notificationRoutes from './notification.routes'
import invoiceRoutes from './invoice.routes'
import whatsappRoutes from './whatsapp.routes'

const router = Router()

// API Routes
router.use('/delivery', deliveryRoutes)
router.use('/notifications', notificationRoutes)
router.use('/invoices', invoiceRoutes)
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
