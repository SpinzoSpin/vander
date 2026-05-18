import { Suspense } from "react"
import { format, subDays, isAfter } from "date-fns"

import { ActionsContainer } from "@/components/actions-container"
import { OnrampTable, type OnrampTransaction } from "@/components/operations/onramp-table"
import { OperationStatsCard } from "@/components/operations/stats-ops-card"
import { getTransactions } from "@/services/transactions/get-transactions"

export default async function Page(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined
  const filter = typeof searchParams.filter === "string" ? searchParams.filter : undefined
  const currency = typeof searchParams.currency === "string" ? searchParams.currency : undefined

  const dbTransactions = await getTransactions({
    type: "fiat_to_crypto",
    q,
    filter,
    currency,
  })

  const mappedData: OnrampTransaction[] = dbTransactions.map(t => ({
    id: t.id.toString(),
    orderId: t.order_id || "-",
    type: t.type,
    status: t.status,
    totalAmountSent: `₱${Number(t.amount_php).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    totalReceived: `${Number(t.amount_usdt).toFixed(6)} USDT`,
    profitUsdt: `${Number(t.profit || 0).toFixed(6)} USDT`,
    profitPercentage: t.amount_usdt && Number(t.amount_usdt) > 0
      ? `${((Number(t.profit || 0) / Number(t.amount_usdt)) * 100).toFixed(2)}%`
      : "0.00%",
    targetAddress: t.target_address || "-",
    txHash: t.tx_hash || "-",
    bankDetails: t.bank_details ? (() => { try { return JSON.parse(t.bank_details) } catch { return null } })() : null,
    createdAt: format(new Date(t.created_at), "MMM d, yyyy h:mm a"),
  }))

  const totalTransactions = dbTransactions.length
  const totalPending = dbTransactions.filter((t) => t.status === "pending").length
  const totalComplete = dbTransactions.filter((t) => t.status === "complete").length
  const totalRevenueUsdt = dbTransactions.reduce((acc, t) => acc + Number(t.profit || 0), 0)
  const totalAmountUsdt = dbTransactions.reduce((acc, t) => acc + Number(t.amount_usdt || 0), 0)
  const totalMarginPercentage = totalAmountUsdt > 0 ? (totalRevenueUsdt / totalAmountUsdt) * 100 : 0

  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)
  const sixtyDaysAgo = subDays(now, 60)

  const currentTxs = dbTransactions.filter(t => isAfter(new Date(t.created_at), thirtyDaysAgo))
  const previousTxs = dbTransactions.filter(t => isAfter(new Date(t.created_at), sixtyDaysAgo) && !isAfter(new Date(t.created_at), thirtyDaysAgo))

  const currentRevenue = currentTxs.reduce((acc, t) => acc + Number(t.profit || 0), 0)
  const previousRevenue = previousTxs.reduce((acc, t) => acc + Number(t.profit || 0), 0)
  
  const currentAmount = currentTxs.reduce((acc, t) => acc + Number(t.amount_usdt || 0), 0)
  const previousAmount = previousTxs.reduce((acc, t) => acc + Number(t.amount_usdt || 0), 0)

  const currentMargin = currentAmount > 0 ? (currentRevenue / currentAmount) * 100 : 0
  const previousMargin = previousAmount > 0 ? (previousRevenue / previousAmount) * 100 : 0

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return { value: current > 0 ? "100.00%" : "0.00%", isPositive: current >= 0 }
    const growth = ((current - previous) / Math.abs(previous)) * 100
    return { value: `${Math.abs(growth).toFixed(2)}%`, isPositive: growth >= 0 }
  }

  const stats = {
    totalTransactions,
    totalPending,
    totalComplete,
    totalRevenue: totalRevenueUsdt.toFixed(2),
    totalMargin: `${totalMarginPercentage.toFixed(2)}%`,
    revenueGrowth: calculateGrowth(currentRevenue, previousRevenue),
    marginGrowth: calculateGrowth(currentMargin, previousMargin),
    transactionsGrowth: calculateGrowth(currentTxs.length, previousTxs.length),
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 px-7.5">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold">Fiat to Crypto Overview</p>
          </div>
          <OperationStatsCard stats={stats} />

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
            <OnrampTable data={mappedData} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
