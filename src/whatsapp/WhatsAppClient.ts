import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  ConnectionState,
  WASocket,
  Contact
} from 'baileys'
import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { useRedisAuthState } from '../auth/redisAuthState'
import { eventBus } from '../ws/eventBus'
import { logger } from '../config/logger'
import { stateEmitter } from '../ws/stateEmitter'
import { redis } from '../config/redis'
import { waitForConnected } from '../util'

export type WAStatus =
  | 'idle'
  | 'starting'
  | 'pairing_code'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'restarting'
  | 'logged_out'
  | 'error'

type StatusExtra = {
  idle?: never
  starting?: never
  pairing_code?: { code: string; timestamp?: string }
  connecting?: never
  connected?: { user: Contact | undefined }
  disconnected?: never
  restarting?: never
  logged_out?: never
  error?: { reason?: string; message?: string }
}


export class WhatsAppClient {
  readonly clientId: string
  readonly phone: string

  private sock: WASocket | null = null
  private status: WAStatus = 'idle'
  private pairingCode?: string

  constructor(clientId: string, phone: string) {
    this.clientId = clientId
    this.phone = phone
  }

  public getState() {
    return {
      status: this.status,
      user: this.sock?.user,
      pairingCode: this.pairingCode,
      phone: this.phone,
      clientId: this.clientId,
    }
  }

  public async start() {
    this.setStatus('starting')
    this.cleanSocket()

    const { state, saveCreds } = await useRedisAuthState(this.clientId)
    const { version } = await fetchLatestBaileysVersion()

    this.sock = makeWASocket({
      version,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      // logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys),
      },
    })

    this.sock.ev.on('creds.update', saveCreds)
    this.sock.ev.on('connection.update', this.handleConnectionUpdate)
  }

  private handleConnectionUpdate = async (u: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = u

    if (qr && this.sock && !this.pairingCode) {
      // this.pairingCode = await this.sock.requestPairingCode(
      //   this.phone.replace(/\D/g, '')
      // )

      // this.setStatus('pairing_code', { code: this.pairingCode })
      const qrCode = await QRCode.toDataURL(qr)
      this.setStatus('pairing_code', { code: qrCode, timestamp: new Date().toISOString() })
    }

    if (connection === 'connecting') {
      this.setStatus('connecting')
    }

    if (connection === 'open' && this.sock) {
      this.setStatus('connected', { user: this.sock.user })
      this.pairingCode = undefined
    }

    if (connection === 'close') {
      await this.handleDisconnect(lastDisconnect?.error)
    }
  }

  public async handleDisconnect(error?: Boom | Error | undefined): Promise<boolean> {
    if (!error) return false

    const statusCode = (error as Boom)?.output?.statusCode

    logger.warn({ statusCode }, 'WhatsApp disconnected')

    switch (statusCode) {
      case DisconnectReason.loggedOut:
      case DisconnectReason.badSession:
        this.setStatus('error', { reason: 'badSession', message: 'Session corrupted, please re-authenticate' })
        await this.clearAuthState()
        return false

      case DisconnectReason.restartRequired:
      case DisconnectReason.connectionClosed:
      case DisconnectReason.connectionLost:
      case DisconnectReason.timedOut:
        return await this.reconnect()

      default:
        logger.error({ statusCode }, 'Unknown disconnect reason')
        // Attempt to reconnect for unknown reasons
        return await this.reconnect()
    }
  }

  private async clearAuthState() {
    try {
      const pattern = `wa:${this.clientId}:*`
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
        logger.info({ clientId: this.clientId, keysCleared: keys.length }, 'Auth state cleared')
      }
      this.cleanSocket()
    } catch (error) {
      logger.error({ clientId: this.clientId, error }, 'Failed to clear auth state')
    }
  }

  private async reconnect() {
    console.log("reconnecting using reconnect function")
    if (!this.sock) throw new Error(`Client ${this.clientId} not found`)
    await this.start()
    await waitForConnected(this)
    return this.getState().status === 'connected'
  }

  private cleanSocket() {
    if (this.sock) {
      this.sock.ev.removeAllListeners('creds.update')
      this.sock.ev.removeAllListeners('connection.update')
      this.sock = null
    }
  }

  private setStatus<T extends WAStatus>(type: T, extra?: StatusExtra[T]) {
    this.status = type

    stateEmitter.emit(`wa:${this.clientId}`, {
      type,
      ...extra,
    })

    // still notify frontend
    eventBus.emit(this.clientId, {
      type,
      ...extra,
    })
  }

  async sendFile(jid: string, buffer: Buffer, name: string, mime: string, caption?: string) {
    if (this.status !== 'connected' || !this.sock) {
      throw new Error('WhatsApp not connected')
    }

    return this.sock.sendMessage(jid, {
      document: buffer,
      fileName: name,
      mimetype: mime,
      ...(caption && { caption }),
    })
  }

  async sendText(jid: string, text: string) {
    if (this.status !== 'connected' || !this.sock) {
      throw new Error('WhatsApp not connected')
    }

    return this.sock.sendMessage(jid, {
      text: text,
    })
  }

  async logout() {
    if (!this.sock) return
    await this.sock.logout()
    this.setStatus('logged_out')
  }
}

