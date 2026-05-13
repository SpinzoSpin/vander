import { prisma } from "@/lib/prisma"

export async function getExchangeRates(params?: {
  q?: string;
  filter?: string;
  currency?: string;
}) {
  const where: any = {}

  if (params?.filter === "active") where.is_active = true
  if (params?.filter === "inactive") where.is_active = false
  
  if (params?.currency) {
      where.pair = params.currency
  }

  if (params?.q) {
      where.pair = { contains: params.q, mode: "insensitive" }
  }

  const rates = await prisma.exchange_rates.findMany({
    where,
    orderBy: {
      created_at: 'desc',
    },
  })

  return rates
}
