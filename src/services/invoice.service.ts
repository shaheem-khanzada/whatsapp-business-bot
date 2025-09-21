import { WhatsAppService } from './whatsapp.service'
import { Customer, Invoice, InvoiceItem } from '../types/business'
import { format } from 'date-fns'
import { InvoiceTemplates } from '../templates/messageTemplates'

export class InvoiceService {
  private whatsappService: WhatsAppService

  constructor(whatsappService: WhatsAppService) {
    this.whatsappService = whatsappService
  }

  /**
   * Send invoice PDF to customer
   */
  async sendInvoicePdf(customer: Customer, invoice: Invoice, pdfUrl?: string): Promise<void> {
    const caption = InvoiceTemplates.invoiceCaption(invoice)
    
    if (pdfUrl) {
      const filename = this.generateInvoiceFilename(invoice)
      await this.whatsappService.sendPdfFromUrl(customer.phone, pdfUrl, filename, caption)
    } else {
      // If no PDF URL, send invoice details as text
      const message = InvoiceTemplates.invoiceText(invoice)
      await this.whatsappService.sendText(customer.phone, message)
    }
  }

  /**
   * Send payment reminder with invoice
   */
  async sendPaymentReminderWithInvoice(customer: Customer, invoice: Invoice, pdfUrl?: string): Promise<void> {
    const reminderMessage = InvoiceTemplates.paymentReminder(customer.name, invoice)
    
    if (pdfUrl) {
      const filename = this.generateInvoiceFilename(invoice)
      await this.whatsappService.sendPdfFromUrl(customer.phone, pdfUrl, filename, reminderMessage)
    } else {
      const fullMessage = `${reminderMessage}\n\n${InvoiceTemplates.invoiceText(invoice)}`
      await this.whatsappService.sendText(customer.phone, fullMessage)
    }
  }

  /**
   * Send bulk invoices to multiple customers
   */
  async sendBulkInvoices(invoices: { customer: Customer; invoice: Invoice; pdfUrl?: string }[]): Promise<void> {
    for (const { customer, invoice, pdfUrl } of invoices) {
      try {
        await this.sendInvoicePdf(customer, invoice, pdfUrl)
        // Add delay to avoid rate limiting
        await this.sleep(2000)
      } catch (error) {
        console.error(`Failed to send invoice to ${customer.name}:`, error)
      }
    }
  }

  /**
   * Send invoice summary to admin
   */
  async sendInvoiceSummaryToAdmin(invoices: Invoice[], totalAmount: number): Promise<void> {
    const adminPhone = process.env.ADMIN_PHONE || '+923462799866'
    const message = InvoiceTemplates.invoiceSummary(invoices, totalAmount)
    
    await this.whatsappService.sendText(adminPhone, message)
  }


  /**
   * Generate invoice filename
   */
  private generateInvoiceFilename(invoice: Invoice): string {
    const date = format(invoice.createdAt, 'yyyy-MM-dd')
    return `Invoice-${invoice.id}-${date}.pdf`
  }

  /**
   * Create invoice from delivery data
   */
  createInvoiceFromDelivery(customer: Customer, delivery: any): Invoice {
    const invoiceItems: InvoiceItem[] = [
      {
        description: `Water Delivery - ${delivery.bottlesDelivered} bottles`,
        quantity: delivery.bottlesDelivered,
        rate: delivery.ratePerBottle || 50, // Default rate
        amount: delivery.bottlesDelivered * (delivery.ratePerBottle || 50)
      }
    ]

    // Add empty bottle collection charge if applicable
    if (delivery.emptyBottlesCollected > 0) {
      invoiceItems.push({
        description: `Empty Bottle Collection - ${delivery.emptyBottlesCollected} bottles`,
        quantity: delivery.emptyBottlesCollected,
        rate: delivery.emptyBottleRate || 0,
        amount: delivery.emptyBottlesCollected * (delivery.emptyBottleRate || 0)
      })
    }

    const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0)

    return {
      id: `INV-${Date.now()}`,
      customerId: customer.id,
      customer,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      status: 'unpaid',
      items: invoiceItems,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
