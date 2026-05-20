import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number
  totalRevenueChange: number
  totalRevenueIsPositive: boolean
  totalMargin: number
  totalMarginChange: number
  totalMarginIsPositive: boolean
  profit: number
  profitChange: number
  profitIsPositive: boolean
  profitLabel: string
  totalTransactions: number
  totalTransactionsChange: number
  totalTransactionsIsPositive: boolean
  pendingCount: number
  pendingChange: number
  pendingIsPositive: boolean
  completedCount: number
  completedChange: number
  completedIsPositive: boolean
  latestTransactionDate: string | null
}

/** One row per day, with a total `usdt` + per-network keys (e.g. `base`, `bep20`). */
export interface DailyProfitPoint {
  date: string
  usdt: number
  php: number
  [networkSymbol: string]: number | string // dynamic per-network fields
}

/** Metadata about each network series shown in the chart. */
export interface NetworkSeries {
  key: string    // e.g. "base", "bep20"
  label: string  // e.g. "Base", "Binance Smart Chain"
  color: string
}

export interface RecentTransactionRow {
  orderId: string
  type: string
  status: "completed" | "pending" | "failed"
  received: string
  sent: string
  profit: string
  created: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computePercentageChange(
  current: number,
  previous: number
): { change: number; isPositive: boolean } {
  if (previous === 0) {
    return { change: current > 0 ? 100 : 0, isPositive: current >= 0 }
  }
  const change = ((current - previous) / previous) * 100
  return { change: Math.abs(change), isPositive: change >= 0 }
}

/**
 * Compute the role-specific profit for a single transaction.
 *
 * - admin / spinzo (or any non-gic role)  →  Spinzo's share of the profit
 * - gic                                    →  GIC's share of the profit
 *
 * The split ratio comes from the fee fields on the linked exchange_rate.
 */
function computeRoleProfit(t: any, role: string): number {
  const totalProfit = Number(t.profit || 0)
  if (totalProfit === 0) return 0

  const er = t.exchange_rate
  if (!er) return totalProfit // No rate → can't split, show full

  const isFiatToCrypto = t.type === "fiat_to_crypto"

  const gicFee = isFiatToCrypto
    ? Number(er.php_to_usdt_gic_fee || 0)
    : Number(er.usdt_to_php_gic_fee || 0)
  const spinzoFee = isFiatToCrypto
    ? Number(er.php_to_usdt_spinzo_fee || 0)
    : Number(er.usdt_to_php_spinzo_fee || 0)

  const totalFees = gicFee + spinzoFee
  if (totalFees === 0) return totalProfit // No fee data → can't split

  if (role === "gic") {
    return totalProfit * (gicFee / totalFees)
  }

  // admin, spinzo, or any other role → show Spinzo's share
  return totalProfit * (spinzoFee / totalFees)
}

// ─── Consistent colors for network lines ─────────────────────────────────────
const NETWORK_COLORS: Record<string, string> = {
  base: "#0052FF",
  bep20: "#F0B90B",
  eth: "#627EEA",
  polygon: "#8247E5",
  arbitrum: "#28A0F0",
  optimism: "#FF0420",
  solana: "#9945FF",
  trc20: "#FF0013",
  avalanche: "#E84142",
}

function getNetworkColor(symbol: string): string {
  return NETWORK_COLORS[symbol.toLowerCase()] ?? "#4e4e4e"
}

// ─── Main fetch ──────────────────────────────────────────────────────────────

export async function getDashboardStats(role: string): Promise<{
  stats: DashboardStats
  chartData: DailyProfitPoint[]
  networkSeries: NetworkSeries[]
  recentTransactions: RecentTransactionRow[]
}> {
  // Current period: last 30 days. Previous period: 30 days before that.
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000)

  // Fetch all transactions from the last 60 days in one query
  const allTransactions = await prisma.transactions.findMany({
    where: {
      created_at: { gte: sixtyDaysAgo },
    },
    orderBy: { created_at: "desc" },
    include: {
      exchange_rate: true,
    },
  })

