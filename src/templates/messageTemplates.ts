import { DeliveryTemplate, VacationNotification, Invoice } from '../types/business'

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
   * Delivery reminder message
   */
  static deliveryReminder(customerName: string, deliveryDate: Date): string {
    const formattedDate = formatDate(deliveryDate)

    return `🔔 *Delivery Reminder*

Dear *${customerName}*,

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
   * Delivery status update message
   */
  static statusUpdate(customerName: string, status: string, estimatedTime?: string): string {
    return `📱 *Delivery Status Update*

Dear *${customerName}*,

Your delivery status: *${status}*

${estimatedTime ? `Estimated delivery time: *${estimatedTime}*` : ''}

We'll keep you updated on any changes.

Thank you for your patience! 💧

---
*Water Delivery Service*`
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

  /**
   * Bulk delivery reminder
   */
  static bulkDeliveryReminder(deliveryDate: Date): string {
    const formattedDate = formatDate(deliveryDate)

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

/**
 * NOTIFICATION TEMPLATES
 */
export class NotificationTemplates {
  /**
   * Vacation notification
   */
  static vacation(vacation: VacationNotification): string {
    const startDate = formatDate(new Date(vacation.startDate))
    const endDate = formatDate(new Date(vacation.endDate))
    const resumptionDate = formatDate(new Date(vacation.resumptionDate))

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
   * Service announcement
   */
  static announcement(title: string, message: string): string {
    return `📢 *Service Announcement*

      *${title}*

      ${message}

      Thank you for your attention! 💧

      ---
      *Water Delivery Service*`
        }

  /**
   * Payment reminder
   */
  static paymentReminder(customerName: string, amount: number, dueDate: Date): string {
    const formattedDueDate = formatDate(dueDate)

    return `💰 *Payment Reminder*

      Dear *${customerName}*,

      This is a friendly reminder that you have an outstanding balance of *${formatCurrency(amount)}*.

      📅 *Due Date:* ${formattedDueDate}

      Please make the payment at your earliest convenience to avoid any service interruption.

      Thank you for your prompt attention! 💧

      ---
      *Water Delivery Service*`
        }

  /**
   * Area-specific notification
   */
  static areaNotification(area: string, title: string, message: string): string {
    return `📍 *Area-Specific Notice - ${area}*

      *${title}*

      ${message}

      This notice is specifically for customers in the *${area}* area.

      Thank you! 💧

      ---
      *Water Delivery Service*`
        }

  /**
   * Delivery delay notification
   */
  static deliveryDelay(reason: string, estimatedDelay: string): string {
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
   * Service resumption notification
   */
  static serviceResumption(resumptionDate: Date): string {
    const formattedDate = formatDate(resumptionDate)

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
   * Emergency notification
   */
  static emergency(message: string): string {
    return `🚨 *EMERGENCY NOTICE*

    ${message}

    Please take necessary precautions and stay safe.

    We will provide updates as soon as possible.

    ---
    *Water Delivery Service*`
      }

  /**
   * Weather alert
   */
  static weatherAlert(weatherCondition: string, impact: string): string {
    return `🌦️ *Weather Alert*

    *Current Condition:* ${weatherCondition}

    *Impact on Service:* ${impact}

    Please stay safe and we'll adjust our delivery schedule accordingly.

    Thank you! 💧

    ---
    *Water Delivery Service*`
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
    const dueDate = formatDate(invoice.dueDate)

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
   * Invoice as text message
   */
  static invoiceText(invoice: Invoice): string {
    const invoiceDate = formatDate(invoice.createdAt)
    const dueDate = formatDate(invoice.dueDate)

    return `📄 *INVOICE #${invoice.id}*

    *Customer:* ${invoice.customer.name}
    *Address:* ${invoice.customer.address}
    *Phone:* ${invoice.customer.phone}
    *Invoice Date:* ${invoiceDate}
    *Due Date:* ${dueDate}

    *Items:*
    ${invoice.items.map(item => 
      `• ${item.description} - Qty: ${item.quantity} - Rate: ${formatCurrency(item.rate)} - Amount: ${formatCurrency(item.amount)}`
    ).join('\n')}

    *Total Amount:* ${formatCurrency(invoice.totalAmount)}
    *Paid Amount:* ${formatCurrency(invoice.paidAmount)}
    *Due Amount:* ${formatCurrency(invoice.dueAmount)}

    *Status:* ${invoice.status.toUpperCase()}

    Thank you for your business! 💧

    ---
    *Water Delivery Service*`
      }

  /**
   * Payment reminder message
   */
  static paymentReminder(customerName: string, invoice: Invoice): string {
    const dueDate = formatDate(invoice.dueDate)
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

    Dear *${customerName}*,

    ${urgencyLevel}

    Your invoice #${invoice.id} has a remaining balance of *${formatCurrency(invoice.dueAmount!)}*.

    📅 *Due Date:* ${dueDate}

    Please make the payment at your earliest convenience to avoid any service interruption.

    Thank you for your prompt attention! 💧

    ---
    *Water Delivery Service*`
      }

  /**
   * Invoice summary for admin
   */
  static invoiceSummary(invoices: Invoice[], totalAmount: number): string {
    const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid')
    const partiallyPaidInvoices = invoices.filter(inv => inv.status === 'partially-paid')
    const paidInvoices = invoices.filter(inv => inv.status === 'paid')

    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.dueAmount!, 0)
    const totalPartiallyPaid = partiallyPaidInvoices.reduce((sum, inv) => sum + inv.dueAmount!, 0)

    return `📊 *Invoice Summary Report*

    *Total Invoices:* ${invoices.length}
    *Total Amount:* ${formatCurrency(totalAmount)}

    *Status Breakdown:*
    • Unpaid: ${unpaidInvoices.length} invoices - ${formatCurrency(totalUnpaid)}
    • Partially Paid: ${partiallyPaidInvoices.length} invoices - ${formatCurrency(totalPartiallyPaid)}
    • Paid: ${paidInvoices.length} invoices

    *Top Unpaid Invoices:*
    ${unpaidInvoices
      .sort((a, b) => b.dueAmount! - a.dueAmount!)
      .slice(0, 5)
      .map(inv => `• ${inv.customer.name} - ${formatCurrency(inv.dueAmount!)}`)
      .join('\n')}

    ---
    *Water Delivery Management System*`
      }
    }
