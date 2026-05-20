import { withErrorHandler, successResponse, unauthorized } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"

export const GET = withErrorHandler(async (req) => {
  const session = await auth()
  if (!session || !session.user) {
    return unauthorized("Requires authentication")
  }

  // 1. Try to find the latest active exchange rate
  let rate = await prisma.exchange_rates.findFirst({
    where: { is_active: true },
    orderBy: { created_at: "desc" },
  })

  // 2. If no active rate, get the absolute latest rate (which would be inactive)
  let isActive = true
  if (!rate) {
    rate = await prisma.exchange_rates.findFirst({
      orderBy: { created_at: "desc" },
    })
    isActive = false
  }

  if (!rate) {
    return successResponse(null, "No exchange rates found")
  }

  return successResponse({
    id: rate.id.toString(),
    pair: rate.pair,
    usdtToPhpRate: Number(rate.usdt_to_php_rate || 0),
    phpToUsdtRate: Number(rate.php_to_usdt_rate || 0),
    isActive: rate.is_active || false,
  })
})
