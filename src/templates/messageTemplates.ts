import { format } from 'date-fns'
import { DeliveryTemplate, Invoice } from '../types/business'

/**
 * Centralized message templates for WhatsApp Business Bot
 */

// Currency formatter for Pakistani Rupee
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Date formatter
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  return date.toLocaleDateString('en-PK', options || defaultOptions)
}

/**
 * DELIVERY TEMPLATES
 */
export class DeliveryTemplates {
  /**
   * Delivery confirmation message
   */
  static deliveryConfirmation(template: DeliveryTemplate): string {
    return `🏠 *Delivery Confirmation*

Dear *${template.customerName}*,

✅ *Delivery Details:*
• Bottles Delivered: *${template.bottlesDelivered}*
• Empty Bottles Collected: *${template.emptyBottlesCollected}*
• Total Amount: *${formatCurrency(template.totalAmount)}*
• Delivery Date: *${template.deliveryDate}*
${template.deliveryPerson ? `• Delivered by: *${template.deliveryPerson}*` : ''}

📅 *Next Delivery:* ${template.nextDeliveryDate}

Thank you for choosing our water delivery service! 💧

---
*This is an automated message from Water Delivery Service*`
  }

    /**
   * Daily delivery summary for admin
   */
    static dailySummary(summary: any): string {
      return `📊 *Daily Delivery Summary - ${summary.date}*
  
      📈 *Statistics:*
      • Total Deliveries: *${summary.totalDeliveries}*
      • Bottles Delivered: *${summary.totalBottles}*
      • Empty Bottles Collected: *${summary.totalEmpty}*
      • Total Revenue: *${formatCurrency(summary.totalRevenue)}*
  
      ✅ *Completed Deliveries:*
      ${summary.deliveries.map((d: any) =>
            `• ${d.customer.name} - ${d.bottlesDelivered} bottles - ${formatCurrency(d.totalAmount)}`
          ).join('\n')}
  
      Great work team! 🎉
  
      ---
      *Water Delivery Management System*`
    }



}

/**
 * INVOICE TEMPLATES
 */
export class InvoiceTemplates {
  /**
   * Invoice caption for PDF
   */
  static invoiceCaption(invoice: Invoice): string {
    const dueDate = formatDate(invoice.dueAt)

    switch (invoice.status) {
      case 'unpaid':
        return `Dear *${invoice.customer.name}*,\n\nYour invoice is attached and total dues are *${formatCurrency(invoice.dueAmount!)}*/-.\n\nDue Date: *${dueDate}*`
      case 'partially-paid':
        return `Dear *${invoice.customer.name}*,\n\nYour invoice is attached and remaining dues are *${formatCurrency(invoice.dueAmount!)}*/-.\n\nDue Date: *${dueDate}*`
      default:
        return `Dear *${invoice.customer.name}*,\n\nPlease find your invoice attached.\n\nDue Date: *${dueDate}*`
    }
  }

  /**
   * Payment reminder message
   */
  static paymentReminder(customerName: string, invoice: Invoice): string {
    const dueAt = formatDate(invoice.dueAt)
    const daysOverdue = Math.ceil((new Date().getTime() - invoice.dueAt.getTime()) / (1000 * 60 * 60 * 24))

    let urgencyLevel = ''
    if (daysOverdue > 0) {
      urgencyLevel = `⚠️ *OVERDUE BY ${daysOverdue} DAYS*`
    } else if (daysOverdue === 0) {
      urgencyLevel = `🔴 *DUE TODAY*`
    } else {
      urgencyLevel = `🟡 *DUE IN ${Math.abs(daysOverdue)} DAYS*`
    }

    return `💰 *Payment Reminder*

      Dear *${customerName}*,

      ${urgencyLevel}

      Your invoice ${format(invoice.dueAt, "MMMM")} has a remaining balance of *${formatCurrency(invoice.dueAmount!)}*.

      📅 *Due Date:* ${dueAt}

      Please make the payment at your earliest convenience to avoid any service interruption.

      Thank you for your prompt attention! 💧

      ---
      *Water Delivery Service*`
  }

}
