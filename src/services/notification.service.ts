import { WhatsAppService } from './whatsapp.service'
import { Customer, Notification, VacationNotification } from '../types/business'
import { NotificationTemplates } from '../templates/messageTemplates'

export class NotificationService {
  private whatsappService: WhatsAppService

  constructor(whatsappService: WhatsAppService) {
    this.whatsappService = whatsappService
  }

  /**
   * Send vacation notification to all customers
   */
  async sendVacationNotification(customers: Customer[], vacation: VacationNotification): Promise<void> {
    const message = NotificationTemplates.vacation(vacation)
    const phones = customers.map(c => c.phone)

    await this.whatsappService.sendBulkText(phones, message)
  }

  /**
   * Send service announcement to all customers
   */
  async sendServiceAnnouncement(customers: Customer[], title: string, message: string): Promise<void> {
    const formattedMessage = NotificationTemplates.announcement(title, message)
    const phones = customers.map(c => c.phone)

    await this.whatsappService.sendBulkText(phones, formattedMessage)
  }

  /**
   * Send payment reminder to specific customers
   */
  async sendPaymentReminder(customers: Customer[], amount: number, dueDate: Date): Promise<void> {
    for (const customer of customers) {
      const message = NotificationTemplates.paymentReminder(customer.name, amount, dueDate)
      await this.whatsappService.sendText(customer.phone, message)
    }
  }

  /**
   * Send area-specific notification
   */
  async sendAreaNotification(customers: Customer[], area: string, title: string, message: string): Promise<void> {
    const areaCustomers = customers.filter(c => c.deliveryArea === area)
    const phones = areaCustomers.map(c => c.phone)

    const formattedMessage = NotificationTemplates.areaNotification(area, title, message)
    await this.whatsappService.sendBulkText(phones, formattedMessage)
  }

  /**
   * Send custom notification
   */
  async sendCustomNotification(notification: Notification, customers: Customer[]): Promise<void> {
    const targetCustomers = this.getTargetCustomers(notification, customers)
    const phones = targetCustomers.map(c => c.phone)

    const message = `📱 *${notification.title}*

${notification.message}

Thank you! 💧

---
*Water Delivery Service*`
    await this.whatsappService.sendBulkText(phones, message)
  }

  /**
   * Send delivery delay notification
   */
  async sendDeliveryDelayNotification(customers: Customer[], reason: string, estimatedDelay: string): Promise<void> {
    const message = NotificationTemplates.deliveryDelay(reason, estimatedDelay)
    const phones = customers.map(c => c.phone)

    await this.whatsappService.sendBulkText(phones, message)
  }

  /**
   * Send service resumption notification
   */
  async sendServiceResumptionNotification(customers: Customer[], resumptionDate: Date): Promise<void> {
    const message = NotificationTemplates.serviceResumption(resumptionDate)
    const phones = customers.map(c => c.phone)

    await this.whatsappService.sendBulkText(phones, message)
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
    const emergencyMessage = NotificationTemplates.emergency(message)

    const phones = customers.map(c => c.phone)
    await this.whatsappService.sendBulkText(phones, emergencyMessage)
  }

  /**
   * Send weather alert
   */
  async sendWeatherAlert(customers: Customer[], weatherCondition: string, impact: string): Promise<void> {
    const message = NotificationTemplates.weatherAlert(weatherCondition, impact)

    const phones = customers.map(c => c.phone)
    await this.whatsappService.sendBulkText(phones, message)
  }
}
