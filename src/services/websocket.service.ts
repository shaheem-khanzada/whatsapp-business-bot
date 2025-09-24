import { WebSocketServer } from 'ws'

export class WebSocketService {
  private wss: WebSocketServer | null = null
  private connectedClients: Set<any> = new Set()

  /**
   * Initialize WebSocket server
   */
  initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    })

    this.setupEventHandlers()
    console.log('🔌 WebSocket service initialized')
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers() {
    if (!this.wss) return

    this.wss.on('connection', (ws, req) => {
      console.log(`🔌 WebSocket client connected from ${req.socket.remoteAddress}`)
      this.connectedClients.add(ws)
      
      ws.on('close', () => {
        console.log(`🔌 WebSocket client disconnected`)
        this.connectedClients.delete(ws)
      })
      
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error)
        this.connectedClients.delete(ws)
      })
    })
  }


  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size
  }

  /**
   * Generic broadcast method for any message type
   */
  broadcast(message: any) {
    console.log('broadcast>>>????<<<>>>>', message)
    console.log('connectedClients size', this.connectedClients.size)
    console.log('connectedClients', this.connectedClients)
    if (this.connectedClients.size === 0) {
      return
    }

    const messageStr = JSON.stringify(message)
    let sentCount = 0

    this.connectedClients.forEach((ws) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        try {
          ws.send(messageStr)
          sentCount++
        } catch (error) {
          console.error(`❌ Error sending message via WebSocket:`, error)
          this.connectedClients.delete(ws) // Remove failed connection
        }
      } else {
        this.connectedClients.delete(ws) // Remove closed connection
      }
    })

    if (sentCount > 0) {
      console.log(`📡 Message sent to ${sentCount} WebSocket client(s)`)
    }
  }

  /**
   * Check if WebSocket server is initialized
   */
  isInitialized(): boolean {
    return this.wss !== null
  }
}
