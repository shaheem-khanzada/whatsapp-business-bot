import { Router, Request, Response } from 'express'
import { DeliveryService } from '../../services/delivery.service'
import { WhatsAppService } from '../../services/whatsapp.service'
import { validateDelivery } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import { Delivery, Customer } from '../../types/business'

const router = Router()

// Initialize services
const whatsappService = new WhatsAppService()
const deliveryService = new DeliveryService(whatsappService)

/**
 * @route   POST /api/delivery/confirm
 * @desc    Send delivery confirmation message
 * @access  Public
 */
router.post('/confirm', validateDelivery, async (req: Request, res: Response) => {
  try {
    const { customerId, bottlesDelivered, emptyBottlesCollected, totalAmount, deliveryPerson, notes } = req.body

    // In a real app, you'd fetch customer from database
    const customer: Customer = {
      id: customerId,
      name: 'Shaheem Khan', // This should come from database
      phone: '+923161137297',
      address: '123 Main Street, Karachi',
      deliveryArea: 'Gulshan-e-Iqbal',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const delivery: Delivery = {
      id: `DEL-${Date.now()}`,
      customerId,
      customer,
      date: new Date(),
      bottlesDelivered,
      emptyBottlesCollected,
      totalAmount,
      status: 'completed',
      notes,
      deliveryPerson
    }

    await deliveryService.sendDeliveryConfirmation(delivery)

    res.json({
      success: true,
      message: 'Delivery confirmation sent successfully',
      data: { deliveryId: delivery.id }
    })
  } catch (error) {
    throw new AppError(`Failed to send delivery confirmation: ${error}`, 500)
  }
})

export default router
