import { prisma } from "@/lib/prisma"
import { getExplorerTxUrl } from "@/lib/explorer"
import fs from "fs"
import path from "path"

const BOT_TOKEN = process.env.BOT_TOKEN

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "fiat_arrival", "crypto_arrival"],
  confirmed: ["processing", "fiat_arrival", "crypto_arrival"],
  processing: ["complete", "fiat_arrival", "crypto_arrival"],
  fiat_arrival: ["processing", "complete"],
  crypto_arrival: ["processing", "complete"],
}

export async function getDbChatIds(): Promise<string[]> {
  try {
    const list = await prisma.telegram.findMany({
      select: { chat_id: true },
    })
    return list.map((item) => item.chat_id)
  } catch (e) {
    console.error("Error reading telegram allowed list from database:", e)
    return []
  }
}

export async function getAllowedChatIds(): Promise<string[]> {
  const ids: string[] = []
  if (process.env.TELEGRAM_CHAT_ID) {
    const envIds = process.env.TELEGRAM_CHAT_ID.split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
    for (const id of envIds) {
      if (!ids.includes(id)) {
        ids.push(id)
      }
    }
  }
  const dbIds = await getDbChatIds()
  for (const id of dbIds) {
    if (!ids.includes(id)) {
      ids.push(id)
    }
  }
  return ids
}

async function fetchFullTransaction(transactionId: number) {
  const t = await prisma.transactions.findUnique({
    where: { id: transactionId },
    include: {
      exchange_rate: true,
    },
  })
  if (!t) return null

  const treasury = await prisma.treasury.findUnique({
    where: { id: t.treasury_id },
    include: { network: true },
  })

  return {
    ...t,
    treasury,
  }
}

function getReadableEventTime(t: any): string {
  const eventTime = t.updated_at ? new Date(t.updated_at) : new Date()
  return eventTime.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  })
}

function getExplorerUrl(t: any): string | null {
  const networkSymbol = t.treasury?.network?.symbol || ""
  const networkType = t.treasury?.network?.network_type || "mainnet"
  const rawTxHash = t.tx_hash?.trim()
  if (!rawTxHash || rawTxHash === "-") return null
  return getExplorerTxUrl(networkSymbol, rawTxHash, networkType)
}

function getTxHashDisplay(t: any): string {
  const rawTxHash = t.tx_hash?.trim()
  if (!rawTxHash || rawTxHash === "-") return "N/A"

  const explorerUrl = getExplorerUrl(t)
  return explorerUrl
    ? `<a href="${explorerUrl}"><code>${rawTxHash}</code></a>`
    : `<code>${rawTxHash}</code>`
}

// Short follow-up reply for crypto_arrival: only what wasn't already in the pending
// message (amounts, rates, bank/target details, order id are all up there already).
function formatCryptoArrivalReplyMessage(t: any): string {
  const explorerUrl = getExplorerUrl(t)
  const scannerLine = explorerUrl
    ? `<b>Scanner URL:</b> <a href="${explorerUrl}">View on Explorer</a>\n`
    : ""

  return (
    `✅ <b>Crypto Arrived — Verified Onchain</b>\n\n` +
    `<b>Tx Hash:</b> ${getTxHashDisplay(t)}\n` +
    scannerLine +
    `<b>Verified At:</b> <code>${getReadableEventTime(t)} (PHT)</code>`
  )
}

