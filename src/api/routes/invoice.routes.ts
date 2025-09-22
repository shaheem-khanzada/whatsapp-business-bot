import { Router, Request, Response } from 'express'
import { invoiceService } from '../../services/global'
import { validateInvoice, validatePhoneNumber } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import { Customer, Invoice } from '../../types/business'

const router = Router()

/**
 * @route   POST /api/invoices/send
 * @desc    Send invoice PDF to customer
 * @access  Public
 */
router.post('/send', validateInvoice, async (req: Request, res: Response) => {
  try {
    const { clientId, customerId, totalAmount, items, pdfUrl, dueDate } = req.body

    // In a real app, you'd fetch customer from database
    const customer: Customer = {
      name: 'Shaheem Khan',
      phone: '+923161137297',
    }

    const invoice: Invoice = {
      customer,
      dueAt: new Date(dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
      dueAmount: totalAmount,
      status: 'unpaid',
      pdfUrl: pdfUrl
    }

    await invoiceService.sendInvoicePdf(clientId, invoice)

    res.json({
      success: true,
      message: 'Invoice sent successfully'
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
    const { clientId, customerId, invoiceId, amount, dueDate, pdfUrl } = req.body

    if (!customerId || !amount || !dueDate) {
      throw new AppError('Customer ID, amount, and due date are required', 400)
    }

    // In a real app, you'd fetch customer and invoice from database
    const customer: Customer = {
      name: 'Shaheem Khan',
      phone: '+923161137297',
    }

    const invoice: Invoice = {
      customer,
      dueAt: new Date(dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
      dueAmount: amount,
      status: 'unpaid',
      pdfUrl: pdfUrl
    }

    await invoiceService.sendPaymentReminderWithInvoice(clientId, invoice)

    res.json({
      success: true,
      message: 'Payment reminder sent successfully',
    })
  } catch (error) {
    throw new AppError(`Failed to send payment reminder: ${error}`, 500)
  }
})

export default router
