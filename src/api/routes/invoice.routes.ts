import { Router, Request, Response } from 'express'
import { InvoiceService } from '../../services/invoice.service'
import { WhatsAppService } from '../../services/whatsapp.service'
import { validateInvoice, validatePhoneNumber } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import { Customer, Invoice, InvoiceItem } from '../../types/business'

const router = Router()

// Initialize services
const whatsappService = new WhatsAppService()
const invoiceService = new InvoiceService(whatsappService)

/**
 * @route   POST /api/invoices/send
 * @desc    Send invoice PDF to customer
 * @access  Public
 */
router.post('/send', validateInvoice, async (req: Request, res: Response) => {
  try {
    const { customerId, totalAmount, items, pdfUrl, dueDate } = req.body

    // In a real app, you'd fetch customer from database
    const customer: Customer = {
      id: customerId,
      name: 'Shaheem Khan',
      phone: '+923161137297',
      address: '123 Main Street, Karachi',
      deliveryArea: 'Gulshan-e-Iqbal',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const invoice: Invoice = {
      id: `INV-${Date.now()}`,
      customerId,
      customer,
      dueDate: new Date(dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      status: 'unpaid',
      items: items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await invoiceService.sendInvoicePdf(customer, invoice, pdfUrl)

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      data: { invoiceId: invoice.id }
    })
  } catch (error) {
    throw new AppError(`Failed to send invoice: ${error}`, 500)
  }
})

/**
 * @route   POST /api/invoices/payment-reminder
 * @desc    Send payment reminder with invoice
 * @access  Public
 */
router.post('/payment-reminder', async (req: Request, res: Response) => {
  try {
    const { customerId, invoiceId, amount, dueDate, pdfUrl } = req.body

    if (!customerId || !amount || !dueDate) {
      throw new AppError('Customer ID, amount, and due date are required', 400)
    }

    // In a real app, you'd fetch customer and invoice from database
    const customer: Customer = {
      id: customerId,
      name: 'Shaheem Khan',
      phone: '+923161137297',
      address: '123 Main Street, Karachi',
      deliveryArea: 'Gulshan-e-Iqbal',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const invoice: Invoice = {
      id: invoiceId || `INV-${Date.now()}`,
      customerId,
      customer,
      dueDate: new Date(dueDate),
      totalAmount: amount,
      paidAmount: 0,
      dueAmount: amount,
      status: 'unpaid',
      items: [
        {
          description: 'Water Delivery Service',
          quantity: 1,
          rate: amount,
          amount: amount
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await invoiceService.sendPaymentReminderWithInvoice(customer, invoice, pdfUrl)

    res.json({
      success: true,
      message: 'Payment reminder sent successfully',
      data: { invoiceId: invoice.id }
    })
  } catch (error) {
    throw new AppError(`Failed to send payment reminder: ${error}`, 500)
  }
})

export default router
