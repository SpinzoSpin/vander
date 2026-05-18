import { CardGrid } from "../card-grid"
import { RevenueCard } from "../revenue-card"

export interface OperationStats {
  totalTransactions: number
  totalPending: number
  totalComplete: number
  totalRevenue: string
  totalMargin: string
  revenueGrowth: { value: string; isPositive: boolean }
  marginGrowth: { value: string; isPositive: boolean }
  transactionsGrowth: { value: string; isPositive: boolean }
}

export function OperationStatsCard({ stats }: { stats: OperationStats }) {
  return (
    <CardGrid cols={5}>
      <RevenueCard
        title="TOTAL TRANSACTION"
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
    </CardGrid>
  )
}