function formatTransactionMessage(t: any): string {
  const isFiatToCrypto = t.type === "fiat_to_crypto"
  const amountUsdt = Number(t.amount_usdt || 0)
  const amountPhp = Number(t.amount_php || 0)
  const totalProfitUsdt = Number(t.profit || 0)

  let gicProfitUsdt = 0
  let spinzoProfitUsdt = 0
  let spreadPercentage = 0

  if (t.exchange_rate) {
    const rate = t.exchange_rate
    if (isFiatToCrypto) {
      const gicFee = Number(rate.php_to_usdt_gic_fee || 0)
      const spinzoFee = Number(rate.php_to_usdt_spinzo_fee || 0)
      spreadPercentage = Number(rate.php_to_usdt_spread_percentage || 0)

      const totalSpread = gicFee + spinzoFee
      if (totalSpread > 0) {
        gicProfitUsdt = totalProfitUsdt * (gicFee / totalSpread)
        spinzoProfitUsdt = totalProfitUsdt * (spinzoFee / totalSpread)
      }
    } else {
      const gicFee = Number(rate.usdt_to_php_gic_fee || 0)
      const spinzoFee = Number(rate.usdt_to_php_spinzo_fee || 0)
      spreadPercentage = Number(rate.usdt_to_php_spread_percentage || 0)

      const totalSpread = gicFee + spinzoFee
      if (totalSpread > 0) {
        gicProfitUsdt = totalProfitUsdt * (gicFee / totalSpread)
        spinzoProfitUsdt = totalProfitUsdt * (spinzoFee / totalSpread)
      }
    }
  }

  let displayRate = "-"
  if (t.exchange_rate) {
    if (isFiatToCrypto) {
      const refRate = Number(
        t.reference_rate_snapshot ||
          t.exchange_rate.php_to_usdt_reference_rate ||
          0
      )
      displayRate = `1 PHP = ${refRate.toFixed(6)} USDT`
    } else {
      const refRate = Number(
        t.reference_rate_snapshot ||
          t.exchange_rate.usdt_to_php_reference_rate ||
          0
      )
      displayRate = `1 USDT = ${refRate.toFixed(2)} PHP`
    }
  }

  const typeStr = isFiatToCrypto ? "Fiat ➡️ Crypto" : "Crypto ➡️ Fiat"

  const isOnchainVerified =
    t.notes?.includes("onchain verification status is Verified") ||
    t.status === "crypto_arrival"

  const onchainBadge = isOnchainVerified
    ? "<b>VERIFIED ONCHAIN</b> ✅"
    : "<b>UNVERIFIED / PENDING ONCHAIN</b> ⏳"

  const statusEmoji =
    {
      pending: "⏳ Pending",
      confirmed: "✅ Confirmed",
      processing: "⚙️ Processing",
      complete: "🎉 Complete",
      fiat_arrival: "💵 Fiat Arrived",
      crypto_arrival: "✅ <b>Crypto Arrived (Onchain Verified)</b>",
    }[t.status as string] || t.status

  // Generate Admin Panel Link
  const appUrl = process.env.APP_URL || "https://exc-admin-stag.spinzo.io"
  const linkPath = isFiatToCrypto
    ? "/dashboard/operations/fiat-to-crypto"
    : "/dashboard/operations/crypto-to-fiat"
  const transactionLink = `${appUrl.replace(/\/$/, "")}${linkPath}?q=${t.order_id}`

  // Format Bank & Address details based on transaction direction
  let detailsSection = ""
  if (isFiatToCrypto) {
    // User deposited fiat to platform bank, expects crypto in their wallet
    let depositBankStr = "N/A"
    if (t.bank_details) {
      try {
        const parsed = JSON.parse(t.bank_details)
        if (parsed) {
          depositBankStr =
            `\n- <b>Bank:</b> ${parsed.bankName || "N/A"}\n` +
            `- <b>Account Name:</b> ${parsed.accountName || "N/A"}\n` +
            `- <b>Account Number:</b> <code>${parsed.accountNumber || "N/A"}</code>\n`
        }
      } catch (e) {
        depositBankStr = `\n${t.bank_details}\n`
      }
    }

    detailsSection =
      `<b>Platform Deposit Bank (Exchanger):</b>${depositBankStr}\n` +
      `<b>User Destination Crypto Wallet:</b>\n<code>${t.target_address || "N/A"}</code>\n`
  } else {
    // User sent crypto to platform treasury, expects fiat payout in their bank account
    let payoutBankStr = "N/A"
    if (t.bank_details) {
      try {
        const parsed = JSON.parse(t.bank_details)
        if (parsed) {
          payoutBankStr =
            `\n- <b>Bank:</b> ${parsed.bankName || "N/A"}\n` +
            `- <b>Account Name:</b> ${parsed.accountName || "N/A"}\n` +
            `- <b>Account Number:</b> <code>${parsed.accountNumber || "N/A"}</code>\n`
        }
      } catch (e) {
        payoutBankStr = `\n${t.bank_details}\n`
      }
    }

    detailsSection =
      `<b>Platform Deposit Treasury Wallet:</b>\n<code>${t.treasury?.wallet_address || "N/A"}</code>\n\n` +
      `<b>Payout Bank Account (Lotto):</b>${payoutBankStr}\n`
  }

  return (
    `<b>🆕 Transaction Notification</b>\n\n` +
    `<b>Order ID:</b> <code>${t.order_id || t.id}</code>\n` +
    `<b>Type:</b> ${typeStr}\n` +
    `<b>Status:</b> ${statusEmoji}\n` +
    `<b>Onchain Verification:</b> ${onchainBadge}\n` +
    `<b>Tx Hash:</b> ${getTxHashDisplay(t)}\n` +
    `<b>Event Time:</b> <code>${getReadableEventTime(t)} (PHT)</code>\n\n` +
    `<b>Amount Sent:</b> ${isFiatToCrypto ? `₱${amountPhp.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `${amountUsdt.toFixed(6)} USDT`}\n` +
    `<b>Amount Received:</b> ${isFiatToCrypto ? `${amountUsdt.toFixed(6)} USDT` : `₱${amountPhp.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}\n` +
    `<b>Reference Rate:</b> ${displayRate}\n\n` +
    `<b>Total Profit:</b> ${totalProfitUsdt.toFixed(6)} USDT (${spreadPercentage.toFixed(2)}% spread)\n` +
    `<b>SpinzoPay Fee:</b> ${spinzoProfitUsdt.toFixed(6)} USDT\n` +
    `<b>GIC Profit:</b> ${gicProfitUsdt.toFixed(6)} USDT\n\n` +
    detailsSection +
    `<b>Network:</b> ${t.treasury?.network?.symbol || "N/A"}\n\n` +
    `🔗 <a href="${transactionLink}"><b>View in Admin Panel</b></a>`
  )

}

function getReplyMarkupForStatus(t: any) {
  const isFiatToCrypto = t.type === "fiat_to_crypto"
  const inline_keyboard = []

  if (t.status === "pending") {
    inline_keyboard.push([
      { text: "💵 Confirm Payment", callback_data: `tx_${t.id}_confirmed` },
    ])
    if (isFiatToCrypto) {
      inline_keyboard.push([
        { text: "📥 Fiat Arrived", callback_data: `tx_${t.id}_fiat_arrival` },
      ])
    } else {
      inline_keyboard.push([
        {
          text: "📥 Crypto Arrived",
          callback_data: `tx_${t.id}_crypto_arrival`,
        },
      ])
    }
  } else if (
    t.status === "confirmed" ||
    t.status === "fiat_arrival" ||
    t.status === "crypto_arrival"
  ) {
    inline_keyboard.push([
      { text: "⚙️ Start Processing", callback_data: `tx_${t.id}_processing` },
    ])
    if (t.status === "confirmed") {
      if (isFiatToCrypto) {
        inline_keyboard.push([
          { text: "📥 Fiat Arrived", callback_data: `tx_${t.id}_fiat_arrival` },
        ])
      } else {
        inline_keyboard.push([
          {
            text: "📥 Crypto Arrived",
            callback_data: `tx_${t.id}_crypto_arrival`,
          },
        ])
      }
    }
  } else if (t.status === "processing") {
    inline_keyboard.push([
      { text: "🎉 Mark Complete", callback_data: `tx_${t.id}_complete` },
    ])
  }

  return inline_keyboard.length > 0 ? { inline_keyboard } : null
}

export async function sendTelegramNotification(transactionId: number) {
  if (!BOT_TOKEN) {
    console.warn("Telegram BOT_TOKEN is not configured. Skipping notification.")
    return
  }

  const chatIds = await getAllowedChatIds()
  if (chatIds.length === 0) {
    console.warn(
      "No allowed Telegram chat IDs found in TELEGRAM_CHAT_ID env. Skipping notification."
    )
    return
  }

  try {
    const t = await fetchFullTransaction(transactionId)

    if (!t) {
      console.error(
        `Transaction with ID ${transactionId} not found for Telegram notification.`
      )
      return
    }

    const fullMessageText = formatTransactionMessage(t)
    const shortReplyText =
      t.status === "crypto_arrival" ? formatCryptoArrivalReplyMessage(t) : null
    const replyMarkup = getReplyMarkupForStatus(t)

    let messageIds: Record<string, number> = {}
    try {
      messageIds = t.telegram_message_ids ? JSON.parse(t.telegram_message_ids) : {}
    } catch (e) {
      messageIds = {}
    }

    let messageIdsChanged = false

    for (const chatId of chatIds) {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
      const originalMessageId = messageIds[chatId]
      // Threading under an existing pending message: send the short follow-up
      // instead of repeating everything that message already shows.
      const messageText =
        shortReplyText && originalMessageId ? shortReplyText : fullMessageText

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: "HTML",
          reply_markup: replyMarkup || undefined,
          // Reply to the original "pending" notification instead of posting a fresh
          // message, so the success (crypto_arrival) update threads under it.
          ...(originalMessageId
            ? { reply_to_message_id: originalMessageId, allow_sending_without_reply: true }
            : {}),
        }),
      })

      if (!response.ok) {
        console.error(
          `Failed to send Telegram message to ${chatId}:`,
          await response.text()
        )
        continue
      }

      // Remember the first (pending) message per chat so later status updates can reply to it.
      if (!originalMessageId) {
        const data = await response.json()
        const sentMessageId = data?.result?.message_id
        if (sentMessageId) {
          messageIds[chatId] = sentMessageId
          messageIdsChanged = true
        }
      }
    }

    if (messageIdsChanged) {
      await prisma.transactions.update({
        where: { id: transactionId },
        data: { telegram_message_ids: JSON.stringify(messageIds) },
      })
    }
  } catch (e) {
    console.error("Error sending Telegram notification:", e)
  }
}

