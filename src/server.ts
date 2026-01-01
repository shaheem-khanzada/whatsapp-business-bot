import app from './app'
import { eventBus } from './ws/eventBus'
import { waManager } from './whatsapp/WhatsAppManager'
import { logger } from './config/logger'

const PORT = process.env.PORT || 4000

const server = app.listen(PORT, async () => {
  logger.info(`HTTP server running on port ${PORT}`)
  
  // Restart all clients from Redis on server startup
  await waManager.restartAllClients()
})

eventBus.attach(server)

declare global {
  namespace Express {
    interface Request {
      _waRetry?: boolean
    }
  }
}
