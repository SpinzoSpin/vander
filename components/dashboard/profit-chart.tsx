"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

import type { NetworkSeries } from "@/services/transactions/get-dashboard-stats"

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ProfitDataPoint {
  date: string
  usdt: number
  php: number
  [networkSymbol: string]: number | string
}

interface ProfitChartProps {
  data?: ProfitDataPoint[]
  networkSeries?: NetworkSeries[]
  className?: string
}

// ─── Placeholder data (zeros while real data loads) ──────────────────────────
const PLACEHOLDER_DATA: ProfitDataPoint[] = Array.from(
  { length: 7 },
  (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
    usdt: 0,
    php: 0,
  })
)

const TOTAL_COLOR = "#83b047"

// ─── Network toggle pill ─────────────────────────────────────────────────────
function NetworkToggle({
  label,
  color,
  active,
  onToggle,
}: {
  label: string
  color: string
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        active
          ? "border-transparent bg-white/[0.06] text-[#ededed]"
          : "border-[#2e2e2e] bg-transparent text-[#4e4e4e]"
      )}
    >
      <span
        className={cn(
          "block size-2 shrink-0 rounded-full transition-opacity",
          !active && "opacity-30"
        )}
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ProfitChart({
  data = PLACEHOLDER_DATA,
  networkSeries = [],
  className,
}: ProfitChartProps) {
  // "total" is always available; each network is toggleable
  const [activeNetworks, setActiveNetworks] = useState<Set<string>>(new Set())
  const [showTotal, setShowTotal] = useState(true)

  const toggleNetwork = (key: string) => {
    setActiveNetworks((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Build dynamic chart config
  const chartConfig: ChartConfig = {
    usdt: { label: "Total Profit", color: TOTAL_COLOR },
  }
  for (const ns of networkSeries) {
    chartConfig[ns.key] = { label: ns.label, color: ns.color }
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 rounded-lg border p-4",
        "border-[#2e2e2e] bg-[#121212]",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base font-semibold text-[#ededed]">
          Daily Profit Breakdown
        </p>

        {/* Network filter toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <NetworkToggle
            label="Total"
            color={TOTAL_COLOR}
            active={showTotal}
            onToggle={() => setShowTotal((p) => !p)}
          />
          {networkSeries.map((ns) => (
            <NetworkToggle
              key={ns.key}
              label={ns.label}
              color={ns.color}
              active={activeNetworks.has(ns.key)}
              onToggle={() => toggleNetwork(ns.key)}
            />
          ))}
        </div>
      </div>

      {/* Chart */}
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            {/* Total gradient */}
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={TOTAL_COLOR} stopOpacity={0.15} />
              <stop offset="95%" stopColor={TOTAL_COLOR} stopOpacity={0} />
            </linearGradient>
            {/* Per-network gradients */}
            {networkSeries.map((ns) => (
              <linearGradient
                key={ns.key}
                id={`grad-${ns.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={ns.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={ns.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="#2e2e2e"
            strokeDasharray="4 4"
          />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#4e4e4e", fontSize: 10 }}
            tickFormatter={(v: string) =>
              new Date(v).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
            interval="preserveStartEnd"
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#4e4e4e", fontSize: 10 }}
            tickFormatter={(v: number) => v.toFixed(2)}
            width={40}
          />

          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                }
              />
            }
          />

          {/* Total area (always on top for reference) */}
          {showTotal && (
            <Area
              type="monotone"
              dataKey="usdt"
              stroke={TOTAL_COLOR}
              strokeWidth={1.5}
              fill="url(#gradTotal)"
              dot={false}
              activeDot={{ r: 4, fill: TOTAL_COLOR }}
            />
          )}

          {/* Per-network areas */}
          {networkSeries.map(
            (ns) =>
              activeNetworks.has(ns.key) && (
                <Area
                  key={ns.key}
                  type="monotone"
                  dataKey={ns.key}
                  stroke={ns.color}
                  strokeWidth={1.5}
                  fill={`url(#grad-${ns.key})`}
                  dot={false}
                  activeDot={{ r: 4, fill: ns.color }}
                />
              )
          )}
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
