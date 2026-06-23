import { withErrorHandler, successResponse, unauthorized } from "@/lib/api-response"
import { getTreasuries } from "@/services/treasuries/get-treasuries"
import { auth } from "@/auth/auth"
import { NextRequest } from "next/server"
import { format } from "date-fns"

export const GET = withErrorHandler(async (req: NextRequest) => {
    const session = await auth()
    if (!session || !session.user) {
        return unauthorized("Requires authentication")
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || undefined
    const filter = searchParams.get("filter") || undefined
    const currency = searchParams.get("currency") || undefined

    const dbTreasuries = await getTreasuries({ q, filter, currency })
    
    // Map to Treasury format expected by the frontend table
    const mappedData = dbTreasuries.map(t => ({
        id: t.id.toString(),
        walletName: t.wallet_name,
        walletAddress: t.wallet_address,
        network: t.network.name, // e.g. "Tron", "Ethereum"
        currentBalance: t.current_balance?.toString() || "0.00",
        latestTransactionAt: t.latest_transaction_at ? format(new Date(t.latest_transaction_at), "MMM d, yyyy h:mm a") : "-",
    }))

    return successResponse(mappedData)
})
