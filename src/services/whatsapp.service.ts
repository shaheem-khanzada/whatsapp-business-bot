import { RemoteAuth, Client, MessageMedia, Message } from 'whatsapp-web.js'
import QRCodeGenerator from 'qrcode'
import mongoose from 'mongoose'
import { MongoStore } from 'wwebjs-mongo'
import path from 'path'
import { webSocketService } from './global'

// Constants
const CONSTANTS = {
  TIMEOUTS: {
    INIT: 60000, // 1 minute
    READY_WAIT: 120000, // 2 minutes
    QR_POLL: 30000, // 30 seconds
    CLOSE_OPERATION: 5000, // 5 seconds
    CLOSE_DESTROY: 10000, // 10 seconds
    CLOSE_SESSION: 5000, // 5 seconds
    CLOSE_ALL: 30000, // 30 seconds
  },
  STATUS: {
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
    AUTH_FAILED: 'AUTH_FAILED',
    TIMEOUT: 'TIMEOUT',
    ERROR: 'ERROR',
    PAIRING: 'PAIRING',
    AWAITING_SCAN: 'AWAITING_SCAN',
    LOADING: 'LOADING',
    NOT_INITIALIZED: 'NOT_INITIALIZED',
  },
  CONFIG: {
    BACKUP_SYNC_INTERVAL: 300000, // 5 minutes
    QR_POLL_INTERVAL: 500, // 500ms
    READY_CHECK_INTERVAL: 1000, // 1 second
    AUTH_CLEANUP_DELAY: 5000, // 5 seconds
  },
  CHROME_ARGS: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ],
} as const

// Types
interface LoginOptions {
  restore?: boolean
  sessionExists?: boolean
  waitForReady?: boolean
}

interface WebSocketMessage {
  type: string
  clientId: string
  status?: string
  qrCode?: string
  timestamp: string
}

// Custom Error Classes
class WhatsAppClientError extends Error {
  constructor(message: string, public clientId: string, public code?: string) {
    super(message)
    this.name = 'WhatsAppClientError'
  }
}

class WhatsAppTimeoutError extends WhatsAppClientError {
  constructor(clientId: string, operation: string) {
    super(`${operation} timed out for client ${clientId}`, clientId, 'TIMEOUT')
    this.name = 'WhatsAppTimeoutError'
  }
}

class WhatsAppNotReadyError extends WhatsAppClientError {
  constructor(clientId: string) {
    super(`Client ${clientId} is not ready`, clientId, 'NOT_READY')
    this.name = 'WhatsAppNotReadyError'
  }
}

/**
 * WhatsApp Business Bot Service
 * Manages multiple WhatsApp client instances with MongoDB session persistence
 */
export class WhatsAppService {
  private readonly clients: Map<string, InstanceType<typeof Client>> = new Map()
  private readonly qrCodes: Map<string, string> = new Map()
  private readonly authPath: string
  private mongoStore: InstanceType<typeof MongoStore> | null = null

