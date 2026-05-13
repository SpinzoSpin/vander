import { withErrorHandler, successResponse, unauthorized } from "@/lib/api-response"
import { getTransactions } from "@/services/transactions/get-transactions"
import { auth } from "@/auth/auth"
import { format } from "date-fns"
import { enum_transactions_type } from "@/generated/prisma"

export const GET = withErrorHandler(async (req) => {
    const session = await auth()
    if (!session || !session.user) {
        return unauthorized("Requires authentication")
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") as enum_transactions_type | null
    const q = searchParams.get("q") || undefined
    const filter = searchParams.get("filter") || undefined
    const currency = searchParams.get("currency") || undefined

    const dbTransactions = await getTransactions({
        type: type || undefined,
        q,
        filter,
        currency,
    })

    // Map to the format expected by the frontend table
    const mappedData = dbTransactions.map(t => ({
        id: t.id.toString(),
        orderId: t.order_id || "-",
        type: t.type,
        status: t.status,
        totalAmountSent: t.type === "fiat_to_crypto"
            ? `₱${Number(t.amount_php).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
            : `${Number(t.amount_usdt).toFixed(6)} USDT`,
        totalReceived: t.type === "fiat_to_crypto"
            ? `${Number(t.amount_usdt).toFixed(6)} USDT`
            : `₱${Number(t.amount_php).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        profitUsdt: `${Number(t.profit || 0).toFixed(6)} USDT`,
        profitPercentage: t.amount_usdt && Number(t.amount_usdt) > 0
            ? `${((Number(t.profit || 0) / Number(t.amount_usdt)) * 100).toFixed(2)}%`
            : "0.00%",
        targetAddress: t.target_address || "-",
        txHash: t.tx_hash || "-",
        createdAt: format(new Date(t.created_at), "MMM d, yyyy h:mm a"),
    }))

    return successResponse(mappedData)
})
