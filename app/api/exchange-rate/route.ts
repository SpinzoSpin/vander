import { withErrorHandler, successResponse, unauthorized } from "@/lib/api-response"
import { createExchangeRate } from "@/services/exchange-rates/create-rate"
import { getExchangeRates } from "@/services/exchange-rates/get-rates"
import { auth } from "@/auth/auth"
import { NextRequest } from "next/server"

export const GET = withErrorHandler(async (req) => {
    const session = await auth()
    if (!session || !session.user) {
        return unauthorized("Requires authentication")
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || undefined
    const filter = searchParams.get("filter") || undefined
    const currency = searchParams.get("currency") || undefined

    const dbRates = await getExchangeRates({ q, filter, currency, role: (session.user as any).role })

    // Map to ExchangeRate format expected by the frontend
    const mappedData = dbRates.map(r => ({
        id: r.id.toString(),
        currencyPair: r.pair,
        usdtPhpRefRate: r.usdt_to_php_reference_rate.toString(),
        usdtPhpFinalRate: r.usdt_to_php_rate.toString(),
        usdtPhpProfitSpread: r.usdt_to_php_spread?.toString() || "0",
        phpUsdtProfitSpread: r.php_to_usdt_spread?.toString() || "0",
        usdtPhpSpinzoFee: r.usdt_to_php_spinzo_fee?.toString() || "0",
        usdtPhpGicFee: r.usdt_to_php_gic_fee?.toString() || "0",
        phpUsdtRefRate: r.php_to_usdt_reference_rate.toString(),
        phpUsdtRate: r.php_to_usdt_rate.toString(),
        phpUsdtSpinzoFee: r.php_to_usdt_spinzo_fee?.toString() || "0",
        phpUsdtGicFee: r.php_to_usdt_gic_fee?.toString() || "0",
        active: r.is_active || false,
    }))

    return successResponse(mappedData)
})

export const POST = withErrorHandler(async (req) => {
    // Basic authentication to prevent abuse
    // E.g., require the user to be logged in (or you can require a specific API key if this is triggered by a cron job)
    const session = await auth()

    // Optional: Only allow admins to trigger this manually via the UI
    // For cron jobs, you'd check a custom Authorization header instead of session
    if (!session || !session.user) {
        // We'll also allow a secret token for cron triggers
        const authHeader = req.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return unauthorized("Unauthorized to trigger exchange rate creation")
        }
    } else if ((session.user as any).role !== "admin" && (session.user as any).role !== "gic") {
        return unauthorized("Requires admin privileges")
    }

    let manualRates = undefined
    try {
        const body = await req.json()
        if (body && Object.keys(body).length > 0) {
            manualRates = body
        }
    } catch (e) {
        // No body provided, ignore
    }

    // Call the service to fetch from exchangerate-api and save to database
    // Or use manual rates if provided
    const newRate = await createExchangeRate(manualRates)

    return successResponse(newRate, "Exchange rate successfully created and updated")
})
