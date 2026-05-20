import { Suspense } from "react"
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"

import { ActionsContainer } from "@/components/actions-container"
import {
  DashboardStatsCard,
  ProfitChart,
  RecentTransactions,
} from "@/components/dashboard"
import { getDashboardStats } from "@/services/transactions/get-dashboard-stats"

export default async function Page() {
  const session = await auth()
  const role = (session?.user as any)?.role?.toLowerCase()

  if (role === "gic" || role === "lotto") {
    redirect("/dashboard/operations/fiat-to-crypto")
  }

  // Fetch all dashboard data from the database (role-aware profit)
  const { stats, chartData, networkSeries, recentTransactions } = await getDashboardStats(role ?? "admin")

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 px-7.5">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold">Finance Overview</p>
            <Suspense>
              <ActionsContainer
                searchKey="q"
                filterKey="filter"
                currencyKey="currency"
              />
            </Suspense>
          </div>

          {/* Stat cards */}
          <DashboardStatsCard stats={stats} />

          {/* Daily Profit Breakdown chart */}
          <ProfitChart data={chartData} networkSeries={networkSeries} />

          {/* Recent Transactions table */}
          <Suspense>
            <RecentTransactions
              transactions={recentTransactions}
              searchKey="q"
              filterKey="filter"
              currencyKey="currency"
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
