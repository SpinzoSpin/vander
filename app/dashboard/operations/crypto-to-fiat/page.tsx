import { Suspense } from "react"
import { format } from "date-fns"

import { ActionsContainer } from "@/components/actions-container"
import { OperationStatsCard } from "@/components/operations/stats-ops-card"
import { OfframpTable, type OfframpTransaction } from "@/components/operations/offramp-table"
import { getTransactions } from "@/services/transactions/get-transactions"

export default async function Page(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined
  const filter = typeof searchParams.filter === "string" ? searchParams.filter : undefined
  const currency = typeof searchParams.currency === "string" ? searchParams.currency : undefined

  const dbTransactions = await getTransactions({
    type: "crypto_to_fiat",
    q,
    filter,
    currency,
  })

  const mappedData: OfframpTransaction[] = dbTransactions.map(t => ({
    id: t.id.toString(),
    orderId: t.order_id || "-",
    type: t.type,
    status: t.status,
    totalAmountSent: `${Number(t.amount_usdt).toFixed(6)} USDT`,
    totalReceived: `₱${Number(t.amount_php).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    profitUsdt: `${Number(t.profit || 0).toFixed(6)} USDT`,
    profitPercentage: t.amount_usdt && Number(t.amount_usdt) > 0
      ? `${((Number(t.profit || 0) / Number(t.amount_usdt)) * 100).toFixed(2)}%`
      : "0.00%",
    targetAddress: t.target_address || "-",
    txHash: t.tx_hash || "-",
    createdAt: format(new Date(t.created_at), "MMM d, yyyy h:mm a"),
  }))

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 px-7.5">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold">Crypto to Fiat Overview</p>
          </div>
          <OperationStatsCard />

          <div className="flex items-center justify-between">
            <p className="text-base font-semibold">Transactions</p>
            <Suspense>
              <ActionsContainer
                searchKey="q"
                filterKey="filter"
                currencyKey="currency"
              />
            </Suspense>
          </div>

          <Suspense>
            <OfframpTable data={mappedData} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
