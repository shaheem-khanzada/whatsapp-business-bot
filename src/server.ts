import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { errorHandler, notFound } from './api/middleware/errorHandler'
import apiRoutes from './api/routes'
import { webSocketService } from './services/global'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

// Initialize global services
webSocketService.initialize(server)

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
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

// Stricter rate limiting for WhatsApp login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  }
})

app.use('/api/whatsapp/login', loginLimiter)

// Logging middleware
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files
app.use(express.static('public'))

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
      whatsapp: '/api/whatsapp'
    },
    whatsapp: {
      'POST /api/whatsapp/login': 'Initialize WhatsApp and wait for ready',
      'GET /api/whatsapp/qr/:clientId': 'Get QR code for client',
      'POST /api/whatsapp/check-registration': 'Check phone registration',
      'GET /api/whatsapp/status?clientId=:clientId': 'Get client status',
      'POST /api/whatsapp/send': 'Send message or file',
      'POST /api/whatsapp/logout/:clientId': 'Logout client'
    },
    websocket: 'ws://localhost:3000/ws',
    documentation: 'See README.md for complete API documentation'
  })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  // console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit the process, just log the error
})

process.on('uncaughtException', (error: Error) => {
  // console.error('Uncaught Exception:', error)
  // Don't exit the process, just log the error
})


// Start server
server.listen(PORT, () => {
  console.log(`🚀 WhatsApp Business Bot API running on port ${PORT}`)
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`)
  console.log(`📚 API Documentation: http://localhost:${PORT}/`)
  console.log(`🔌 WebSocket enabled: ws://localhost:${PORT}/ws`)
  console.log(`🔗 Environment: ${NODE_ENV}`)
  console.log(`\n📋 Quick Start:`)
  console.log(`   1. POST /api/whatsapp/login - Initialize WhatsApp and get QR code`)
  console.log(`   2. Scan QR code with your WhatsApp mobile app`)
  console.log(`   3. Start using other endpoints once connected`)
})

export default app
