import { waitForConnected, getClientsFromRedis } from '../util'
import { WhatsAppClient } from './WhatsAppClient'
import { logger } from '../config/logger'

export class WhatsAppManager {
  private clients = new Map<string, WhatsAppClient>()

  async login(clientId: string, phone: string) {
    if (this.clients.has(clientId)) return
    const client = new WhatsAppClient(clientId, phone)
    await client.start()
    this.clients.set(clientId, client)
  }

  get(clientId: string) {
    return this.clients.get(clientId)
  }

  getActiveClients(): string[] {
    return Array.from(this.clients.keys())
  }

  async isClientReady(clientId: string): Promise<boolean> {
    const client = this.clients.get(clientId)
    return client ? client.getState().status === 'connected' : false
  }

  /**
   * Restart all clients that have auth state in Redis
   */
  async restartAllClients() {
    try {
      const clients = await getClientsFromRedis()
      
      if (clients.length === 0) {
        logger.info('No clients found in Redis to restart')
        return
      }

      logger.info({ count: clients.length }, 'Restarting clients from Redis')

      // Restart each client
      for (const { clientId, phone } of clients) {
        try {
          // Create and start client
          const client = new WhatsAppClient(clientId, phone)
          await client.start()
          await waitForConnected(client)
          this.clients.set(clientId, client)
          
          logger.info({ clientId, phone }, 'Client restarted from Redis')
        } catch (error) {
          logger.error({ clientId, error }, 'Failed to restart client')
        }
      }

      logger.info({ restarted: this.clients.size }, 'Finished restarting clients')
    } catch (error) {
      logger.error({ error }, 'Failed to restart clients from Redis')
    }
  }

  async logout(clientId: string) {
    const client = this.clients.get(clientId)
    if (!client) return
    await client.logout()
    this.clients.delete(clientId)
  }
}

export const waManager = new WhatsAppManager()