  // Fetch treasury → network mapping for network breakdown
  const treasuryIds = [
    ...new Set(allTransactions.map((t) => t.treasury_id).filter(Boolean)),
  ]
  const treasuries = await prisma.treasury.findMany({
    where: { id: { in: treasuryIds } },
    include: { network: true },
  })
  const treasuryMap = new Map(treasuries.map((t) => [t.id, t]))

  // Split into current and previous periods
  const currentPeriod = allTransactions.filter(
    (t) => new Date(t.created_at) >= thirtyDaysAgo
  )
  const previousPeriod = allTransactions.filter(
    (t) =>
      new Date(t.created_at) >= sixtyDaysAgo &&
      new Date(t.created_at) < thirtyDaysAgo
  )

  // ── Completed statuses ──
  const completedStatuses = ["complete", "fiat_arrival", "crypto_arrival"]

  const currentCompleted = currentPeriod.filter((t) =>
    completedStatuses.includes(t.status)
  )
  const previousCompleted = previousPeriod.filter((t) =>
    completedStatuses.includes(t.status)
  )

  // ── Total Revenue: sum of amount_usdt for completed txns ──
  const currentRevenue = currentCompleted.reduce(
    (sum, t) => sum + Number(t.amount_usdt || 0),
    0
  )
  const previousRevenue = previousCompleted.reduce(
    (sum, t) => sum + Number(t.amount_usdt || 0),
    0
  )
  const revenueChange = computePercentageChange(currentRevenue, previousRevenue)

  // ── Total Margin: role-specific profit from completed txns ──
  const currentMargin = currentCompleted.reduce(
    (sum, t) => sum + computeRoleProfit(t, role),
    0
  )
  const previousMargin = previousCompleted.reduce(
    (sum, t) => sum + computeRoleProfit(t, role),
    0
  )
  const marginChange = computePercentageChange(currentMargin, previousMargin)

  // ── Profit: role-specific profit from ALL transactions in current period ──
  const currentProfit = currentPeriod.reduce(
    (sum, t) => sum + computeRoleProfit(t, role),
    0
  )
  const previousProfit = previousPeriod.reduce(
    (sum, t) => sum + computeRoleProfit(t, role),
    0
  )
  const profitChange = computePercentageChange(currentProfit, previousProfit)

  // Label the profit card based on role
  const profitLabel = role === "gic" ? "GIC PROFIT" : "SPINZO PROFIT"

  // ── Transaction counts ──
  const currentCount = currentPeriod.length
  const previousCount = previousPeriod.length
  const txCountChange = computePercentageChange(currentCount, previousCount)

  // ── Pending / Completed counts (current period) ──
  const currentPending = currentPeriod.filter(
    (t) => t.status === "pending"
  ).length
  const previousPending = previousPeriod.filter(
    (t) => t.status === "pending"
  ).length
  const pendingChange = computePercentageChange(currentPending, previousPending)

  const currentCompletedCount = currentCompleted.length
  const previousCompletedCount = previousCompleted.length
  const completedChange = computePercentageChange(
    currentCompletedCount,
    previousCompletedCount
  )

  // ── Latest transaction ──
  const latestTx = allTransactions.length > 0 ? allTransactions[0] : null
  const latestTransactionDate = latestTx
    ? format(new Date(latestTx.created_at), "MMM d, yyyy h:mm a")
    : null

  // ── Collect unique network symbols seen in current period ──
  const seenNetworks = new Map<string, { label: string; color: string }>()
  for (const t of currentPeriod) {
    const treasury = treasuryMap.get(t.treasury_id)
    if (treasury?.network) {
      const sym = treasury.network.symbol.toLowerCase()
      if (!seenNetworks.has(sym)) {
        seenNetworks.set(sym, {
          label: treasury.network.name,
          color: getNetworkColor(sym),
        })
      }
    }
  }

  const networkSeries: NetworkSeries[] = Array.from(
    seenNetworks.entries()
  ).map(([key, v]) => ({
    key,
    label: v.label,
    color: v.color,
  }))

