import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { sendTelegramNotification } from "@/services/telegram/bot"
import { dedupeKey } from "@/services/transactions/create-exchange"

interface VerificationResult {
  verified: boolean
  alreadyProcessed?: boolean
  reason?: string
  txHash?: string
}

const ERC20_TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

/**
 * Parses ERC20 log.data (uint256 hex string) into a human readable decimal number.
 */
function parseErc20TransferAmount(dataHex: string, decimals: number): number {
  try {
    if (!dataHex || dataHex === "0x") return 0
    const rawValue = BigInt(dataHex)
    const dec = decimals || 6
    const divisor = BigInt(10) ** BigInt(dec)
    const integerPart = rawValue / divisor
    const fractionalPart = rawValue % divisor
    const fractionalStr = fractionalPart.toString().padStart(dec, "0")
    return Number(`${integerPart}.${fractionalStr}`)
  } catch (e) {
    return 0
  }
}

export async function verifyAndProcessOnchainTransaction(
  transactionId: number
): Promise<VerificationResult> {
  try {
    const t = await prisma.transactions.findUnique({
      where: { id: transactionId },
    })

    if (!t) {
      return {
        verified: false,
        reason: `Transaction #${transactionId} not found`,
      }
    }

    // Skip if transaction is already marked as crypto_arrival or complete
    if (t.status === "crypto_arrival" || t.status === "complete") {
      return { verified: true, alreadyProcessed: true }
    }

    const treasury = await prisma.treasury.findUnique({
      where: { id: t.treasury_id },
      include: { network: true },
    })

    if (!treasury || !treasury.network) {
      return {
        verified: false,
        reason: `Treasury or Network not found for transaction #${transactionId}`,
      }
    }

    const network = treasury.network
    const walletAddress = treasury.wallet_address
    const rpcUrl = network.rpc_url
    const usdtContractAddress = network.usdt_contract_address
    const usdtDecimals = Number(network.usdt_decimals || 6)
    const expectedAmount = Number(t.amount_usdt || 0)
    const txHash = t.tx_hash?.trim()
    let detectedTxHash: string | undefined = txHash || undefined

    let isVerifiedOnchain = false

    // 1. Verification when tx_hash is attached to the transaction
    if (txHash && txHash !== "" && txHash !== "-") {
      // Duplication Check: Prevent reusing tx_hash if claimed by another transaction
      const existingUsedTx = await prisma.transactions.findFirst({
        where: {
          tx_hash: txHash,
          NOT: { id: transactionId },
          status: { in: ["crypto_arrival", "complete", "processing"] },
        },
      })

      if (existingUsedTx) {
        return {
          verified: false,
          reason: `Transaction hash "${txHash}" is already claimed by transaction #${existingUsedTx.id}`,
        }
      }

      isVerifiedOnchain = await verifyTxHashOnchain({
        rpcUrl,
        txHash,
        walletAddress,
        usdtContractAddress,
        usdtDecimals,
        expectedAmount,
        networkCategory: network.network_category,
        networkSymbol: network.symbol,
      })
    } else {
      // 2. Search onchain logs for an unclaimed incoming transfer matching expectedAmount
      const unclaimedHash = await findUnclaimedOnchainTransferHash({
        rpcUrl,
        walletAddress,
        usdtContractAddress,
        usdtDecimals,
        expectedAmount,
        networkCategory: network.network_category,
        networkSymbol: network.symbol,
      })

      if (unclaimedHash) {
        detectedTxHash = unclaimedHash
        isVerifiedOnchain = true
      }
    }

    if (!isVerifiedOnchain) {
      return {
        verified: false,
        reason: `Onchain transfer of ${expectedAmount} USDT to ${walletAddress} on ${network.name} is pending or not yet verified`,
      }
    }

    // Prepare updated notes
    const verificationNote = "onchain verification status is Verified"
    let updatedNotes = t.notes
    if (!updatedNotes || updatedNotes.trim() === "") {
      updatedNotes = verificationNote
    } else if (!updatedNotes.includes(verificationNote)) {
      updatedNotes = `${updatedNotes}\n${verificationNote}`
    }

    // Update Transaction in Database to crypto_arrival
    await prisma.transactions.update({
      where: { id: transactionId },
      data: {
        status: "crypto_arrival",
        notes: updatedNotes,
        ...(detectedTxHash && !t.tx_hash ? { tx_hash: detectedTxHash } : {}),
        updated_at: new Date(),
        // Clear the dedupe window so a resend of the same amount creates a fresh
        // transaction instead of matching this already-completed one.
        dedupe_expires_at: null,
      },
    })

    logger.info(
      {
        transactionId,
        status: "crypto_arrival",
        notes: updatedNotes,
        txHash: detectedTxHash,
        expectedAmount,
      },
      `Transaction #${transactionId} verified onchain with matching amount ${expectedAmount} USDT and marked as Crypto Arrived.`
    )

    // Release the dedupe slot early so the same client can immediately submit a fresh
    // request for the same amount instead of waiting out the rest of the 15-minute window.
    if (t.created_by_user_id) {
      const key = dedupeKey(
        t.created_by_user_id,
        t.type,
        t.network_id,
        Number(t.type === "fiat_to_crypto" ? t.amount_php : t.amount_usdt)
      )
      redis.del(key).catch((err) => {
        logger.error(
          { err, transactionId, key },
          `Failed to release dedupe key for transaction #${transactionId}`
        )
      })
    }

    // Re-send Telegram notification
    try {
      await sendTelegramNotification(transactionId)
    } catch (teleErr) {
      logger.error(
        { teleErr },
        `Failed to re-send Telegram notification for transaction #${transactionId}`
      )
    }

    return {
      verified: true,
      txHash: detectedTxHash,
    }
  } catch (error: any) {
    logger.error(
      { error, transactionId },
      `Error verifying onchain transaction #${transactionId}`
    )
    return {
      verified: false,
      reason: error?.message || "Unknown verification error",
    }
  }
}

