import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { errorHandler, notFound } from './api/middleware/errorHandler'
import apiRoutes from './api/routes'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  }
})

app.use('/api/auth/login', authLimiter)

// Logging middleware
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// API routes
app.use('/api', apiRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Business Bot API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      delivery: '/api/delivery',
      notifications: '/api/notifications',
      invoices: '/api/invoices',
      whatsapp: '/api/whatsapp'
    },
    documentation: {
      delivery: {
        'POST /api/delivery/confirm': 'Send delivery confirmation'
      },
      notifications: {
        'POST /api/notifications/announcement': 'Send service announcement',
        'POST /api/notifications/delivery-delay': 'Send delivery delay notification',
        'POST /api/notifications/service-resumption': 'Send service resumption notification',
        'POST /api/notifications/emergency': 'Send emergency notification',
        'POST /api/notifications/weather-alert': 'Send weather alert'
      },
      invoices: {
        'POST /api/invoices/send': 'Send invoice PDF',
        'POST /api/invoices/payment-reminder': 'Send payment reminder with invoice'
      },
      whatsapp: {
        'POST /api/whatsapp/login': 'Initialize WhatsApp and get QR code',
        'POST /api/whatsapp/check-registration': 'Check phone registration',
        'POST /api/whatsapp/bulk-check-registration': 'Check bulk phone registration',
        'GET /api/whatsapp/status': 'Get WhatsApp client status'
      }
    }
  })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Business Bot API running on port ${PORT}`)
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`)
  console.log(`📚 API Documentation: http://localhost:${PORT}/`)
  console.log(`🔗 Environment: ${NODE_ENV}`)
  console.log(`\n📋 Quick Start:`)
  console.log(`   1. POST /api/whatsapp/login - Initialize WhatsApp and get QR code`)
  console.log(`   2. Scan QR code with your WhatsApp mobile app`)
  console.log(`   3. Start using other endpoints once connected`)
})

export default app
