import { BadRequestError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import crypto from "crypto"

const DEDUPE_TTL_SECONDS = 15 * 60 // 15 minutes

export function dedupeKey(
  userId: string,
  type: string,
  networkId: number,
  amount: number
) {
  return `create-exchange:dedupe:${userId}:${type}:${networkId}:${amount.toFixed(6)}`
}

// Rebuilds the API response purely from a previously stored row, so dedupe survives a Redis restart/flush.
async function buildResponseFromExistingTransaction(
  transaction: NonNullable<
    Awaited<ReturnType<typeof prisma.transactions.findFirst>>
  >
) {
  const [network, treasury] = await Promise.all([
    prisma.networks.findUnique({ where: { id: transaction.network_id } }),
    prisma.treasury.findUnique({ where: { id: transaction.treasury_id } }),
  ])

  const amountPhp = Number(transaction.amount_php)
  const amountUsdt = Number(transaction.amount_usdt)
  const appliedRate = Number(transaction.applied_rate_snapshot)
  const referenceRate = Number(transaction.reference_rate_snapshot)
  const rateUsed: "live" | "reference" =
    appliedRate === referenceRate ? "reference" : "live"
  const bankDetails = transaction.bank_details
    ? JSON.parse(transaction.bank_details)
    : null

  return {
    success: true,
    rateUsed,
    exchangeDetails: {
      userSends: {
        amount: transaction.type === "fiat_to_crypto" ? amountPhp : amountUsdt,
        currency: transaction.type === "fiat_to_crypto" ? "PHP" : "USDT",
      },
      userReceives: {
        amount: transaction.type === "fiat_to_crypto" ? amountUsdt : amountPhp,
        currency: transaction.type === "fiat_to_crypto" ? "USDT" : "PHP",
      },
      appliedRate:
        transaction.type === "fiat_to_crypto"
          ? `1 PHP = ${appliedRate} USDT`
          : `1 USDT = ${appliedRate} PHP`,
      bankDetails,
      depositAddress:
        transaction.type === "crypto_to_fiat"
          ? treasury?.wallet_address
          : undefined,
    },
    transaction: {
      id: transaction.id,
      orderId: transaction.order_id,
      type: transaction.type,
      amountPhp,
      amountUsdt,
      network: network?.symbol,
      targetAddress: transaction.target_address,
      status: transaction.status,
      createdAt: transaction.created_at,
    },
  }
}

export async function createExchangeTransaction({
  userId,
  type,
  amount,
  networkId,
  targetAddress,
}: {
  userId: string
  type: "fiat_to_crypto" | "crypto_to_fiat"
  amount: number
  networkId: number
  targetAddress?: string
}) {
  // 0. Expiration-based Deduplication: same client + same amount within window returns the first result.
  // Redis is a speed cache; Postgres is the source of truth so the dedupe survives a Redis restart.
  const key = dedupeKey(userId, type, networkId, amount)
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }

  const existing = await prisma.transactions.findFirst({
    where: {
      created_by_user_id: userId,
      type,
      network_id: networkId,
      dedupe_expires_at: { gte: new Date() },
      ...(type === "fiat_to_crypto"
        ? { amount_php: amount }
        : { amount_usdt: amount }),
    },
    orderBy: { created_at: "desc" },
  })
  if (existing) {
    const response = await buildResponseFromExistingTransaction(existing)
    const remainingTtl = Math.floor(
      (existing.dedupe_expires_at!.getTime() - Date.now()) / 1000
    )
    if (remainingTtl > 0) {
      await redis.set(key, JSON.stringify(response), "EX", remainingTtl)
    }
    return response
  }

  // 1. Network Validation
  const network = await prisma.networks.findUnique({ where: { id: networkId } })
  if (!network || !network.is_active) {
    throw new BadRequestError("Network is invalid or currently inactive")
  }

  // 2. Treasury Auto-Selection
  const treasury = await prisma.treasury.findFirst({
    where: { network_id: networkId },
    orderBy: { current_balance: "desc" },
  })
  if (!treasury) {
    throw new BadRequestError(
      `No treasury wallet available for network: ${network.name}`
    )
  }

  // 3. Exchange Rate Fetching
  const exchangeRate = await prisma.exchange_rates.findFirst({
    orderBy: { updated_at: "desc" },
  })
  if (!exchangeRate) {
    throw new BadRequestError("No exchange rate available")
  }

  // 4. Data Calculation
  let amountPhp: number
  let amountUsdt: number
  let profit: number = 0
  let appliedRate: number
  let referenceRate: number
  let rateUsed: "live" | "reference" = "live"

  if (type === "fiat_to_crypto") {
    amountPhp = amount
    referenceRate = Number(exchangeRate.php_to_usdt_reference_rate)

    if (exchangeRate.is_active) {
      appliedRate = Number(exchangeRate.php_to_usdt_rate)
      rateUsed = "live"
    } else {
      appliedRate = referenceRate
      rateUsed = "reference"
    }

    amountUsdt = amountPhp * appliedRate

    // Profit in USDT
    // If referenceRate is market price, profit = what platform would get - what user gets
    const marketUsdt = amountPhp * referenceRate
    profit = marketUsdt - amountUsdt
  } else {
    amountUsdt = amount
    referenceRate = Number(exchangeRate.usdt_to_php_reference_rate)

    if (exchangeRate.is_active) {
      appliedRate = Number(exchangeRate.usdt_to_php_rate)
      rateUsed = "live"
    } else {
      appliedRate = referenceRate
      rateUsed = "reference"
    }

    amountPhp = amountUsdt * appliedRate

    // Profit in USDT
    // Example: user sells 100 USDT. Market pays 55 PHP/USDT. Platform pays 53 PHP/USDT.
    // Platform keeps 200 PHP difference. In USDT, that is 200 / 55
    const marketPhp = amountUsdt * referenceRate
    const profitPhp = marketPhp - amountPhp
    profit = profitPhp / referenceRate
  }

  // Rounding
  amountPhp = Number(amountPhp.toFixed(2))
  amountUsdt = Number(amountUsdt.toFixed(6))
  profit = Number(profit.toFixed(6))

  // 5. Environment/Bank Details Extraction
  let bankDetails = null
  if (type === "fiat_to_crypto") {
    bankDetails = {
      bankName: process.env.BANK_NAME_EXCHANGER || "",
      accountName: process.env.BANK_ACCOUNT_NAME_EXCHANGER || "",
      accountNumber: process.env.BANK_ACCOUNT_NUMBER_EXCHANGER || "",
    }
  } else {
    bankDetails = {
      bankName: process.env.BANK_NAME_LOTTO || "",
      accountName: process.env.BANK_ACCOUNT_NAME_LOTTO || "",
      accountNumber: process.env.BANK_ACCOUNT_NUMBER_LOTTO || "",
    }
  }

  // 6. Transaction Creation
  const orderId = crypto.randomUUID()
  const transaction = await prisma.transactions.create({
    data: {
      type: type,
      amount_php: amountPhp,
      amount_usdt: amountUsdt,
      network_id: networkId,
      treasury_id: treasury.id,
      target_address: type === "fiat_to_crypto" ? targetAddress : null,
      status: "pending",
      profit: profit,
      amount_usdt_original: type === "crypto_to_fiat" ? amountUsdt : null,
      exchange_rate_id: exchangeRate.id,
      order_id: orderId,
      bank_details: JSON.stringify(bankDetails),
      created_by_user_id: userId,
      dedupe_expires_at: new Date(Date.now() + DEDUPE_TTL_SECONDS * 1000),

      // Snapshots
      usdt_to_php_reference_rate_snapshot:
        exchangeRate.usdt_to_php_reference_rate,
      usdt_to_php_rate_snapshot: exchangeRate.usdt_to_php_rate,
      php_to_usdt_reference_rate_snapshot:
        exchangeRate.php_to_usdt_reference_rate,
      php_to_usdt_rate_snapshot: exchangeRate.php_to_usdt_rate,
      rate_snapshot: appliedRate,
      reference_rate_snapshot: referenceRate,
      applied_rate_snapshot: appliedRate,
    },
  })

  // Trigger Telegram notification in the background
  import("@/services/telegram/bot")
    .then(({ sendTelegramNotification }) => {
      sendTelegramNotification(transaction.id)
    })
    .catch((err) => {
      console.error("Failed to load Telegram bot:", err)
    })

  // Enqueue transaction in BullMQ for onchain verification.
  // Only crypto_to_fiat needs watching (client sends USDC in, we verify it arrived).
  // fiat_to_crypto has no incoming onchain transfer to watch for.
  if (type === "crypto_to_fiat") {
    import("@/services/queues/onchain-queue")
      .then(({ enqueueOnchainTxWatch }) => {
        enqueueOnchainTxWatch(transaction.id)
      })
      .catch((err) => {
        console.error("Failed to enqueue transaction in BullMQ:", err)
      })
  }

  // 7. API Response Construction
  const response = {
    success: true,
    rateUsed,
    valinUntilInMs: transaction.dedupe_expires_at?.getTime(),
    validUntil: transaction.dedupe_expires_at,
    exchangeDetails: {
      userSends: {
        amount: type === "fiat_to_crypto" ? amountPhp : amountUsdt,
        currency: type === "fiat_to_crypto" ? "PHP" : "USDT",
      },
      userReceives: {
        amount: type === "fiat_to_crypto" ? amountUsdt : amountPhp,
        currency: type === "fiat_to_crypto" ? "USDT" : "PHP",
      },
      appliedRate:
        type === "fiat_to_crypto"
          ? `1 PHP = ${appliedRate} USDT`
          : `1 USDT = ${appliedRate} PHP`,
      bankDetails: bankDetails,
      depositAddress:
        type === "crypto_to_fiat" ? treasury.wallet_address : undefined,
    },
    transaction: {
      id: transaction.id,
      orderId: transaction.order_id,
      type: transaction.type,
      amountPhp: Number(transaction.amount_php),
      amountUsdt: Number(transaction.amount_usdt),
      network: network.symbol,
      targetAddress: transaction.target_address,
      status: transaction.status,
      createdAt: transaction.created_at,
    },
  }

  await redis.set(key, JSON.stringify(response), "EX", DEDUPE_TTL_SECONDS)

  return response
}
