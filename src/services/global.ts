import { WebSocketService } from './websocket.service'
import { WhatsAppService } from './whatsapp.service'

// Global service instances
export const webSocketService = new WebSocketService()
export const whatsAppService = new WhatsAppService()