  // ── Daily profit breakdown (last 30 days) — role-specific + per-network ──
  // Build a template for each day's data
  const dailyMap = new Map<
    string,
    { usdt: number; php: number; [key: string]: number }
  >()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000)
      .toISOString()
      .slice(0, 10)
    const dayEntry: any = { usdt: 0, php: 0 }
    for (const ns of networkSeries) {
      dayEntry[ns.key] = 0
    }
    dailyMap.set(date, dayEntry)
  }

  // Accumulate role-specific profit per day + per network
  for (const t of currentPeriod) {
    const dateKey = new Date(t.created_at).toISOString().slice(0, 10)
    const entry = dailyMap.get(dateKey)
    if (entry) {
      const profitUsdt = computeRoleProfit(t, role)
      entry.usdt += profitUsdt

      // Per-network breakdown
      const treasury = treasuryMap.get(t.treasury_id)
      if (treasury?.network) {
        const sym = treasury.network.symbol.toLowerCase()
        if (sym in entry) {
          entry[sym] += profitUsdt
        }
      }

      // Compute PHP equivalent using the rate snapshot if available
      const rate = Number(
        t.usdt_to_php_rate_snapshot ||
          t.usdt_to_php_reference_rate_snapshot ||
          0
      )
      if (rate > 0) {
        entry.php += profitUsdt * rate
      }
    }
  }

  const chartData: DailyProfitPoint[] = Array.from(dailyMap.entries()).map(
    ([date, values]) => {
      const point: DailyProfitPoint = {
        date,
        usdt: Math.round(values.usdt * 1e6) / 1e6,
        php: Math.round(values.php * 100) / 100,
      }
      for (const ns of networkSeries) {
        point[ns.key] = Math.round((values[ns.key] || 0) * 1e6) / 1e6
      }
      return point
    }
  )

  // ── Recent transactions (latest 20) — profit shown is role-specific ──
  const recentRaw = allTransactions.slice(0, 20)
  const recentTransactions: RecentTransactionRow[] = recentRaw.map((t) => {
    const isFiatToCrypto = t.type === "fiat_to_crypto"
    const amountUsdt = Number(t.amount_usdt || 0)
    const amountPhp = Number(t.amount_php || 0)
    const txProfit = computeRoleProfit(t, role)

    // Map DB status to display status
    let displayStatus: "completed" | "pending" | "failed" = "pending"
    if (completedStatuses.includes(t.status)) {
      displayStatus = "completed"
    } else if (
      t.status === "pending" ||
      t.status === "confirmed" ||
      t.status === "processing"
    ) {
      displayStatus = "pending"
    }

    return {
      orderId: t.order_id || `#${t.id}`,
      type: isFiatToCrypto ? "Fiat → Crypto" : "Crypto → Fiat",
      status: displayStatus,
      received: isFiatToCrypto
        ? `${amountUsdt.toFixed(6)} USDT`
        : `₱${amountPhp.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sent: isFiatToCrypto
        ? `₱${amountPhp.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
        : `${amountUsdt.toFixed(6)} USDT`,
      profit: `${txProfit.toFixed(6)} USDT`,
      created: format(new Date(t.created_at), "MMM d, yyyy h:mm a"),
    }
  })

  return {
    stats: {
      totalRevenue: Math.round(currentRevenue * 1e6) / 1e6,
      totalRevenueChange: Math.round(revenueChange.change * 100) / 100,
      totalRevenueIsPositive: revenueChange.isPositive,
      totalMargin: Math.round(currentMargin * 1e6) / 1e6,
      totalMarginChange: Math.round(marginChange.change * 100) / 100,
      totalMarginIsPositive: marginChange.isPositive,
      profit: Math.round(currentProfit * 1e6) / 1e6,
      profitChange: Math.round(profitChange.change * 100) / 100,
      profitIsPositive: profitChange.isPositive,
      profitLabel,
      totalTransactions: currentCount,
      totalTransactionsChange: Math.round(txCountChange.change * 100) / 100,
      totalTransactionsIsPositive: txCountChange.isPositive,
      pendingCount: currentPending,
      pendingChange: Math.round(pendingChange.change * 100) / 100,
      pendingIsPositive: pendingChange.isPositive,
      completedCount: currentCompletedCount,
      completedChange: Math.round(completedChange.change * 100) / 100,
      completedIsPositive: completedChange.isPositive,
      latestTransactionDate,
    },
    chartData,
    networkSeries,
    recentTransactions,
  }
}
