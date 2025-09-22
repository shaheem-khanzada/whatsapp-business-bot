import QRCode from 'qrcode'
import pkg from 'whatsapp-web.js'

const { Client, LocalAuth, MessageMedia } = pkg

export class WhatsAppService {
  private clients: Map<string, InstanceType<typeof Client>> = new Map()
  private clientStatus: Map<string, { isInitialized: boolean; qrCode: string | null; isReady: boolean }> = new Map()

  constructor() {
    // Don't auto-initialize, let API control it
  }

  /**
   * Initialize WhatsApp client with QR authentication for specific client
   */
  async initializeClient(clientId: string) {
    // Check if client already exists and is initialized
    if (this.clients.has(clientId) && this.clientStatus.get(clientId)?.isInitialized) {
      return
    }

    // Create new client with unique clientId
    const client = new Client({
      authStrategy: new LocalAuth({ clientId }),
      puppeteer: {
        headless: true, // Set to true for production
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/Users/muhammadshaheem/.cache/puppeteer/chrome/mac_arm-140.0.7339.82/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
      },
    })

    // Initialize client status
    this.clientStatus.set(clientId, {
      isInitialized: false,
      qrCode: null,
      isReady: false
    })

    client.on('qr', async (qr: string) => {
      console.log(`📲 QR code generated for client: ${clientId}`)
      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qr)
      const status = this.clientStatus.get(clientId)
      if (status) {
        status.qrCode = qrCodeDataUrl
        this.clientStatus.set(clientId, status)
      }
    })

    client.on('ready', () => {
      console.log(`✅ WhatsApp client ready for: ${clientId}`)
      const status = this.clientStatus.get(clientId)
      if (status) {
        status.isReady = true
        status.qrCode = null // Clear QR code once connected
        this.clientStatus.set(clientId, status)
      }
    })

    client.on('auth_failure', (msg) => {
      console.error(`❌ WhatsApp authentication failed for ${clientId}:`, msg)
      const status = this.clientStatus.get(clientId)
      if (status) {
        status.qrCode = null
        this.clientStatus.set(clientId, status)
      }
    })

    client.on('disconnected', (reason) => {
      console.log(`❌ WhatsApp client disconnected for ${clientId}:`, reason)
      const status = this.clientStatus.get(clientId)
      if (status) {
        status.isReady = false
        status.qrCode = null
        this.clientStatus.set(clientId, status)
      }
    })

    // Store client and mark as initialized
    this.clients.set(clientId, client)
    const status = this.clientStatus.get(clientId)
    if (status) {
      status.isInitialized = true
      this.clientStatus.set(clientId, status)
    }

    await client.initialize()
  }

  /**
   * Get current QR code as base64 data URL for specific client with polling
   */
  async getQRCode(clientId: string, maxWaitTime: number = 30000): Promise<string> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = this.clientStatus.get(clientId)
      
      if (!status) {
        throw new Error(`Client ${clientId} not found. Please initialize WhatsApp first.`)
      }
      
      if (status.isReady) {
        throw new Error(`Client ${clientId} is already connected. No QR code needed.`)
      }
      
      if (status.qrCode) {
        return status.qrCode
      }
      
      // Wait 500ms before checking again
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    throw new Error(`QR code not generated within ${maxWaitTime}ms. Please try again.`)
  }

  /**
   * Check if client is ready
   */
  isClientReady(clientId: string): boolean {
    const status = this.clientStatus.get(clientId)
    return status?.isReady || false
  }

  /**
   * Get client status
   */
  getClientStatus(clientId: string): { isInitialized: boolean; qrCode: string | null; isReady: boolean } | null {
    return this.clientStatus.get(clientId) || null
  }

  /**
   * Get all active clients
   */
  getActiveClients(): string[] {
    return Array.from(this.clients.keys())
  }

  /**
   * Wait for client to be ready
   */
  private async waitForReady(clientId: string): Promise<void> {
    while (!this.isClientReady(clientId)) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  /**
   * Ensure client is ready before operations
   */
  private async ensureClientReady(clientId: string): Promise<void> {
    if (!this.clients.has(clientId)) {
      throw new Error(`Client ${clientId} not found. Please initialize first by calling /api/whatsapp/login`)
    }

    if (!this.isClientReady(clientId)) {
      throw new Error(`Client ${clientId} is not ready. Please login to WhatsApp first by calling /api/whatsapp/login`)
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
  async sendText(clientId: string, phone: string, message: string): Promise<void> {
    await this.ensureClientReady(clientId)
    const client = this.clients.get(clientId)!
    
    const chatId = this.toChatId(phone)
    await client.sendMessage(chatId, message)
    console.log(`💬 Text sent to ${phone} via client ${clientId}`)
  }

  /**
   * Send PDF document to a phone number
   */
  async sendPdf(clientId: string, phone: string, pdfBuffer: Buffer, filename: string, caption?: string): Promise<void> {
    await this.ensureClientReady(clientId)
    const client = this.clients.get(clientId)!

    const chatId = this.toChatId(phone)
    const media = new MessageMedia(
      'application/pdf',
      pdfBuffer.toString('base64'),
      filename
    )

    await client.sendMessage(chatId, media, { caption })
    console.log(`📄 PDF sent to ${phone} via client ${clientId}`)
  }

  /**
   * Send PDF from URL
   */
  async sendPdfFromUrl(clientId: string, phone: string, pdfUrl: string, filename: string, caption?: string): Promise<void> {
    try {
      const response = await fetch(pdfUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF from ${pdfUrl}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      await this.sendPdf(clientId, phone, buffer, filename, caption)
    } catch (error) {
      console.error(`Error sending PDF from URL: ${error}`)
      throw error
    }
  }

  /**
   * Send image to a phone number
   */
  async sendImage(clientId: string, phone: string, imageBuffer: Buffer, filename: string, caption?: string): Promise<void> {
    await this.ensureClientReady(clientId)
    const client = this.clients.get(clientId)!

    const chatId = this.toChatId(phone)
    const media = new MessageMedia(
      'image/jpeg',
      imageBuffer.toString('base64'),
      filename
    )

    await client.sendMessage(chatId, media, { caption })
    console.log(`🖼️ Image sent to ${phone} via client ${clientId}`)
  }

  /**
   * Send bulk messages to multiple phone numbers
   */
  async sendBulkText(clientId: string, phones: string[], message: string, delayMs: number = 1000): Promise<void> {
    for (const phone of phones) {
      try {
        await this.sendText(clientId, phone, message)
        await this.sleep(delayMs) // Rate limiting
      } catch (error) {
        console.error(`Failed to send message to ${phone}:`, error)
      }
    }
  }

  /**
   * Check if a phone number is registered on WhatsApp
   */
  async isRegisteredUser(clientId: string, phone: string): Promise<boolean> {
    await this.ensureClientReady(clientId)
    const client = this.clients.get(clientId)!

    const chatId = this.toChatId(phone)
    return await client.isRegisteredUser(chatId)
  }

  /**
   * Get client status
   */
  async getStatus(clientId: string): Promise<string> {
    if (!this.clients.has(clientId)) return 'not_initialized'
    const client = this.clients.get(clientId)!
    return await client.getState()
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
  async close(clientId: string): Promise<void> {
    if (this.clients.has(clientId)) {
      const client = this.clients.get(clientId)!
      await client.destroy()
      this.clients.delete(clientId)
      this.clientStatus.delete(clientId)
    }
  }

  /**
   * Close all clients
   */
  async closeAll(): Promise<void> {
    for (const clientId of this.clients.keys()) {
      await this.close(clientId)
    }
  }
}