  constructor() {
    this.authPath = path.resolve(process.cwd(), '.wwebjs_auth')
    this.initializeMongoDB()
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize MongoDB connection and restore existing sessions
   */
  private async initializeMongoDB(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI!
      await mongoose.connect(mongoUri)
      console.log('✅ MongoDB connected successfully')

      this.mongoStore = new MongoStore({ mongoose })
      const sessionIds = await this.getClientSessionIds()
      await this.restoreAllClients(sessionIds)
      console.log('✅ MongoStore initialized successfully')
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error)
    }
  }

  private async getClientSessionIds(): Promise<string[]> {
    try {

      const db = mongoose.connection.db;

      if (!db) {
        throw new Error('MongoDB connection not established')
      }

      const collections = await db.listCollections().toArray();

      // Step 3: Filter collections with GridFS naming
      const sessionIds = collections
        .filter(col => col.name.startsWith('whatsapp-RemoteAuth-') && col.name.endsWith('.files'))
        .map(col => {
          return col.name
            .replace('whatsapp-RemoteAuth-', '')
            .replace('.files', '');
        });
      return sessionIds;
    } catch (err) {
      console.error('Error fetching session names:', err);
      return [];
    }
  }

  /**
   * Restore all existing client sessions from auth directory
   */
  private async restoreAllClients(sessionIds: string[]): Promise<void> {
    if (!sessionIds.length) return

    console.log(`🔄 Found ${sessionIds.length} RemoteAuth sessions:`, sessionIds)

    for (const clientId of sessionIds) {
      try {
        const sessionExists = await this.mongoStore?.sessionExists({
          session: this.getSessionName(clientId)
        })

        if (!sessionExists) {
          console.log(`Session does not exist for client ${clientId}`)
          continue
        }

        await this.loginClient(clientId, { restore: true, sessionExists })
        console.log(`✅ Restored client ${clientId}`)
      } catch (error) {
        console.error(`Failed to restore client ${clientId}:`, error)
      }
    }
  }

  /**
   * Initialize WhatsApp client with QR authentication
   */
  async loginClient(clientId: string, options: LoginOptions = {}): Promise<void> {
    const { restore = false, sessionExists = false, waitForReady = false } = options

    try {
      // Validate client ID
      this.validateClientId(clientId)

      // Handle existing client
      if (this.clients.has(clientId)) {
        const status = await this.getStatus(clientId)
        if (status === CONSTANTS.STATUS.CONNECTED) {
          console.log(`✅ Client ${clientId} already connected`)
          return
        }
        await this.close(clientId)
      }

      // Create and configure client
      const client = await this.createClient(clientId)
      this.setupEventHandlers(client, clientId, { restore, sessionExists })
      this.clients.set(clientId, client)

      // Initialize client
      await this.initializeClient(client, clientId)

      // Wait for ready state if requested
      if (waitForReady) {
        await this.waitForClientReady(clientId)
      }
    } catch (error) {
      await this.handleLoginError(clientId, error, waitForReady)
      throw error
    }
  }

  /**
   * Create a new WhatsApp client instance
   */
  private async createClient(clientId: string): Promise<InstanceType<typeof Client>> {
    const authStrategy = new RemoteAuth({
      clientId,
      store: this.mongoStore,
      dataPath: this.authPath,
      backupSyncIntervalMs: CONSTANTS.CONFIG.BACKUP_SYNC_INTERVAL,
    })

    return new Client({
      authStrategy,
      puppeteer: {
        headless: true,
        args: [...CONSTANTS.CHROME_ARGS],
      },
    })
  }

  /**
   * Initialize client with timeout
   */
  private async initializeClient(client: InstanceType<typeof Client>, clientId: string): Promise<void> {
    const initPromise = client.initialize()
    await Promise.race([
      initPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new WhatsAppTimeoutError(clientId, 'Initialize')), CONSTANTS.TIMEOUTS.INIT)
      )
    ])
    console.log(`Client ${clientId} initialized`)
  }

  /**
   * Wait for client to be ready with timeout
   */
  private async waitForClientReady(clientId: string): Promise<void> {
    console.log(`⏳ Waiting for client ${clientId} to be ready...`)

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(async () => {
        console.log(`⏰ Client ${clientId} did not become ready within 2 minutes, closing...`)
        this.broadcastStatus(clientId, CONSTANTS.STATUS.TIMEOUT)
        await this.close(clientId)
        reject(new WhatsAppTimeoutError(clientId, 'Ready check'))
      }, CONSTANTS.TIMEOUTS.READY_WAIT)

      const checkReady = async (): Promise<void> => {
        try {
          if (await this.isClientReady(clientId)) {
            clearTimeout(timeout)
            console.log(`✅ Client ${clientId} is ready!`)
            this.broadcastStatus(clientId, CONSTANTS.STATUS.CONNECTED)
            resolve()
          } else {
            setTimeout(checkReady, CONSTANTS.CONFIG.READY_CHECK_INTERVAL)
          }
        } catch (error) {
          clearTimeout(timeout)
          this.broadcastStatus(clientId, CONSTANTS.STATUS.ERROR)
          await this.close(clientId)
          reject(error)
        }
      }

      checkReady()
    })
  }

  /**
   * Setup all event handlers for a client
   */
  private setupEventHandlers(
    client: InstanceType<typeof Client>,
    clientId: string,
    options: { restore: boolean; sessionExists: boolean }
  ): void {
    this.setupQRHandler(client, clientId, options)
    this.setupReadyHandler(client, clientId)
    this.setupAuthFailureHandler(client, clientId)
    this.setupDisconnectHandler(client, clientId)
    this.setupLoadingHandler(client, clientId)
    this.setupSessionHandlers(client, clientId)
  }

  /**
   * Setup QR code event handler
   */
  private setupQRHandler(
    client: InstanceType<typeof Client>,
    clientId: string,
    options: { restore: boolean; sessionExists: boolean }
  ): void {
    client.on('qr', async (qr: string) => {
      try {
        if (options.restore && options.sessionExists) {
          await this.close(clientId)
          console.log('Client closed due to restore and session exists but QR code generated')
        } else {
          console.log(`📱 QR code generated for client: ${clientId}`)
          const qrCodeDataUrl = await QRCodeGenerator.toDataURL(qr)
          this.qrCodes.set(clientId, qrCodeDataUrl)

          // Broadcast QR code
          this.broadcast({
            type: 'qr-code',
            clientId,
            qrCode: qrCodeDataUrl,
            timestamp: new Date().toISOString(),
          })

          // Broadcast status update
          this.broadcastStatus(clientId, CONSTANTS.STATUS.AWAITING_SCAN)
        }
      } catch (error) {
        console.warn(`⚠️ QR generation failed for ${clientId}:`, error)
      }
    })
  }

  /**
   * Setup ready event handler
   */
  private setupReadyHandler(client: InstanceType<typeof Client>, clientId: string): void {
    client.on('ready', () => {
      console.log(`🚀 Client ${clientId} is READY!`)
      this.qrCodes.delete(clientId)
      client.removeAllListeners('qr')
      this.broadcastStatus(clientId, CONSTANTS.STATUS.CONNECTED)
    })
  }

  /**
   * Setup authentication failure handler
   */
  private setupAuthFailureHandler(client: InstanceType<typeof Client>, clientId: string): void {
    client.on('auth_failure', (msg: string) => {
      console.log(`❌ AUTH FAILURE for ${clientId}: ${msg}`)
      this.broadcastStatus(clientId, CONSTANTS.STATUS.AUTH_FAILED)
      this.close(clientId)
    })
  }

  /**
   * Setup disconnect handler
   */
  private setupDisconnectHandler(client: InstanceType<typeof Client>, clientId: string): void {
    client.on('disconnected', (reason: string) => {
      console.log(`🔌 Client ${clientId} disconnected: ${reason}`)
      this.broadcastStatus(clientId, CONSTANTS.STATUS.DISCONNECTED)
      this.close(clientId)
    })
  }

  /**
   * Setup loading screen handler
   */
  private setupLoadingHandler(client: InstanceType<typeof Client>, clientId: string): void {
    client.on('loading_screen', (percent: number, msg: string) => {
      console.log(`⏳ Loading ${clientId}: ${percent}% - ${msg}`)

      // Broadcast loading status
      this.broadcastStatus(clientId, CONSTANTS.STATUS.LOADING)
    })
  }

  /**
   * Setup session-related handlers
   */
  private setupSessionHandlers(client: InstanceType<typeof Client>, clientId: string): void {
    client.on('remote_session_saved', () => {
      console.log(`💾 Remote session saved for ${clientId}`)
    })

    client.on('authenticated', (session: any) => {
      console.log(`🔐 Authenticated successfully for ${clientId}`)
    })
  }

  // ==================== MESSAGING ====================

  /**
   * Send text message to a phone number
   */
  async sendText(clientId: string, phone: string, msg: string): Promise<Message> {
    await this.ensureClientReady(clientId)
    const client = this.clients.get(clientId)!
    const chatId = this.toChatId(phone)

    const message = await client.sendMessage(chatId, msg)
    console.log('Message', message)
    console.log(`💬 Text sent to ${phone} via client ${clientId}`)
    return message
  }

  /**
   * Send file to a phone number
   */
  async sendFile(
    clientId: string,
    phone: string,
    file: Blob,
    filename: string,
    mimeType: string,
    caption?: string
  ): Promise<Message> {
    await this.ensureClientReady(clientId)
    const client = this.clients.get(clientId)!

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    const media = new MessageMedia(mimeType, fileBuffer.toString('base64'), filename)
    const chatId = this.toChatId(phone)
    const message = await client.sendMessage(chatId, media, { caption })
    console.log(`📎 File sent to ${phone} via client ${clientId}: ${filename}`)
    return message
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

  // ==================== CLIENT STATUS ====================

  /**
   * Get client status
   */
  async getStatus(clientId: string): Promise<string> {
    try {
      if (!this.clients.has(clientId)) return CONSTANTS.STATUS.NOT_INITIALIZED

      const client = this.clients.get(clientId)!
      const state = await client.getState()

      if (state === null || state === undefined) {
        return CONSTANTS.STATUS.PAIRING
      }

      return state
    } catch (error) {
      console.error(`Error getting status for client ${clientId}:`, error)
      return CONSTANTS.STATUS.DISCONNECTED
    }
  }

  /**
   * Check if client is ready
   */
  async isClientReady(clientId: string): Promise<boolean> {
    try {
      if (!this.clients.has(clientId)) return false

      const client = this.clients.get(clientId)!
      const state = await client.getState()
      return state === CONSTANTS.STATUS.CONNECTED
    } catch (error) {
      console.error(`Error checking client ${clientId} state:`, error)
      return false
    }
  }

  /**
   * Get all active clients
   */
  getActiveClients(): string[] {
    return Array.from(this.clients.keys())
  }

  /**
   * Get QR code with polling
   */
  async getQRCode(clientId: string, maxWaitTime: number = CONSTANTS.TIMEOUTS.QR_POLL): Promise<string> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      if (!this.clients.has(clientId)) {
        throw new WhatsAppClientError(`Client ${clientId} not found`, clientId)
      }

      try {
        const client = this.clients.get(clientId)!
        const state = await client.getState()
        if (state === CONSTANTS.STATUS.CONNECTED) {
          throw new WhatsAppClientError(`Client ${clientId} is already connected`, clientId)
        }
      } catch (error) {
        // Continue to check for QR code
      }

      if (this.qrCodes.has(clientId)) {
        return this.qrCodes.get(clientId)!
      }

      await this.sleep(CONSTANTS.CONFIG.QR_POLL_INTERVAL)
    }

    throw new WhatsAppClientError(`QR code not generated within ${maxWaitTime}ms`, clientId)
  }

  /**
   * Get QR code directly from storage
   */
  getQRCodeDirect(clientId: string): string | null {
    return this.qrCodes.get(clientId) || null
  }

  // ==================== CLIENT LIFECYCLE ====================

  /**
   * Logout client
   */
  async logout(clientId: string): Promise<void> {
    if (!this.clients.has(clientId)) return

    const state = await this.getStatus(clientId)
    if (state === CONSTANTS.STATUS.CONNECTED) {
      const client = this.clients.get(clientId)!
      await client.logout()
    } else {
      throw new WhatsAppClientError(`Client ${clientId} is not connected`, clientId)
    }
  }

  /**
   * Close client with proper cleanup
   */
  async close(clientId: string): Promise<void> {
    if (!this.clients.has(clientId)) return

    const client = this.clients.get(clientId)!
    console.log(`🔄 Closing client ${clientId}`)

    // Execute cleanup operations in sequence, but continue even if some fail
    try {
      await this.withTimeout(
        () => this.logout(clientId),
        CONSTANTS.TIMEOUTS.CLOSE_OPERATION,
        `Logout ${clientId}`
      )
    } catch (error) {
      console.warn(`⚠️ Logout failed for ${clientId}:`, error)
    }

    try {
      await this.withTimeout(
        () => client.destroy(),
        CONSTANTS.TIMEOUTS.CLOSE_DESTROY,
        `Destroy ${clientId}`
      )
    } catch (error) {
      console.warn(`⚠️ Destroy failed for ${clientId}:`, error)
    }

    try {
      await this.withTimeout(
        () => this.removeSession(clientId),
        CONSTANTS.TIMEOUTS.CLOSE_SESSION,
        `Remove session ${clientId}`
      )
    } catch (error) {
      console.warn(`⚠️ Session removal failed for ${clientId}:`, error)
    }

    // Clean up memory immediately (always run)
    this.clients.delete(clientId)
    this.qrCodes.delete(clientId)
    console.log(`✅ Client ${clientId} removed from memory`)

    console.log(`✅ Client ${clientId} closed successfully`)
  }

  /**
   * Close all clients
   */
  async closeAll(): Promise<void> {
    const clientIds = Array.from(this.clients.keys())
    console.log(`🔄 Closing ${clientIds.length} clients...`)

    const closePromises = clientIds.map(async (clientId) => {
      try {
        await this.close(clientId)
      } catch (error) {
        console.warn(`⚠️ Failed to close client ${clientId}:`, error)
      }
    })

    await this.withTimeout(
      () => Promise.allSettled(closePromises),
      CONSTANTS.TIMEOUTS.CLOSE_ALL,
      'Close all clients'
    )

    console.log(`✅ All clients closed`)
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Remove session from MongoDB store
   */
  async removeSession(clientId: string): Promise<boolean> {
    try {
      if (!this.mongoStore) {
        console.log(`❌ MongoDB store not available for client ${clientId}`)
        return false
      }

      const sessionExists = await this.mongoStore.sessionExists({
        session: this.getSessionName(clientId)
      })

      if (!sessionExists) {
        console.log(`ℹ️ No session found for client ${clientId} in MongoDB`)
        return false
      }

      await this.mongoStore.delete({ session: this.getSessionName(clientId) })
      console.log(`🗑️ Session removed from MongoDB for client ${clientId}`)
      return true
    } catch (error) {
      console.error(`❌ Error removing session from MongoDB for client ${clientId}:`, error)
      return false
    }
  }

  /**
   * Get session name for a client
   */
  getSessionName(clientId: string): string {
    return `RemoteAuth-${clientId}`
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Validate client ID
   */
  private validateClientId(clientId: string): void {
    if (!clientId || typeof clientId !== 'string' || clientId.trim().length === 0) {
      throw new WhatsAppClientError('Client ID must be a non-empty string', clientId)
    }
  }

  /**
   * Ensure client is ready before operations
   */
  private async ensureClientReady(clientId: string): Promise<void> {
    if (!this.clients.has(clientId)) {
      throw new WhatsAppClientError(`Client ${clientId} not found`, clientId)
    }

    if (!(await this.isClientReady(clientId))) {
      throw new WhatsAppNotReadyError(clientId)
    }
  }

  /**
   * Convert phone number to WhatsApp chat ID
   */
  private toChatId(phone: string): string {
    return `${phone.replace(/\D/g, '')}@c.us`
  }

  /**
   * Broadcast status update via WebSocket
   */
  private broadcastStatus(clientId: string, status: string): void {
    this.broadcast({
      type: 'status-update',
      clientId,
      status,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Broadcast message via WebSocket
   */
  private broadcast(message: WebSocketMessage): void {
    webSocketService.broadcast(message)
  }

  /**
   * Handle login errors
   */
  private async handleLoginError(clientId: string, error: any, waitForReady: boolean): Promise<void> {
    if (waitForReady && this.clients.has(clientId)) {
      console.log(`❌ Error during login for ${clientId}, closing client...`)
      this.broadcastStatus(clientId, CONSTANTS.STATUS.ERROR)
      await this.close(clientId)
    }
  }

  /**
   * Execute operation with timeout
   */
  private async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )

      const result = await Promise.race([operation(), timeoutPromise])
      console.log(`✅ ${operationName} completed`)
      return result
    } catch (error) {
      console.warn(`⚠️ ${operationName} failed:`, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

}
