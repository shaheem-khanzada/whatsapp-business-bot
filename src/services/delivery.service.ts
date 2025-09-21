import { WhatsAppService } from './whatsapp.service'
import { Customer, Delivery, DeliveryTemplate } from '../types/business'

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
    const message = this.formatDeliveryMessage(template)
    
    await this.whatsappService.sendText(delivery.customer.phone, message)
  }

  /**
   * Send delivery summary for the day
   */
  async sendDailyDeliverySummary(deliveries: Delivery[]): Promise<void> {
    const summary = this.createDailySummary(deliveries)
    const message = this.formatDailySummaryMessage(summary)
    
    // Send to admin/manager
    const adminPhone = process.env.ADMIN_PHONE || '+923462799866'
    await this.whatsappService.sendText(adminPhone, message)
  }

  /**
   * Send delivery reminder before delivery
   */
  async sendDeliveryReminder(customer: Customer, deliveryDate: Date): Promise<void> {
    const message = this.formatDeliveryReminder(customer, deliveryDate)
    await this.whatsappService.sendText(customer.phone, message)
  }

  /**
   * Send delivery status update
   */
  async sendDeliveryStatusUpdate(customer: Customer, status: string, estimatedTime?: string): Promise<void> {
    const message = this.formatStatusUpdate(customer, status, estimatedTime)
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
   * Format delivery confirmation message
   */
  private formatDeliveryMessage(template: DeliveryTemplate): string {
    const rupee = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    })

    return `🏠 *Delivery Confirmation*

Dear *${template.customerName}*,

✅ *Delivery Details:*
• Bottles Delivered: *${template.bottlesDelivered}*
• Empty Bottles Collected: *${template.emptyBottlesCollected}*
• Total Amount: *${rupee.format(template.totalAmount)}*
• Delivery Date: *${template.deliveryDate}*
${template.deliveryPerson ? `• Delivered by: *${template.deliveryPerson}*` : ''}

📅 *Next Delivery:* ${template.nextDeliveryDate}

Thank you for choosing our water delivery service! 💧

---
*This is an automated message from Water Delivery Service*`
  }

  /**
   * Format delivery reminder message
   */
  private formatDeliveryReminder(customer: Customer, deliveryDate: Date): string {
    const formattedDate = deliveryDate.toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `🔔 *Delivery Reminder*

Dear *${customer.name}*,

This is a friendly reminder that your water delivery is scheduled for *${formattedDate}*.

Please ensure:
• Empty bottles are ready for collection
• Someone is available to receive the delivery
• Payment is prepared

If you need to reschedule or have any questions, please contact us.

Thank you! 💧

---
*Water Delivery Service*`
  }

  /**
   * Format status update message
   */
  private formatStatusUpdate(customer: Customer, status: string, estimatedTime?: string): string {
    let message = `📱 *Delivery Status Update*

Dear *${customer.name}*,

Your delivery status: *${status}*

${estimatedTime ? `Estimated delivery time: *${estimatedTime}*` : ''}

We'll keep you updated on any changes.

Thank you for your patience! 💧

---
*Water Delivery Service*`

    return message
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
   * Format daily summary message
   */
  private formatDailySummaryMessage(summary: any): string {
    const rupee = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    })

    return `📊 *Daily Delivery Summary - ${summary.date}*

📈 *Statistics:*
• Total Deliveries: *${summary.totalDeliveries}*
• Bottles Delivered: *${summary.totalBottles}*
• Empty Bottles Collected: *${summary.totalEmpty}*
• Total Revenue: *${rupee.format(summary.totalRevenue)}*

✅ *Completed Deliveries:*
${summary.deliveries.map((d: Delivery) => 
  `• ${d.customer.name} - ${d.bottlesDelivered} bottles - ${rupee.format(d.totalAmount)}`
).join('\n')}

Great work team! 🎉

---
*Water Delivery Management System*`
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
    const message = this.formatBulkDeliveryReminder(deliveryDate)
    
    await this.whatsappService.sendBulkText(phones, message)
  }

  /**
   * Format bulk delivery reminder
   */
  private formatBulkDeliveryReminder(deliveryDate: Date): string {
    const formattedDate = deliveryDate.toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `🔔 *Bulk Delivery Reminder*

Dear Valued Customer,

This is a friendly reminder that water deliveries are scheduled for *${formattedDate}*.

Please ensure:
• Empty bottles are ready for collection
• Someone is available to receive the delivery
• Payment is prepared

If you need to reschedule or have any questions, please contact us.

Thank you! 💧

---
*Water Delivery Service*`
  }
}
