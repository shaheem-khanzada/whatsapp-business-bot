import { WhatsAppService } from './whatsapp.service'
import { Customer, Delivery, DeliveryTemplate } from '../types/business'
import { DeliveryTemplates } from '../templates/messageTemplates'

export class DeliveryService {
  private whatsappService: WhatsAppService

  constructor(whatsappService: WhatsAppService) {
    this.whatsappService = whatsappService
  }

  /**
   * Send delivery confirmation message
   */
  async sendDeliveryConfirmation(delivery: Delivery): Promise<void> {
    const template = this.createDeliveryTemplate(delivery)
    const message = DeliveryTemplates.deliveryConfirmation(template)
    
    await this.whatsappService.sendText(delivery.customer.phone, message)
  }

  /**
   * Send delivery summary for the day
   */
  async sendDailyDeliverySummary(deliveries: Delivery[]): Promise<void> {
    const summary = this.createDailySummary(deliveries)
    const message = DeliveryTemplates.dailySummary(summary)
    
    // Send to admin/manager
    const adminPhone = process.env.ADMIN_PHONE || '+923462799866'
    await this.whatsappService.sendText(adminPhone, message)
  }

  /**
   * Send delivery reminder before delivery
   */
  async sendDeliveryReminder(customer: Customer, deliveryDate: Date): Promise<void> {
    const message = DeliveryTemplates.deliveryReminder(customer.name, deliveryDate)
    await this.whatsappService.sendText(customer.phone, message)
  }

  /**
   * Send delivery status update
   */
  async sendDeliveryStatusUpdate(customer: Customer, status: string, estimatedTime?: string): Promise<void> {
    const message = DeliveryTemplates.statusUpdate(customer.name, status, estimatedTime)
    await this.whatsappService.sendText(customer.phone, message)
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

  /**
   * Send bulk delivery reminders
   */
  async sendBulkDeliveryReminders(customers: Customer[], deliveryDate: Date): Promise<void> {
    const phones = customers.map(c => c.phone)
    const message = DeliveryTemplates.bulkDeliveryReminder(deliveryDate)
    
    await this.whatsappService.sendBulkText(phones, message)
  }

}
