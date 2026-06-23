import { CardGrid } from "../card-grid"
import { RevenueCard } from "../revenue-card"

export interface OperationStats {
  totalTransactions: number
  totalPending: number
  totalComplete: number
  totalRevenue: string // Admin only
  totalMargin: string // Admin only
  revenueGrowth: { value: string; isPositive: boolean } // Admin only
  marginGrowth: { value: string; isPositive: boolean } // Admin only
  transactionsGrowth: { value: string; isPositive: boolean }
  totalSent?: string // Lotto/GIC
  totalReceived?: string // Lotto/GIC
  totalSentDescription?: string
  totalReceivedDescription?: string
  sentHasUSDTIcon?: boolean
  receivedHasUSDTIcon?: boolean
}

export function OperationStatsCard({
  stats,
  role,
}: {
  stats: OperationStats
  role?: string
}) {
  const isUser = role === "lotto" || role === "gic"

  return (
    <CardGrid cols={5}>
      <RevenueCard
        title="TOTAL TRX"
        amount={stats.totalTransactions.toString()}
        percentageChange={stats.transactionsGrowth.value}
        isPositive={stats.transactionsGrowth.isPositive}
        withEndLabel={true}
        withUSDTIcon={false}
      />
      <RevenueCard
        title="TOTAL PENDING"
        amount={stats.totalPending.toString()}
        withEndLabel={false}
        withUSDTIcon={false}
      />
      <RevenueCard
        title="TOTAL COMPLETE"
        amount={stats.totalComplete.toString()}
        withEndLabel={false}
        withUSDTIcon={false}
      />
      {!isUser && (
        <>
          <RevenueCard
            title="TOTAL REVENUE"
            amount={stats.totalRevenue}
            percentageChange={stats.revenueGrowth.value}
            isPositive={stats.revenueGrowth.isPositive}
            withEndLabel={true}
          />
          <RevenueCard
            title="TOTAL MARGIN"
            amount={stats.totalMargin}
            percentageChange={stats.marginGrowth.value}
            isPositive={stats.marginGrowth.isPositive}
            withEndLabel={true}
            withUSDTIcon={false}
          />
        </>
      )}
      {isUser && (
        <>
          <RevenueCard
            title="TOTAL SENT"
            amount={stats.totalSent || "0.00"}
            description={stats.totalSentDescription}
            withEndLabel={true}
            withUSDTIcon={stats.sentHasUSDTIcon}
          />
          <RevenueCard
            title="TOTAL RECEIVED"
            amount={stats.totalReceived || "0.00"}
            description={stats.totalReceivedDescription}
            withEndLabel={true}
            withUSDTIcon={stats.receivedHasUSDTIcon}
          />
        </>
      )}
    </CardGrid>
  )
}
