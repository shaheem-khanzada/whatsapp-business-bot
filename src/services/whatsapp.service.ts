import QRCode from 'qrcode'
import { RemoteAuth, Client, MessageMedia } from 'whatsapp-web.js'
import QRCodeTerminal from 'qrcode-terminal'
import mongoose from 'mongoose'
import { MongoStore } from 'wwebjs-mongo'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'


dotenv.config()

export class WhatsAppService {
  private clients: Map<string, InstanceType<typeof Client>> = new Map()
  private qrCodes: Map<string, string> = new Map()
  private authPath = path.resolve(process.cwd(), '.wwebjs_auth')
  private maxInitTimeout = 30000 // ms
  private mongoStore: InstanceType<typeof MongoStore> | null = null

  constructor() {
    // Initialize MongoDB connection
    this.initializeMongoDB()
  }

  /**
   * Initialize MongoDB connection
   */
  private async initializeMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI!

      await mongoose.connect(mongoUri)
      console.log('✅ MongoDB connected successfully')

      // Initialize MongoStore
      this.mongoStore = new MongoStore({ mongoose })
      this.restoreAllClients()

      console.log('✅ MongoStore initialized successfully')
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error)
      console.log('⚠️ Falling back to LocalAuth')
    }
  }

  private async getClientIdsFromAuthPath(): Promise<string[]> {
    if (!fs.existsSync(this.authPath)) return []
    const entries = fs.readdirSync(this.authPath, { withFileTypes: true })
    const clientIds = entries
      .filter(e => e.isDirectory() && e.name.startsWith('RemoteAuth-'))
      .map(e => e.name.replace(/^RemoteAuth-/, ''))
    // .filter(clientId => {
    //   // check if folder has files
    //   const fullPath = path.join(this.authPath, `RemoteAuth-${clientId}`)
    //   const contents = fs.readdirSync(fullPath)
    //   return contents.length > 0 // only include if not empty
    // })

    return clientIds
  }

  /**
 * Restore all sessions from .wwebjs_auth directory
 */
  private async restoreAllClients() {
    if (!fs.existsSync(this.authPath)) return

    const clientIds = await this.getClientIdsFromAuthPath()

    console.log(`🔄 Found ${clientIds.length} RemoteAuth:`, clientIds)

    for (const clientId of clientIds) {
      const sessionExists = await this.mongoStore.sessionExists({ session: `RemoteAuth-${clientId}` })
      console.log('✅ Session exists:', sessionExists)

      if (!sessionExists) {
        console.log(`Session does not exist for client ${clientId}`)
        this.deleteAuthDirectory(clientId)
        continue
      }

      try {
        await this.loginClient(clientId)
        console.log(`✅ Restored client ${clientId}`)
      } catch (err) {
        console.error(`Failed to restore client ${clientId}:`, err)
      }
    }
  }

  /**
   * Initialize WhatsApp client with QR authentication for specific client
   */
  async loginClient(clientId: string) {
    try {
      // Check if client already exists and is connected
      if (this.clients.has(clientId)) {
        console.log(`Client ${clientId} already exists`)
        const status = await this.getStatus(clientId)
        console.log(`Status of client ${clientId}:`, status)
        if (status === 'CONNECTED') {
          console.log(`✅ Client ${clientId} already connected`)
          return
        }
        // If client exists but not connected, destroy and recreate
        await this.close(clientId).catch()
      }

      // Create new client with unique clientId
      const authStrategy = new RemoteAuth({
        clientId,
        store: this.mongoStore,
        backupSyncIntervalMs: 300000 // 5 minutes
      })

      const client = new Client({
        authStrategy,
        puppeteer: {
          headless: process.env.NODE_ENV === 'production',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
        },
      })
      console.log(`New client created for ${clientId}`)

      // bind events before initialize
      this.bindEvents(client, clientId)

      // Store client
      this.clients.set(clientId, client)
      console.log(`Client ${clientId} set in map`)

      // timeout guard
      const initPromise = client.initialize()
      await Promise.race([
        initPromise,
        new Promise((_, rej) => setTimeout(() => rej(new Error('initialize timeout')), this.maxInitTimeout))
      ])

      console.log(`Client ${clientId} initialized`)
    } catch (error) {
      console.error(`Error initializing client ${clientId}:`, error)
      this.close(clientId)
      throw error
    }
  }

  /** Event binding helper */
  private bindEvents(client: InstanceType<typeof Client>, clientId: string) {
    client.removeAllListeners() // ensure no dupes
    console.log(`🔗 ${'\x1b[36m'}Binding events for client: ${clientId}${'\x1b[0m'}`)

    client.on('qr', async (qr: string) => {
      try {
        console.log(`📱 ${'\x1b[33m'}QR code generated for client: ${clientId}${'\x1b[0m'}`)
        QRCodeTerminal.generate(qr, { small: true })
        const qrCodeDataUrl = await QRCode.toDataURL(qr)
        this.qrCodes.set(clientId, qrCodeDataUrl)
      } catch (e) {
        console.warn(`⚠️ ${'\x1b[31m'}QR generation failed for ${clientId}${'\x1b[0m'}`, e)
      }
    })

    client.on('ready', () => {
      console.log(`🚀 ${'\x1b[32m'}Client ${clientId} is READY!${'\x1b[0m'}`)
      console.log(`✅ ${'\x1b[32m'}WhatsApp client ready for: ${clientId}${'\x1b[0m'}`)
      this.qrCodes.delete(clientId) // Clear QR code once connected
      client.removeAllListeners('qr') // Remove QR listener when ready
    })

    client.on('auth_failure', msg => {
      console.log(`❌ ${'\x1b[31m'}AUTH FAILURE for ${clientId}${'\x1b[0m'}`, msg)
      console.log(`💥 ${'\x1b[31m'}WhatsApp authentication failed for ${clientId}: ${msg}${'\x1b[0m'}`)
      this.close(clientId)
    })

    client.on('disconnected', reason => {
      console.log(`🔌 ${'\x1b[35m'}WhatsApp client disconnected for ${clientId}: ${reason}${'\x1b[0m'}`)
      try {
        this.close(clientId)
      } catch (error) {
        console.log(`❌ disconnectedError: `, error)
      }
    })

    client.on('change_state', (state) => {
      const stateColor = state === 'CONNECTED' ? '\x1b[32m' : state === 'OPENING' ? '\x1b[33m' : '\x1b[31m'
      console.log(`🔄 ${stateColor}State change for ${clientId}: ${state}${'\x1b[0m'}`)
    })

    client.on('loading_screen', (percent, msg) => {
      const percentNum = Number(percent.replace('%', '')) || 0
      const progressBar = '█'.repeat(Math.floor(percentNum / 10)) + '░'.repeat(10 - Math.floor(percentNum / 10))
      console.log(`⏳ ${'\x1b[36m'}Loading ${clientId}: [${progressBar}] ${percentNum}% - ${msg}${'\x1b[0m'}`)
    })

    client.on('remote_session_saved', () => {
      console.log(`💾 ${'\x1b[34m'}Remote session saved for ${clientId}${'\x1b[0m'}`)
    })

    client.on('authenticated', (session) => {
      console.log(`🔐 ${'\x1b[32m'}Authenticated successfully for ${clientId}${'\x1b[0m'}`, session)
    })
  }

  /**
   * Get current QR code as base64 data URL for specific client with polling
   */
  async getQRCode(clientId: string, maxWaitTime: number = 30000): Promise<string> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      // Check if client exists
      if (!this.clients.has(clientId)) {
        throw new Error(`Client ${clientId} not found. Please initialize WhatsApp first.`)
      }

      // Check if client is already connected
      try {
        const client = this.clients.get(clientId)!
        const state = await client.getState()
        if (state === 'CONNECTED') {
          throw new Error(`Client ${clientId} is already connected. No QR code needed.`)
        }
      } catch (error) {
        // If state check fails, continue to check for QR code
      }

      // Check if QR code is available
      if (this.qrCodes.has(clientId)) {
        return this.qrCodes.get(clientId)!
      }

      // Wait 500ms before checking again
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    throw new Error(`QR code not generated within ${maxWaitTime}ms. Please try again.`)
  }

  /**
   * Get all active clients
   */
  getActiveClients(): string[] {
    return Array.from(this.clients.keys())
  }

  /**
 * Check if client is ready
 */
  async isClientReady(clientId: string): Promise<boolean> {
    try {
      if (!this.clients.has(clientId)) {
        return false
      }
      const client = this.clients.get(clientId)!
      const state = await client.getState()
      return state === 'CONNECTED'
    } catch (error) {
      console.error(`Error checking client ${clientId} state:`, error)
      return false
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
   * Send file to a phone number
   * Expects Blob object with MIME type
   */
  async sendFile(
    clientId: string, 
    phone: string, 
    file: Blob, 
    filename: string, 
    mimeType: string, 
    caption?: string
  ): Promise<void> {
    await this.ensureClientReady(clientId)
    const client = this.clients.get(clientId)!

    // Convert Blob to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const chatId = this.toChatId(phone)
    const media = new MessageMedia(
      mimeType,
      fileBuffer.toString('base64'),
      filename
    )

    await client.sendMessage(chatId, media, { caption })
    console.log(`📎 File sent to ${phone} via client ${clientId}: ${filename}`)
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
    try {
      if (!this.clients.has(clientId)) return 'Not Initialized'
      const client = this.clients.get(clientId)!
      return await client.getState()
    } catch (error: any) {
      console.error(`Error getting status for client ${clientId}:`, error.message)
      return 'DISCONNECTED'
    }
  }

  async logout(clientId: string) {
    if (!this.clients.has(clientId)) return
    const state = await this.getStatus(clientId)
    if (state === 'CONNECTED') {
      const client = this.clients.get(clientId)!
      await client.logout()
    } else {
      throw new Error(`Client ${clientId} is not connected`)
    }
  }

  /**
   * Delete RemoteAuth directory for a specific client
   */
  private deleteAuthDirectory(clientId: string): void {
    try {
      const authDir = path.join(this.authPath, `RemoteAuth-${clientId}`)
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true })
        console.log(`🗑️ ${'\x1b[33m'}Deleted auth directory for ${clientId}${'\x1b[0m'}`)
      }
    } catch (error) {
      console.error(`❌ ${'\x1b[31m'}Failed to delete auth directory for ${clientId}:${'\x1b[0m'}`, error)
    }
  }

  /**
   * Close the WhatsApp client
   */
  async close(clientId: string) {
    if (!this.clients.has(clientId)) return
    const client = this.clients.get(clientId)!

    try { await this.logout(clientId) } catch { }
    try { await client.destroy() } catch { }

    setTimeout(() => this.deleteAuthDirectory(clientId), 5000)

    this.clients.delete(clientId)
    this.qrCodes.delete(clientId)

    console.log(`✅ Client ${clientId} closed`)
  }

  /**
   * Close all clients
   */
  async closeAll(): Promise<void> {
    const clientIds = Array.from(this.clients.keys())
    console.log(`🔄 Closing ${clientIds.length} clients...`)

    for (const clientId of clientIds) {
      await this.close(clientId)
    }

    console.log(`✅ All clients closed`)
  }

  /**
   * Get QR code directly from storage (no polling)
   */
  getQRCodeDirect(clientId: string): string | null {
    return this.qrCodes.get(clientId) || null
  }

}
