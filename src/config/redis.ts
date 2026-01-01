import Redis from 'ioredis'
import { ENV } from './env'

export const redis = new Redis(ENV.REDIS_URL)

redis.once('ready', () => {
  console.log('Redis connected successfully.')
})

redis.on('error', (error) => {
  console.error('Redis connection failed.', error)
})