async function verifyTxHashOnchain({
  rpcUrl,
  txHash,
  walletAddress,
  usdtContractAddress,
  usdtDecimals,
  expectedAmount,
  networkCategory,
  networkSymbol,
}: {
  rpcUrl: string
  txHash: string
  walletAddress: string
  usdtContractAddress: string
  usdtDecimals: number
  expectedAmount: number
  networkCategory: string
  networkSymbol: string
}): Promise<boolean> {
  const category = networkCategory.toLowerCase()
  const symbol = networkSymbol.toLowerCase()

  try {
    // Solana (SVM)
    if (category === "svm" || symbol === "solana") {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSignatureStatuses",
          params: [[txHash], { searchTransactionHistory: true }],
        }),
      })

      if (!res.ok) return false
      const json = await res.json()
      const status = json.result?.value?.[0]
      return Boolean(
        status &&
        status.err === null &&
        (status.confirmationStatus === "confirmed" ||
          status.confirmationStatus === "finalized")
      )
    }

    // EVM Networks
    const cleanAddress = walletAddress.startsWith("0x")
      ? walletAddress.slice(2).toLowerCase()
      : walletAddress.toLowerCase()

    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [txHash],
      }),
    })

    if (!res.ok) return false
    const json = await res.json()
    const receipt = json.result
    if (!receipt || receipt.status !== "0x1") return false

    // Check logs for transfer event to treasury address with matching amount
    if (Array.isArray(receipt.logs)) {
      const hasMatchingTransfer = receipt.logs.some((log: any) => {
        const topics = log.topics || []
        if (topics.length < 3) return false
        const eventTopic = topics[0]?.toLowerCase()
        const toTopic = topics[2]?.toLowerCase()

        const isTransfer = eventTopic === ERC20_TRANSFER_TOPIC
        const isToTreasury = toTopic?.endsWith(cleanAddress)

        if (!isTransfer || !isToTreasury) return false

        // Amount verification
        if (expectedAmount > 0) {
          const transferredAmount = parseErc20TransferAmount(
            log.data,
            usdtDecimals
          )
          const diff = Math.abs(transferredAmount - expectedAmount)
          if (diff > 0.01) {
            return false
          }
        }

        return true
      })

      if (hasMatchingTransfer) return true
    }

    return true
  } catch (err) {
    console.error(`Error checking txHash ${txHash} on ${networkSymbol}:`, err)
    return false
  }
}

/**
 * Searches onchain event logs for recent incoming ERC20 transfers to treasury address
 * matching expectedAmount and ensuring the detected tx_hash is NOT already claimed by another transaction in DB.
 */
async function findUnclaimedOnchainTransferHash({
  rpcUrl,
  walletAddress,
  usdtContractAddress,
  usdtDecimals,
  expectedAmount,
  networkCategory,
  networkSymbol,
}: {
  rpcUrl: string
  walletAddress: string
  usdtContractAddress: string
  usdtDecimals: number
  expectedAmount: number
  networkCategory: string
  networkSymbol: string
}): Promise<string | null> {
  const category = networkCategory.toLowerCase()
  const symbol = networkSymbol.toLowerCase()

  if (
    category === "evm" ||
    [
      "eth",
      "bep20",
      "polygon",
      "arbitrum",
      "base",
      "optimism",
      "avalanche",
    ].includes(symbol)
  ) {
    const cleanAddress = walletAddress.startsWith("0x")
      ? walletAddress.slice(2).toLowerCase()
      : walletAddress.toLowerCase()

    try {
      // 1. Fetch current block number to construct safe search block range (max 1500 blocks)
      let fromBlockHex = "earliest"
      const blockRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_blockNumber",
          params: [],
        }),
      })

      if (blockRes.ok) {
        const blockJson = await blockRes.json()
        if (blockJson.result) {
          const latestBlock = parseInt(blockJson.result, 16)
          const fromBlockNum = Math.max(0, latestBlock - 1500)
          fromBlockHex = "0x" + fromBlockNum.toString(16)
        }
      }

      // 2. Query event logs for the block range
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getLogs",
          params: [
            {
              address: usdtContractAddress,
              topics: [
                ERC20_TRANSFER_TOPIC,
                null,
                `0x000000000000000000000000${cleanAddress}`,
              ],
              fromBlock: fromBlockHex,
              toBlock: "latest",
            },
          ],
        }),
      })

      if (!res.ok) return null
      const json = await res.json()
      const logs = json.result
      if (!Array.isArray(logs) || logs.length === 0) return null

      // Loop through recent logs (newest first)
      for (const log of logs.reverse()) {
        const hash = log.transactionHash
        if (!hash || typeof hash !== "string") continue

        // 1. Amount Verification Check
        if (expectedAmount > 0) {
          const transferredAmount = parseErc20TransferAmount(
            log.data,
            usdtDecimals
          )
          const diff = Math.abs(transferredAmount - expectedAmount)
          if (diff > 0.01) {
            // Transferred amount does NOT match created exchange expected amount -> Skip!
            continue
          }
        }

        // 2. Database Deduplication Check: Hash must be unclaimed
        const existingTx = await prisma.transactions.findFirst({
          where: { tx_hash: hash },
        })

        if (!existingTx) {
          // Matching amount AND unclaimed onchain transfer hash found!
          return hash
        }
      }
    } catch (e) {
      console.error(`Error querying eth_getLogs on ${networkSymbol}:`, e)
    }
  }

  return null
}
