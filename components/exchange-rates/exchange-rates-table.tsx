"use client"

import { type ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/data-table"

export interface ExchangeRate {
  id: string
  currencyPair: string
  usdtPhpRefRate: string
  usdtPhpFinalRate: string
  usdtPhpProfitSpread: string
  phpUsdtRefRate: string
  phpUsdtRate: string
  active: boolean
}

interface ExchangeRatesTableProps {
  data: ExchangeRate[]
}

const columns: ColumnDef<ExchangeRate>[] = [
  {
    accessorKey: "currencyPair",
    header: "CURRENCY PAIR",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("currencyPair")}</span>
    ),
  },
  {
    accessorKey: "usdtPhpRefRate",
    header: "USDT → PHP REFERENCE RATE",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("usdtPhpRefRate")}</span>
    ),
  },
  {
    accessorKey: "usdtPhpFinalRate",
    header: "USDT → PHP FINAL RATE",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("usdtPhpFinalRate")}</span>
    ),
  },
  {
    accessorKey: "usdtPhpProfitSpread",
    header: "USDT → PHP PROFIT / SPREAD",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("usdtPhpProfitSpread")}</span>
    ),
  },
  {
    accessorKey: "phpUsdtRefRate",
    header: "PHP → USDT REFERENCE RATE",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("phpUsdtRefRate")}</span>
    ),
  },
  {
    accessorKey: "phpUsdtRate",
    header: "PHP → USDT RATE",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("phpUsdtRate")}</span>
    ),
  },
  {
    accessorKey: "active",
    header: "ACTIVE",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean
      return (
        <span
          className={`text-xs font-medium ${
            active ? "text-[#83b047]" : "text-[#4e4e4e]"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </span>
      )
    },
  },
]

export function ExchangeRatesTable({ data }: ExchangeRatesTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No exchange rates in this period"
      pageSize={10}
    />
  )
}
