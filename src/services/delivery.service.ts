import { WhatsAppService } from './whatsapp.service'
import { Delivery, DeliveryTemplate } from '../types/business'
import { DeliveryTemplates } from '../templates/messageTemplates'

export class DeliveryService {
  private whatsappService: WhatsAppService

  constructor(whatsappService: WhatsAppService) {
    this.whatsappService = whatsappService
  }

  /**
   * Send delivery confirmation message
   */
  async sendDeliveryConfirmation(clientId: string, delivery: Delivery): Promise<void> {
    const template = this.createDeliveryTemplate(delivery)
    const message = DeliveryTemplates.deliveryConfirmation(template)
    
    await this.whatsappService.sendText(clientId, delivery.customer.phone, message)
  }

  /**
   * Send delivery summary for the day
   */
  async sendDailyDeliverySummary(clientId: string, deliveries: Delivery[]): Promise<void> {
    const summary = this.createDailySummary(deliveries)
    const message = DeliveryTemplates.dailySummary(summary)
    
    // Send to admin/manager
    const adminPhone = process.env.ADMIN_PHONE || '+923462799866'
    await this.whatsappService.sendText(clientId, adminPhone, message)
  }


  /**
   * Create delivery template from delivery data
   */
  private createDeliveryTemplate(delivery: Delivery): DeliveryTemplate {
    return {
      customerName: delivery.customer.name,
      bottlesDelivered: delivery.bottlesDelivered,
      emptyBottlesCollected: delivery.emptyBottlesCollected,
      totalAmount: delivery.totalAmount,
      deliveryDate: delivery.date.toLocaleDateString('en-PK'),
      deliveryPerson: delivery.deliveryPerson,
      nextDeliveryDate: this.getNextDeliveryDate(delivery.date).toLocaleDateString('en-PK')
    }
  }


  /**
   * Create daily delivery summary
   */
  private createDailySummary(deliveries: Delivery[]) {
    const completed = deliveries.filter(d => d.status === 'completed')
    const totalBottles = completed.reduce((sum, d) => sum + d.bottlesDelivered, 0)
    const totalEmpty = completed.reduce((sum, d) => sum + d.emptyBottlesCollected, 0)
    const totalRevenue = completed.reduce((sum, d) => sum + d.totalAmount, 0)

    return {
      date: new Date().toLocaleDateString('en-PK'),
      totalDeliveries: completed.length,
      totalBottles,
      totalEmpty,
      totalRevenue,
      deliveries: completed
    }
  }


  /**
   * Get next delivery date (assuming weekly delivery)
   */
  private getNextDeliveryDate(currentDate: Date): Date {
    const nextDate = new Date(currentDate)
    nextDate.setDate(nextDate.getDate() + 7) // Weekly delivery
    return nextDate
  }


}
