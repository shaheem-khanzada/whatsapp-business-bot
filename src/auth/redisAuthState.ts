import {
    AuthenticationCreds,
    SignalKeyStore,
    initAuthCreds,
  } from 'baileys'
  import { BufferJSON } from 'baileys/lib/Utils/generics'
  import { proto } from 'baileys'
  import { redis } from '../config/redis'
  
  export const useRedisAuthState = async (clientId: string) => {
    const credsKey = `wa:${clientId}:creds`
  
    const storedCreds = await redis.get(credsKey)
    const creds: AuthenticationCreds = storedCreds
      ? JSON.parse(storedCreds, BufferJSON.reviver)
      : initAuthCreds()
  
    const saveCreds = async () => {
      await redis.set(credsKey, JSON.stringify(creds, BufferJSON.replacer))
    }
  
    const keys: SignalKeyStore = {
      get: async (type, ids) => {
        const data: any = {}
        for (const id of ids) {
          const key = `wa:${clientId}:keys:${type}:${id}`
          const val = await redis.get(key)
          if (val) {
            let value = JSON.parse(val, BufferJSON.reviver)
            // Handle app-state-sync-key which needs to be converted from object to protobuf
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value)
            }
            data[id] = value
          }
        }
        return data
      },
      set: async (data) => {
        const pipeline = redis.pipeline()
        const dataSet = data as any
        for (const type in dataSet) {
          for (const id in dataSet[type]) {
            const key = `wa:${clientId}:keys:${type}:${id}`
            const value = dataSet[type][id]
            pipeline.set(key, JSON.stringify(value, BufferJSON.replacer))
          }
        }
        await pipeline.exec()
      },
    }
  
    return { state: { creds, keys }, saveCreds }
  }
  