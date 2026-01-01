import { WebSocketServer, WebSocket } from 'ws'

type ClientSocket = {
  ws: WebSocket
  clientId: string
}

class EventBus {
  private clients = new Set<ClientSocket>()

  attach(server: any) {
    const wss = new WebSocketServer({ server })

    wss.on('connection', (ws, req) => {
      const params = new URL(req.url!, 'http://localhost').searchParams
      const clientId = params.get('clientId')

      if (!clientId) {
        ws.close()
        return
      }

      const client = { ws, clientId }
      this.clients.add(client)

      ws.on('close', () => {
        this.clients.delete(client)
      })
    })
  }

  emit(clientId: string, payload: any) {
    for (const c of this.clients) {
      if (c.clientId === clientId && c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(JSON.stringify(payload))
      }
    }
  }
}

export const eventBus = new EventBus()
