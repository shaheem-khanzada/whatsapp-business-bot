import { WhatsAppService } from './whatsapp.service'
import { Customer, Notification, VacationNotification } from '../types/business'

export class NotificationService {
  private whatsappService: WhatsAppService

  constructor(whatsappService: WhatsAppService) {
    this.whatsappService = whatsappService
  }

  /**
   * Send vacation notification to all customers
   */
  async sendVacationNotification(customers: Customer[], vacation: VacationNotification): Promise<void> {
    const message = this.formatVacationMessage(vacation)
    const phones = customers.map(c => c.phone)
    
    await this.whatsappService.sendBulkText(phones, message)
  }

  /**
   * Send service announcement to all customers
   */
  async sendServiceAnnouncement(customers: Customer[], title: string, message: string): Promise<void> {
    const formattedMessage = this.formatServiceAnnouncement(title, message)
    const phones = customers.map(c => c.phone)
    
    await this.whatsappService.sendBulkText(phones, formattedMessage)
  }

  /**
   * Send payment reminder to specific customers
   */
  async sendPaymentReminder(customers: Customer[], amount: number, dueDate: Date): Promise<void> {
    for (const customer of customers) {
      const message = this.formatPaymentReminder(customer, amount, dueDate)
      await this.whatsappService.sendText(customer.phone, message)
    }
  }

  /**
   * Send area-specific notification
   */
  async sendAreaNotification(customers: Customer[], area: string, title: string, message: string): Promise<void> {
    const areaCustomers = customers.filter(c => c.deliveryArea === area)
    const phones = areaCustomers.map(c => c.phone)
    
    const formattedMessage = this.formatAreaNotification(area, title, message)
    await this.whatsappService.sendBulkText(phones, formattedMessage)
  }

  /**
   * Send custom notification
   */
  async sendCustomNotification(notification: Notification, customers: Customer[]): Promise<void> {
    const targetCustomers = this.getTargetCustomers(notification, customers)
    const phones = targetCustomers.map(c => c.phone)
    
    const message = this.formatCustomNotification(notification)
    await this.whatsappService.sendBulkText(phones, message)
  }

  /**
   * Send delivery delay notification
   */
  async sendDeliveryDelayNotification(customers: Customer[], reason: string, estimatedDelay: string): Promise<void> {
    const message = this.formatDeliveryDelayMessage(reason, estimatedDelay)
    const phones = customers.map(c => c.phone)
    
    await this.whatsappService.sendBulkText(phones, message)
  }

  /**
   * Send service resumption notification
   */
  async sendServiceResumptionNotification(customers: Customer[], resumptionDate: Date): Promise<void> {
    const message = this.formatServiceResumptionMessage(resumptionDate)
    const phones = customers.map(c => c.phone)
    
    await this.whatsappService.sendBulkText(phones, message)
  }

  /**
   * Format vacation notification message
   */
  private formatVacationMessage(vacation: VacationNotification): string {
    const startDate = new Date(vacation.startDate).toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const endDate = new Date(vacation.endDate).toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const resumptionDate = new Date(vacation.resumptionDate).toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `🏖️ *Service Vacation Notice*

Dear Valued Customer,

We would like to inform you that our water delivery service will be temporarily suspended due to:

*${vacation.reason}*

📅 *Vacation Period:*
• From: *${startDate}*
• To: *${endDate}*
• Service Resumes: *${resumptionDate}*

${vacation.alternativeContact ? `📞 *Alternative Contact:* ${vacation.alternativeContact}` : ''}

We apologize for any inconvenience and appreciate your understanding.

Thank you for your continued support! 💧

---
*Water Delivery Service*`
  }

  /**
   * Format service announcement message
   */
  private formatServiceAnnouncement(title: string, message: string): string {
    return `📢 *Service Announcement*

*${title}*

${message}

Thank you for your attention! 💧

---
*Water Delivery Service*`
  }

  /**
   * Format payment reminder message
   */
  private formatPaymentReminder(customer: Customer, amount: number, dueDate: Date): string {
    const rupee = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    })

    const formattedDueDate = dueDate.toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `💰 *Payment Reminder*

Dear *${customer.name}*,

This is a friendly reminder that you have an outstanding balance of *${rupee.format(amount)}*.

📅 *Due Date:* ${formattedDueDate}

Please make the payment at your earliest convenience to avoid any service interruption.

Thank you for your prompt attention! 💧

---
*Water Delivery Service*`
  }

  /**
   * Format area-specific notification
   */
  private formatAreaNotification(area: string, title: string, message: string): string {
    return `📍 *Area-Specific Notice - ${area}*

*${title}*

${message}

This notice is specifically for customers in the *${area}* area.

Thank you! 💧

---
*Water Delivery Service*`
  }

  /**
   * Format custom notification
   */
  private formatCustomNotification(notification: Notification): string {
    return `📱 *${notification.title}*

${notification.message}

Thank you! 💧

---
*Water Delivery Service*`
  }

  /**
   * Format delivery delay message
   */
  private formatDeliveryDelayMessage(reason: string, estimatedDelay: string): string {
    return `⏰ *Delivery Delay Notice*

Dear Valued Customer,

We regret to inform you that today's deliveries may be delayed due to:

*${reason}*

🕐 *Estimated Delay:* ${estimatedDelay}

We are working to minimize the delay and will keep you updated on the progress.

Thank you for your patience and understanding! 💧

---
*Water Delivery Service*`
  }

  /**
   * Format service resumption message
   */
  private formatServiceResumptionMessage(resumptionDate: Date): string {
    const formattedDate = resumptionDate.toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `🎉 *Service Resumption Notice*

Dear Valued Customer,

Great news! Our water delivery service has resumed normal operations.

📅 *Service Resumed:* ${formattedDate}

We are now accepting new orders and will resume regular delivery schedules.

Thank you for your patience during our temporary suspension! 💧

---
*Water Delivery Service*`
  }

  /**
   * Get target customers based on notification criteria
   */
  private getTargetCustomers(notification: Notification, customers: Customer[]): Customer[] {
    switch (notification.targetAudience) {
      case 'all':
        return customers
      case 'specific_area':
        return customers.filter(c => c.deliveryArea === notification.targetArea)
      case 'specific_customers':
        return customers.filter(c => notification.targetCustomerIds?.includes(c.id))
      default:
        return customers
    }
  }

  /**
   * Send emergency notification
   */
  async sendEmergencyNotification(customers: Customer[], message: string): Promise<void> {
    const emergencyMessage = `🚨 *EMERGENCY NOTICE*

${message}

Please take necessary precautions and stay safe.

We will provide updates as soon as possible.

---
*Water Delivery Service*`

    const phones = customers.map(c => c.phone)
    await this.whatsappService.sendBulkText(phones, emergencyMessage)
  }

  /**
   * Send weather alert
   */
  async sendWeatherAlert(customers: Customer[], weatherCondition: string, impact: string): Promise<void> {
    const message = `🌦️ *Weather Alert*

*Current Condition:* ${weatherCondition}

*Impact on Service:* ${impact}

Please stay safe and we'll adjust our delivery schedule accordingly.

Thank you! 💧

---
*Water Delivery Service*`

    const phones = customers.map(c => c.phone)
    await this.whatsappService.sendBulkText(phones, message)
  }
}
