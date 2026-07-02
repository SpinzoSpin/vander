import { Queue } from "bullmq"
import { redisConnection } from "@/lib/redis"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export const ONCHAIN_TX_QUEUE_NAME = "onchain-tx-watch-queue"

export interface OnchainTxJobData {
  transactionId: number
}

const WATCH_INTERVAL_MS = 10000 // Fixed 10s interval between onchain checks

export const onchainTxQueue = new Queue<OnchainTxJobData>(ONCHAIN_TX_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    backoff: {
      type: "fixed",
      delay: WATCH_INTERVAL_MS,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

/**
 * Enqueue a specific transaction for onchain verification watching.
 * Retries at a fixed interval until the transaction's dedupe_expires_at (set at
 * create-exchange time) is reached, so the watch window always matches what the
 * client was told the quote/deposit request is valid for.
 */
export async function enqueueOnchainTxWatch(transactionId: number, delayMs: number = 0) {
  const jobId = `tx-watch-${transactionId}`
  try {
    const tx = await prisma.transactions.findUnique({
      where: { id: transactionId },
      select: { dedupe_expires_at: true },
    })

    const remainingMs = tx?.dedupe_expires_at
      ? tx.dedupe_expires_at.getTime() - Date.now()
      : WATCH_INTERVAL_MS
    const attempts = Math.max(1, Math.ceil(remainingMs / WATCH_INTERVAL_MS))

    await onchainTxQueue.add(
      "verify-onchain-transfer",
      { transactionId },
      {
        jobId,
        delay: delayMs,
        attempts,
      }
    )
    logger.info({ transactionId, jobId, attempts }, `Enqueued transaction #${transactionId} to BullMQ watch queue`)
  } catch (error) {
    logger.error({ error, transactionId }, `Failed to enqueue transaction #${transactionId} to BullMQ`)
  }
}

/**
 * Scan database for pending/confirmed crypto_to_fiat transactions and add them to queue if missing.
 */
export async function syncPendingTransactionsToQueue() {
  try {
    const pendingTxs = await prisma.transactions.findMany({
      where: {
        type: "crypto_to_fiat",
        status: {
          in: ["pending", "confirmed"],
        },
      },
      select: { id: true, dedupe_expires_at: true },
    })

    let queued = 0
    for (const tx of pendingTxs) {
      // Skip transactions whose watch window has already lapsed
      if (tx.dedupe_expires_at && tx.dedupe_expires_at.getTime() <= Date.now()) {
        continue
      }
      await enqueueOnchainTxWatch(tx.id)
      queued++
    }

    return queued
  } catch (error) {
    logger.error({ error }, "Error syncing pending transactions to BullMQ queue")
    return 0
  }
}
