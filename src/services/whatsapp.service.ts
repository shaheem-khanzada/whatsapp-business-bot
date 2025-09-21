import qrcode from 'qrcode-terminal'
import QRCode from 'qrcode'
import pkg from 'whatsapp-web.js'

const { Client, LocalAuth, MessageMedia } = pkg

export class WhatsAppService {
  private client: InstanceType<typeof Client> | null = null
  private isInitialized = false
  private currentQRCode: string | null = null

  constructor() {
    // Don't auto-initialize, let API control it
  }

  /**
   * Initialize WhatsApp client with QR authentication
   */
  async initializeClient() {
    if (this.isInitialized) return

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true, // Set to true for production
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/Users/muhammadshaheem/.cache/puppeteer/chrome/mac_arm-140.0.7339.82/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
      },
    })

    this.client.on('qr', async (qr: string) => {
      console.log('📲 QR code generated for WhatsApp login')
      // Generate QR code as base64 data URL
      this.currentQRCode = await QRCode.toDataURL(qr)
    })

    this.client.on('ready', () => {
      console.log('✅ WhatsApp client is ready!')
      this.isInitialized = true
      this.currentQRCode = null // Clear QR code once connected
    })

    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication failed:', msg)
      this.currentQRCode = null
    })

    this.client.on('disconnected', (reason) => {
      console.log('❌ WhatsApp client disconnected:', reason)
      this.isInitialized = false
      this.currentQRCode = null
    })

    await this.client.initialize()
  }

  /**
   * Get current QR code as base64 data URL
   */
  async getQRCode(): Promise<string> {
    if (!this.currentQRCode) {
      throw new Error('No QR code available. Please initialize WhatsApp first.')
    }
    return this.currentQRCode
  }

  /**
   * Wait for client to be ready
   */
  private async waitForReady(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  /**
   * Convert phone number to WhatsApp chat ID
   */
  private toChatId(phone: string): string {
    return `${phone.replace(/\D/g, '')}@c.us`
  }

  /**
   * Send text message to a phone number
   */
  async sendText(phone: string, message: string): Promise<void> {
    await this.waitForReady()
    if (!this.client) throw new Error('WhatsApp client not initialized')

    const chatId = this.toChatId(phone)
    await this.client.sendMessage(chatId, message)
    console.log(`💬 Text sent to ${phone}`)
  }

  /**
   * Send PDF document to a phone number
   */
  async sendPdf(phone: string, pdfBuffer: Buffer, filename: string, caption?: string): Promise<void> {
    await this.waitForReady()
    if (!this.client) throw new Error('WhatsApp client not initialized')

    const chatId = this.toChatId(phone)
    const media = new MessageMedia(
      'application/pdf',
      pdfBuffer.toString('base64'),
      filename
    )

    await this.client.sendMessage(chatId, media, { caption })
    console.log(`📄 PDF sent to ${phone}`)
  }

  /**
   * Send PDF from URL
   */
  async sendPdfFromUrl(phone: string, pdfUrl: string, filename: string, caption?: string): Promise<void> {
    try {
      const response = await fetch(pdfUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF from ${pdfUrl}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      await this.sendPdf(phone, buffer, filename, caption)
    } catch (error) {
      console.error(`Error sending PDF from URL: ${error}`)
      throw error
    }
  }

  /**
   * Send image to a phone number
   */
  async sendImage(phone: string, imageBuffer: Buffer, filename: string, caption?: string): Promise<void> {
    await this.waitForReady()
    if (!this.client) throw new Error('WhatsApp client not initialized')

    const chatId = this.toChatId(phone)
    const media = new MessageMedia(
      'image/jpeg',
      imageBuffer.toString('base64'),
      filename
    )

    await this.client.sendMessage(chatId, media, { caption })
    console.log(`🖼️ Image sent to ${phone}`)
  }

  /**
   * Send bulk messages to multiple phone numbers
   */
  async sendBulkText(phones: string[], message: string, delayMs: number = 1000): Promise<void> {
    for (const phone of phones) {
      try {
        await this.sendText(phone, message)
        await this.sleep(delayMs) // Rate limiting
      } catch (error) {
        console.error(`Failed to send message to ${phone}:`, error)
      }
    }
  }

  /**
   * Check if a phone number is registered on WhatsApp
   */
  async isRegisteredUser(phone: string): Promise<boolean> {
    await this.waitForReady()
    if (!this.client) throw new Error('WhatsApp client not initialized')

    const chatId = this.toChatId(phone)
    return await this.client.isRegisteredUser(chatId)
  }

  /**
   * Get client status
   */
  async getStatus(): Promise<string> {
    if (!this.client) return 'not_initialized'
    return await this.client.getState()
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Close the WhatsApp client
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.destroy()
      this.client = null
      this.isInitialized = false
    }
  }
}
