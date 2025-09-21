import { WhatsAppService, DeliveryService, NotificationService, InvoiceService } from './services'
import { Customer, Delivery, Invoice, VacationNotification } from './types/business'

// Initialize services
const whatsappService = new WhatsAppService()
const deliveryService = new DeliveryService(whatsappService)
const notificationService = new NotificationService(whatsappService)
const invoiceService = new InvoiceService(whatsappService)

// Sample data for testing
const sampleCustomer: Customer = {
  id: '1',
  name: 'Shaheem Khan',
  phone: '+923161137297',
  address: '123 Main Street, Karachi',
  deliveryArea: 'Gulshan-e-Iqbal',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

const sampleDelivery: Delivery = {
  id: '1',
  customerId: '1',
  customer: sampleCustomer,
  date: new Date(),
  bottlesDelivered: 2,
  emptyBottlesCollected: 3,
  totalAmount: 100,
  status: 'completed',
  notes: 'Regular delivery',
  deliveryPerson: 'Muhammad Hassan'
}

const sampleInvoice: Invoice = {
  id: 'INV-001',
  customerId: '1',
  customer: sampleCustomer,
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  totalAmount: 100,
  paidAmount: 0,
  dueAmount: 100,
  status: 'unpaid',
  items: [
    {
      description: 'Water Delivery - 2 bottles',
      quantity: 2,
      rate: 50,
      amount: 100
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
}

// Example usage functions
async function exampleUsage() {
  try {
    console.log('🚀 Starting WhatsApp Business Bot...')

    // 1. Send delivery confirmation
    console.log('\n📦 Sending delivery confirmation...')
    await deliveryService.sendDeliveryConfirmation(sampleDelivery)

    // 2. Send invoice
    console.log('\n📄 Sending invoice...')
    await invoiceService.sendInvoicePdf(sampleCustomer, sampleInvoice)

    // 3. Send vacation notification
    console.log('\n🏖️ Sending vacation notification...')
    const vacation: VacationNotification = {
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      reason: 'Annual maintenance and staff training',
      resumptionDate: '2024-01-21'
    }
    await notificationService.sendVacationNotification([sampleCustomer], vacation)

    // 4. Send service announcement
    console.log('\n📢 Sending service announcement...')
    await notificationService.sendServiceAnnouncement(
      [sampleCustomer],
      'New Delivery Schedule',
      'Starting next week, we will be delivering on Tuesdays and Fridays instead of Mondays and Thursdays.'
    )

    // 5. Send payment reminder
    console.log('\n💰 Sending payment reminder...')
    await notificationService.sendPaymentReminder([sampleCustomer], 100, new Date())

    console.log('\n✅ All messages sent successfully!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the example
// exampleUsage()
