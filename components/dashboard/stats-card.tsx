import { CardGrid } from "../card-grid"
import { RevenueCard } from "../revenue-card"
import { ScrollReveal, ScrollRevealGroup } from "../ui/scroll-reveal"

import type { DashboardStats } from "@/services/transactions/get-dashboard-stats"

interface DashboardStatsCardProps {
  stats?: DashboardStats
}

export function DashboardStatsCard({ stats }: DashboardStatsCardProps) {
  const s = stats

  return (
    <>
      <CardGrid cols={4}>
        <ScrollRevealGroup stagger={80}>
          <ScrollReveal className="h-full">
            <RevenueCard
              title="TOTAL REVENUE"
              amount={s ? s.totalRevenue.toFixed(2) : "0.00"}
              percentageChange={s ? `${s.totalRevenueChange.toFixed(2)}%` : "0.00%"}
              isPositive={s ? s.totalRevenueIsPositive : true}
              description="All processed transactions (USDT)"
            />
          </ScrollReveal>
          <ScrollReveal className="h-full">
            <RevenueCard
              title="TOTAL MARGIN"
              amount={s ? s.totalMargin.toFixed(2) : "0.00"}
              percentageChange={s ? `${s.totalMarginChange.toFixed(2)}%` : "0.00%"}
              isPositive={s ? s.totalMarginIsPositive : true}
              description="Profit from completed txns (USDT)"
            />
          </ScrollReveal>
          <ScrollReveal className="h-full">
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
          </ScrollReveal>
          <ScrollReveal className="h-full">
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
          </ScrollReveal>
        </ScrollRevealGroup>
      </CardGrid>
      <CardGrid cols={2}>
        <ScrollRevealGroup stagger={80} delay={160}>
          <ScrollReveal className="h-full">
            <RevenueCard
              title="PENDING"
              amount={s ? s.pendingCount.toString() : "0"}
              percentageChange={s ? `${s.pendingChange.toFixed(2)}%` : "0.00%"}
              isPositive={s ? s.pendingIsPositive : false}
              withEndLabel={false}
              withUSDTIcon={false}
              description="Awaiting processing"
            />
          </ScrollReveal>
          <ScrollReveal className="h-full">
            <RevenueCard
              title="COMPLETED"
              amount={s ? s.completedCount.toString() : "0"}
              percentageChange={s ? `${s.completedChange.toFixed(2)}%` : "0.00%"}
              isPositive={s ? s.completedIsPositive : true}
              withEndLabel={false}
              withUSDTIcon={false}
              description="Completed this period"
            />
          </ScrollReveal>
        </ScrollRevealGroup>
      </CardGrid>
    </>
  )
}

