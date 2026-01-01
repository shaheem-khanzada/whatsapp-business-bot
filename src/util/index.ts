import { WhatsAppClient } from "../whatsapp/WhatsAppClient"
import { stateEmitter } from "../ws/stateEmitter"
import { redis } from "../config/redis"
import { BufferJSON } from "baileys/lib/Utils/generics"

export async function waitForConnected(
    conn: WhatsAppClient,
    timeoutMs = 60_000
  ) {
    const event = `wa:${conn.clientId}`
    console.log("waitForConnected", conn.getState().status)
    if (conn.getState().status === 'connected') return
  
    return new Promise<boolean>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup()
        reject(new Error('Connection timeout'))
      }, timeoutMs)
  
      const handler = (event: any) => {
        if (event.type === 'connected') {
          cleanup()
          resolve(true)
        }
        if (event.type === 'logged_out') {
          cleanup()
          reject(new Error('Logged out'))
        }
      }
  
      const cleanup = () => {
        clearTimeout(timer)
        stateEmitter.off(event, handler)
      }
  
      stateEmitter.on(event, handler)
    })
  }

export interface ClientInfo {
  clientId: string
  phone: string
}

/**
 * Get all clients from Redis with their phone numbers
 * @returns Array of objects containing clientId and phone number
 */
export async function getClientsFromRedis(): Promise<ClientInfo[]> {
  // Get all clientIds from Redis by finding all creds keys
  const pattern = 'wa:*:creds'
  const keys = await redis.keys(pattern)
  
  if (keys.length === 0) {
    return []
  }

  // Extract clientIds from keys (format: wa:{clientId}:creds)
  const clientIds = keys
    .map(key => {
      const match = key.match(/^wa:(.+):creds$/)
      return match ? match[1] : null
    })
    .filter((id): id is string => id !== null)

  // Get phone numbers for each client
  const clients: ClientInfo[] = []
  
  for (const clientId of clientIds) {
    try {
      // Try to get phone from creds.me.id or use a placeholder
      const credsKey = `wa:${clientId}:creds`
      const credsData = await redis.get(credsKey)
      
      let phone = '0000000000' // Placeholder, will be used only if creds not registered
      
      if (credsData) {
        const creds = JSON.parse(credsData, BufferJSON.reviver)
        // Try to extract phone from creds.me.id
        // Format can be: "phone:deviceId@s.whatsapp.net" or "phone@s.whatsapp.net"
        if (creds?.me?.id) {
          // Match format: "923161137297:91@s.whatsapp.net" or "923161137297@s.whatsapp.net"
          const phoneMatch = creds.me.id.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)
          if (phoneMatch) {
            phone = phoneMatch[1]
          }
        }
      }

      clients.push({ clientId, phone })
    } catch (error) {
      // Skip clients with errors, but log them
      console.error(`Failed to get phone for client ${clientId}:`, error)
    }
  }

  return clients
}
  