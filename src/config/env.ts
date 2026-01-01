
import dotenv from 'dotenv'
dotenv.config()

export const ENV = {
  PORT: process.env.PORT || '3000',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
}