const LOCK_FILE = path.join(process.cwd(), "telegram-bot.lock")

function acquireBotLock(): boolean {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const content = fs.readFileSync(LOCK_FILE, "utf-8").trim()
      const oldPid = parseInt(content, 10)
      if (!isNaN(oldPid)) {
        try {
          // Check if process is actually running
          process.kill(oldPid, 0)
          console.warn(
            `[Bot Lock] Another bot listener instance is already running with PID ${oldPid}. Skipping bot listener start.`
          )
          return false
        } catch (e: any) {
          if (e.code !== "ESRCH") {
            console.error(
              `[Bot Lock] Error checking process status for PID ${oldPid}:`,
              e
            )
            return false
          }
        }
      }
    }

    // Write current PID to lock file
    fs.writeFileSync(LOCK_FILE, process.pid.toString(), "utf-8")

    // Cleanup functions
    const cleanup = () => {
      try {
        if (fs.existsSync(LOCK_FILE)) {
          fs.unlinkSync(LOCK_FILE)
        }
      } catch (e) {}
    }
    process.on("exit", cleanup)
    process.on("SIGINT", () => process.exit(0))
    process.on("SIGTERM", () => process.exit(0))
    process.on("SIGHUP", () => process.exit(0))

    return true
  } catch (err) {
    console.error("[Bot Lock] Failed to acquire lock:", err)
    return false
  }
}

