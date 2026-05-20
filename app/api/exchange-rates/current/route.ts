import { NextRequest } from "next/server"
import { withErrorHandler, successResponse, unauthorized, notFound } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { authenticateApiRequest } from "@/lib/auth-api-key"

export const GET = withErrorHandler(async (req: NextRequest) => {
    const authResult = await authenticateApiRequest(req)
    if (!authResult.authorized) return unauthorized("Requires authentication")

    // Fetch the currently active exchange rate
    const currentRate = await prisma.exchange_rates.findFirst({
        where: { is_active: true },
        orderBy: { created_at: 'desc' }
    })

    if (!currentRate) {
        return notFound("No active exchange rate found")
    }

    const response = {
        usdtToPhpRate: Number(currentRate.usdt_to_php_rate),
        phpToUsdtRate: Number(currentRate.php_to_usdt_rate)
    }

    return successResponse(response)
})
