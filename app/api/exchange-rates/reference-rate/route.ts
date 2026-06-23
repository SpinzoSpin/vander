import { NextRequest } from "next/server"
import { withErrorHandler, successResponse, unauthorized, notFound } from "@/lib/api-response"
import { authenticateApiRequest } from "@/lib/auth-api-key"
import { prisma } from "@/lib/prisma"

export const GET = withErrorHandler(async (req: NextRequest) => {
    const authResult = await authenticateApiRequest(req)
    if (!authResult.authorized) return unauthorized("Requires authentication")

    // Fetch the latest exchange rate regardless of active status
    const referenceRate = await prisma.exchange_rates.findFirst({
        orderBy: { created_at: 'desc' }
    })

    if (!referenceRate) {
        return notFound("No reference rate found")
    }

    const response = {
        usdtToPhpRate: Number(referenceRate.usdt_to_php_rate),
        phpToUsdtRate: Number(referenceRate.php_to_usdt_rate)
    }

    return successResponse(response)
})