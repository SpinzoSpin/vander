import { logger } from "@/lib/logger"
import { redisConnection } from "@/lib/redis"
import { verifyAndProcessOnchainTransaction } from "@/services/onchain/verify-tx"
import {
  ONCHAIN_TX_QUEUE_NAME,
  OnchainTxJobData,
  syncPendingTransactionsToQueue,
} from "@/services/queues/onchain-queue"
import { Job, Worker } from "bullmq"

export function startOnchainWorker() {
  logger.info(`[BullMQ Worker] Starting onchain transaction watch worker...`)

  const worker = new Worker<OnchainTxJobData>(
    ONCHAIN_TX_QUEUE_NAME,
    async (job: Job<OnchainTxJobData>) => {
      const { transactionId } = job.data
      logger.info(
        { jobId: job.id, transactionId },
        `[BullMQ Worker] Checking onchain verification for tx #${transactionId}...`
      )

      const result = await verifyAndProcessOnchainTransaction(transactionId)

      if (result.alreadyProcessed) {
        logger.info(
          { transactionId },
          `[BullMQ Worker] Tx #${transactionId} already marked as Crypto Arrived / Complete.`
        )
        return result
      }

      if (!result.verified) {
        logger.warn(
          { transactionId, reason: result.reason },
          `[BullMQ Worker] Tx #${transactionId} not yet verified onchain. Retrying...`
        )
        throw new Error(
          `Tx #${transactionId} not verified onchain: ${result.reason}`
        )
      }

      logger.info(
        { transactionId },
        `[BullMQ Worker] Successfully verified and updated tx #${transactionId} to Crypto Arrived!`
      )
      return result
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  )

  worker.on("completed", (job) => {
    logger.info(
      { jobId: job.id },
      `[BullMQ Worker] Job ${job.id} completed successfully.`
    )
  })

  worker.on("failed", (job, err) => {
    logger.warn(
      { jobId: job?.id, error: err.message },
      `[BullMQ Worker] Job ${job?.id} failed attempt.`
    )
  })

  worker.on("error", (err) => {
    logger.error({ err }, `[BullMQ Worker] Worker error encountered.`)
  })

  // Periodically poll DB for any unqueued pending/confirmed transactions
  const pollIntervalMs = 20000 // Every 20 seconds
  const pollTimer = setInterval(async () => {
    try {
      const count = await syncPendingTransactionsToQueue()
      if (count > 0) {
        logger.info(
          `[BullMQ Worker] Synced ${count} pending transaction(s) to queue.`
        )
      }
    } catch (e) {
      logger.error({ e }, `[BullMQ Worker] Error during periodic queue sync.`)
    }
  }, pollIntervalMs)

  // Immediate sync on startup
  syncPendingTransactionsToQueue()

  // Graceful shutdown listeners
  const shutdown = async () => {
    logger.info(`[BullMQ Worker] Stopping worker...`)
    clearInterval(pollTimer)
    await worker.close()
    process.exit(0)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

  return worker
}

// If executed directly via CLI
if (
  import.meta.url === `file://${process.argv[1]}` ||
  require.main === module
) {
  startOnchainWorker()
}
