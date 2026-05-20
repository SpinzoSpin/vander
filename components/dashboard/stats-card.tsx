import { CardGrid } from "../card-grid"
import { RevenueCard } from "../revenue-card"

import type { DashboardStats } from "@/services/transactions/get-dashboard-stats"

interface DashboardStatsCardProps {
  stats?: DashboardStats
}

export function DashboardStatsCard({ stats }: DashboardStatsCardProps) {
  const s = stats

  return (
    <>
      <CardGrid cols={4}>
        <RevenueCard
          title="TOTAL REVENUE"
          amount={s ? s.totalRevenue.toFixed(2) : "0.00"}
          percentageChange={s ? `${s.totalRevenueChange.toFixed(2)}%` : "0.00%"}
          isPositive={s ? s.totalRevenueIsPositive : true}
          description="All processed transactions (USDT)"
        />
        <RevenueCard
          title="TOTAL MARGIN"
          amount={s ? s.totalMargin.toFixed(2) : "0.00"}
          percentageChange={s ? `${s.totalMarginChange.toFixed(2)}%` : "0.00%"}
          isPositive={s ? s.totalMarginIsPositive : true}
          description="Profit from completed txns (USDT)"
        />
        <RevenueCard
          title={s?.profitLabel ?? "PROFIT"}
          amount={s ? s.profit.toFixed(6) : "0.000000"}
          percentageChange={s ? `${s.profitChange.toFixed(2)}%` : "0.00%"}
          isPositive={s ? s.profitIsPositive : false}
          description={
            s?.latestTransactionDate
              ? `Latest: ${s.latestTransactionDate}`
              : "No transactions yet"
          }
        />
        <RevenueCard
          title="TOTAL TRANSACTIONS"
          amount={s ? s.totalTransactions.toString() : "0"}
          percentageChange={
            s ? `${s.totalTransactionsChange.toFixed(2)}%` : "0.00%"
          }
          isPositive={s ? s.totalTransactionsIsPositive : true}
          withUSDTIcon={false}
          description="Last 30 days"
        />
      </CardGrid>
      <CardGrid cols={2}>
        <RevenueCard
          title="PENDING"
          amount={s ? s.pendingCount.toString() : "0"}
          percentageChange={s ? `${s.pendingChange.toFixed(2)}%` : "0.00%"}
          isPositive={s ? s.pendingIsPositive : false}
          withEndLabel={false}
          withUSDTIcon={false}
          description="Awaiting processing"
        />
        <RevenueCard
          title="COMPLETED"
          amount={s ? s.completedCount.toString() : "0"}
          percentageChange={s ? `${s.completedChange.toFixed(2)}%` : "0.00%"}
          isPositive={s ? s.completedIsPositive : true}
          withEndLabel={false}
          withUSDTIcon={false}
          description="Completed this period"
        />
      </CardGrid>
    </>
  )
}
