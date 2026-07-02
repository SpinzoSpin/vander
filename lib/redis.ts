import { ConnectionOptions } from "bullmq"
import Redis from "ioredis"

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ for workers
}

export const redis = new Redis({
  host: redisConnection.host,
  port: redisConnection.port,
  password: redisConnection.password,
})
