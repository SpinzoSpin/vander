import { prisma } from "@/lib/prisma"

export async function getTreasuries(params?: {
  q?: string;
  filter?: string;
  currency?: string;
}) {
  const where: any = {}

  // "filter" or "currency" might not map perfectly to treasuries yet, 
  // but we can support network filtering if needed
  if (params?.currency) {
      where.networks = {
        symbol: params.currency
      }
  }

  if (params?.q) {
      where.OR = [
        { wallet_name: { contains: params.q, mode: "insensitive" } },
        { wallet_address: { contains: params.q, mode: "insensitive" } }
      ]
  }

  const treasuries = await prisma.treasury.findMany({
    where,
    include: {
        network: true
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  return treasuries
}
