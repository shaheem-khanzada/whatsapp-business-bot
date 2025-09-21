import { WhatsAppService } from './whatsapp.service'
import { Customer, Invoice, InvoiceItem } from '../types/business'
import { format } from 'date-fns'

export class InvoiceService {
  private whatsappService: WhatsAppService

  constructor(whatsappService: WhatsAppService) {
    this.whatsappService = whatsappService
  }

  /**
   * Send invoice PDF to customer
   */
  async sendInvoicePdf(customer: Customer, invoice: Invoice, pdfUrl?: string): Promise<void> {
    const caption = this.formatInvoiceCaption(invoice)
    
    if (pdfUrl) {
      const filename = this.generateInvoiceFilename(invoice)
      await this.whatsappService.sendPdfFromUrl(customer.phone, pdfUrl, filename, caption)
    } else {
      // If no PDF URL, send invoice details as text
      const message = this.formatInvoiceText(invoice)
      await this.whatsappService.sendText(customer.phone, message)
    }
  }

  /**
   * Send payment reminder with invoice
   */
  async sendPaymentReminderWithInvoice(customer: Customer, invoice: Invoice, pdfUrl?: string): Promise<void> {
    const reminderMessage = this.formatPaymentReminderMessage(customer, invoice)
    
    if (pdfUrl) {
      const filename = this.generateInvoiceFilename(invoice)
      await this.whatsappService.sendPdfFromUrl(customer.phone, pdfUrl, filename, reminderMessage)
    } else {
      const fullMessage = `${reminderMessage}\n\n${this.formatInvoiceText(invoice)}`
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
    const message = this.formatInvoiceSummary(invoices, totalAmount)
    
    await this.whatsappService.sendText(adminPhone, message)
  }

  /**
   * Format invoice caption for PDF
   */
  private formatInvoiceCaption(invoice: Invoice): string {
    const rupee = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    })

    const dueDate = format(invoice.dueDate, 'MMMM dd, yyyy')

    switch (invoice.status) {
      case 'unpaid':
        return `Dear *${invoice.customer.name}*,\n\nYour invoice is attached and total dues are *${rupee.format(invoice.dueAmount!)}*/-.\n\nDue Date: *${dueDate}*`
      case 'partially-paid':
        return `Dear *${invoice.customer.name}*,\n\nYour invoice is attached and remaining dues are *${rupee.format(invoice.dueAmount!)}*/-.\n\nDue Date: *${dueDate}*`
      default:
        return `Dear *${invoice.customer.name}*,\n\nPlease find your invoice attached.\n\nDue Date: *${dueDate}*`
    }
  }

  /**
   * Format invoice as text message
   */
  private formatInvoiceText(invoice: Invoice): string {
    const rupee = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    })

    const invoiceDate = format(invoice.createdAt, 'MMMM dd, yyyy')
    const dueDate = format(invoice.dueDate, 'MMMM dd, yyyy')

    let message = `📄 *INVOICE #${invoice.id}*

*Customer:* ${invoice.customer.name}
*Address:* ${invoice.customer.address}
*Phone:* ${invoice.customer.phone}
*Invoice Date:* ${invoiceDate}
*Due Date:* ${dueDate}

*Items:*
${invoice.items.map(item => 
  `• ${item.description} - Qty: ${item.quantity} - Rate: ${rupee.format(item.rate)} - Amount: ${rupee.format(item.amount)}`
).join('\n')}

*Total Amount:* ${rupee.format(invoice.totalAmount)}
*Paid Amount:* ${rupee.format(invoice.paidAmount)}
*Due Amount:* ${rupee.format(invoice.dueAmount)}

*Status:* ${invoice.status.toUpperCase()}

Thank you for your business! 💧

---
*Water Delivery Service*`

    return message
  }

  /**
   * Format payment reminder message
   */
  private formatPaymentReminderMessage(customer: Customer, invoice: Invoice): string {
    const rupee = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    })

    const dueDate = format(invoice.dueDate, 'MMMM dd, yyyy')
    const daysOverdue = Math.ceil((new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))

    let urgencyLevel = ''
    if (daysOverdue > 0) {
      urgencyLevel = `⚠️ *OVERDUE BY ${daysOverdue} DAYS*`
    } else if (daysOverdue === 0) {
      urgencyLevel = `🔴 *DUE TODAY*`
    } else {
      urgencyLevel = `🟡 *DUE IN ${Math.abs(daysOverdue)} DAYS*`
    }

    return `💰 *Payment Reminder*

Dear *${customer.name}*,

${urgencyLevel}

Your invoice #${invoice.id} has a remaining balance of *${rupee.format(invoice.dueAmount!)}*.

📅 *Due Date:* ${dueDate}

Please make the payment at your earliest convenience to avoid any service interruption.

Thank you for your prompt attention! 💧

---
*Water Delivery Service*`
  }

  /**
   * Format invoice summary for admin
   */
  private formatInvoiceSummary(invoices: Invoice[], totalAmount: number): string {
    const rupee = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    })

    const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid')
    const partiallyPaidInvoices = invoices.filter(inv => inv.status === 'partially-paid')
    const paidInvoices = invoices.filter(inv => inv.status === 'paid')

    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.dueAmount!, 0)
    const totalPartiallyPaid = partiallyPaidInvoices.reduce((sum, inv) => sum + inv.dueAmount!, 0)

    return `📊 *Invoice Summary Report*

*Total Invoices:* ${invoices.length}
*Total Amount:* ${rupee.format(totalAmount)}

*Status Breakdown:*
• Unpaid: ${unpaidInvoices.length} invoices - ${rupee.format(totalUnpaid)}
• Partially Paid: ${partiallyPaidInvoices.length} invoices - ${rupee.format(totalPartiallyPaid)}
• Paid: ${paidInvoices.length} invoices

*Top Unpaid Invoices:*
${unpaidInvoices
  .sort((a, b) => b.dueAmount! - a.dueAmount!)
  .slice(0, 5)
  .map(inv => `• ${inv.customer.name} - ${rupee.format(inv.dueAmount!)}`)
  .join('\n')}

---
*Water Delivery Management System*`
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
