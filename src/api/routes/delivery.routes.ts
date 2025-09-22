import { Router, Request, Response } from 'express'
import { deliveryService } from '../../services/global'
import { validateDelivery } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import { Delivery, Customer } from '../../types/business'

const router = Router()

/**
 * @route   POST /api/delivery/confirm
 * @desc    Send delivery confirmation message
 * @access  Public
 */
router.post('/confirm', validateDelivery, async (req: Request, res: Response) => {
  try {
    const { clientId, bottlesDelivered, emptyBottlesCollected, totalAmount, deliveryPerson, notes } = req.body

    if (!clientId) {
      throw new AppError('clientId is required', 400)
    }

    // In a real app, you'd fetch customer from database
    const customer: Customer = {
      name: 'Shaheem Khan', // This should come from database
      phone: '+923161137297',
    }

    const delivery: Delivery = {
      customer,
      date: new Date(),
      bottlesDelivered,
      emptyBottlesCollected,
      totalAmount,
      status: 'completed',
      notes,
      deliveryPerson
    }

    await deliveryService.sendDeliveryConfirmation(clientId, delivery)

    res.json({
      success: true,
      message: 'Delivery confirmation sent successfully',
    })
  } catch (error) {
    throw new AppError(`Failed to send delivery confirmation: ${error}`, 500)
  }
})

export default router