export function startTelegramBot() {
  if (!BOT_TOKEN) {
    console.warn(
      "Telegram BOT_TOKEN is not configured. Background bot listener disabled."
    )
    return
  }

  // Acquire lock to guarantee only one listener runs at a time on this server instance
  if (!acquireBotLock()) {
    return
  }

  let offset = 0
  const pollingInterval = 1000
  let errorCount = 0

  console.log(
    `[${new Date().toISOString()}] Starting Telegram bot listener with TELEGRAM_CHAT_ID filter (PID: ${process.pid})...`
  )

  async function pollUpdates() {
    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10`
      console.log("url connection: ", url)
      const response = await fetch(url)
      if (!response.ok) {
        console.error("Telegram getUpdates error:", await response.text())
        const backoff = Math.min(30000, 5000 * Math.pow(2, errorCount))
        setTimeout(pollUpdates, backoff)
        return
      }

      // Reset error count on success
      errorCount = 0
      const resData = await response.json()
      if (resData.ok && resData.result.length > 0) {
        for (const update of resData.result) {
          offset = update.update_id + 1

          if (update.message) {
            const chatId = update.message.chat.id.toString()
            const text = update.message.text || ""

            if (
              text.startsWith("/start") ||
              text.startsWith("/register") ||
              text.startsWith("/help")
            ) {
              const allowedIds = await getAllowedChatIds()
              const isAllowed = allowedIds.includes(chatId)

              let reply = ""
              if (isAllowed) {
                reply = `✅ Welcome! This chat (${chatId}) is registered and authorized to receive SpinzoPay transaction notifications.`
              } else {
                reply = `❌ Unauthorized: Chat ID ${chatId} is not in the allowed list in the server environment configuration.`
              }
              await sendTelegramResponse(chatId, reply)
            }
          }

          if (update.callback_query) {
            await handleCallbackQuery(update.callback_query)
          }
        }
      }
    } catch (e: any) {
      errorCount++
      const isTimeout =
        e.message?.includes("fetch failed") ||
        e.code === "ETIMEDOUT" ||
        e.code === "ECONNRESET"
      if (isTimeout) {
        console.warn(
          `[Telegram Bot] Connection timeout/failed (attempt ${errorCount}). Retrying...`
        )
      } else {
        console.error("Error during Telegram polling:", e)
      }
      const backoff = Math.min(30000, 5000 * Math.pow(2, errorCount - 1))
      setTimeout(pollUpdates, backoff)
      return
    }
    setTimeout(pollUpdates, pollingInterval)
  }

  pollUpdates()
}

async function sendTelegramResponse(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  })
}

async function handleCallbackQuery(callbackQuery: any) {
  const callbackData = callbackQuery.data || ""
  const callbackQueryId = callbackQuery.id
  const message = callbackQuery.message
  const chatId = message.chat.id.toString()
  const fromId = callbackQuery.from.id.toString()
  const messageId = message.message_id

  if (!callbackData.startsWith("tx_")) {
    return
  }

  const allowedIds = await getAllowedChatIds()
  // Validate if either the user who clicked, or the chat where the button exists, is in the allowed list
  const isUserAllowed = allowedIds.includes(fromId)
  const isChatAllowed = allowedIds.includes(chatId)

  if (!isUserAllowed && !isChatAllowed) {
    await answerCallbackQuery(
      callbackQueryId,
      "❌ Unauthorized: You do not have permissions to manage transactions."
    )
    return
  }

  const parts = callbackData.split("_")
  const transactionId = parseInt(parts[1], 10)
  const newStatus = parts.slice(2).join("_")

  try {
    const t = await fetchFullTransaction(transactionId)

    if (!t) {
      await answerCallbackQuery(callbackQueryId, "❌ Transaction not found.")
      return
    }

    const allowed = VALID_TRANSITIONS[t.status]
    if (!allowed || !allowed.includes(newStatus)) {
      await answerCallbackQuery(
        callbackQueryId,
        `⚠️ Cannot transition from "${t.status}" to "${newStatus}".`
      )
      return
    }

    await prisma.transactions.update({
      where: { id: transactionId },
      data: {
        status: newStatus as any,
        updated_at: new Date(),
      },
    })

    // Re-fetch full updated transaction
    const updatedTransaction = await fetchFullTransaction(transactionId)
    if (!updatedTransaction) {
      await answerCallbackQuery(
        callbackQueryId,
        "❌ Failed to reload updated transaction."
      )
      return
    }

    await answerCallbackQuery(
      callbackQueryId,
      `✅ Status updated to: ${newStatus}`
    )

    const updatedText = formatTransactionMessage(updatedTransaction)
    const updatedReplyMarkup = getReplyMarkupForStatus(updatedTransaction)

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: updatedText,
        parse_mode: "HTML",
        reply_markup: updatedReplyMarkup || undefined,
      }),
    })
  } catch (e: any) {
    console.error("Error handling callback query:", e)
    await answerCallbackQuery(callbackQueryId, `❌ Error: ${e.message}`)
  }
}

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text,
    }),
  })
}
