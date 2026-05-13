import { prisma } from "@/lib/prisma"
import { enum_transactions_type } from "@/generated/prisma"

export async function getTransactions(params?: {
  type?: enum_transactions_type
  q?: string
  filter?: string
  currency?: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  // Filter by transaction type (fiat_to_crypto or crypto_to_fiat)
  if (params?.type) {
    where.type = params.type
  }

  // Filter by status if provided
  if (params?.filter) {
    where.status = params.filter
  }

  // Search by order_id, target_address, or tx_hash
  if (params?.q) {
    where.OR = [
      { order_id: { contains: params.q, mode: "insensitive" } },
      { target_address: { contains: params.q, mode: "insensitive" } },
      { tx_hash: { contains: params.q, mode: "insensitive" } },
    ]
  }

  const transactions = await prisma.transactions.findMany({
    where,
    orderBy: {
      created_at: "desc",
    },
  })

  return transactions
}
