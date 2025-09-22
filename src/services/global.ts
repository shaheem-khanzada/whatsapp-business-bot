import { WhatsAppService } from './whatsapp.service'
import { DeliveryService } from './delivery.service'
import { InvoiceService } from './invoice.service'

// Create global instances
export const whatsappService = new WhatsAppService()
export const deliveryService = new DeliveryService(whatsappService)
export const invoiceService = new InvoiceService(whatsappService)
