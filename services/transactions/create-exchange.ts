import { prisma } from "@/lib/prisma"
import { BadRequestError } from "@/lib/api-response"
import crypto from "crypto"

export async function createExchangeTransaction({
    type,
    amount,
    networkId,
    targetAddress,
}: {
    type: "fiat_to_crypto" | "crypto_to_fiat"
    amount: number
    networkId: number
    targetAddress?: string
}) {
    // 1. Network Validation
    const network = await prisma.networks.findUnique({ where: { id: networkId } })
    if (!network || !network.is_active) {
        throw new BadRequestError("Network is invalid or currently inactive")
    }

    // 2. Treasury Auto-Selection
    const treasury = await prisma.treasury.findFirst({
        where: { network_id: networkId },
        orderBy: { current_balance: 'desc' }
    })
    if (!treasury) {
        throw new BadRequestError(`No treasury wallet available for network: ${network.name}`)
    }

    // 3. Exchange Rate Fetching
    const exchangeRate = await prisma.exchange_rates.findFirst({
        orderBy: { updated_at: 'desc' }
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
            accountNumber: process.env.BANK_ACCOUNT_NUMBER_EXCHANGER || ""
        }
    } else {
        bankDetails = {
            bankName: process.env.BANK_NAME_LOTTO || "",
            accountName: process.env.BANK_ACCOUNT_NAME_LOTTO || "",
            accountNumber: process.env.BANK_ACCOUNT_NUMBER_LOTTO || ""
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
            
            // Snapshots
            usdt_to_php_reference_rate_snapshot: exchangeRate.usdt_to_php_reference_rate,
            usdt_to_php_rate_snapshot: exchangeRate.usdt_to_php_rate,
            php_to_usdt_reference_rate_snapshot: exchangeRate.php_to_usdt_reference_rate,
            php_to_usdt_rate_snapshot: exchangeRate.php_to_usdt_rate,
            rate_snapshot: appliedRate,
            reference_rate_snapshot: referenceRate,
            applied_rate_snapshot: appliedRate,
        }
    })

    // Trigger Telegram notification in the background
    import("@/services/telegram/bot").then(({ sendTelegramNotification }) => {
        sendTelegramNotification(transaction.id);
    }).catch(err => {
        console.error("Failed to load Telegram bot:", err);
    });

    // 7. API Response Construction
    return {
        success: true,
        rateUsed,
        exchangeDetails: {
            userSends: {
                amount: type === "fiat_to_crypto" ? amountPhp : amountUsdt,
                currency: type === "fiat_to_crypto" ? "PHP" : "USDT"
            },
            userReceives: {
                amount: type === "fiat_to_crypto" ? amountUsdt : amountPhp,
                currency: type === "fiat_to_crypto" ? "USDT" : "PHP"
            },
            appliedRate: type === "fiat_to_crypto"
                ? `1 PHP = ${appliedRate} USDT`
                : `1 USDT = ${appliedRate} PHP`,
            bankDetails: bankDetails,
            depositAddress: type === "crypto_to_fiat" ? treasury.wallet_address : undefined
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
            createdAt: transaction.created_at
        }
    }
}
