"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { networkIcons } from "@web3icons/react"

import { DataTable } from "@/components/data-table"
import { Switch } from "@/components/ui/switch"

export interface Network {
  id: string
  networkName: string
  symbol: string
  networkType: string
  rpcUrl: string
  usdtContractAddress: string
  usdtDecimals: number
  gasFeeTokenName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface NetworksTableProps {
  data: Network[]
}

const columns: ColumnDef<Network>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue("id")}</span>
    ),
  },
  {
    accessorKey: "networkName",
    header: "NETWORK NAME",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("networkName")}</span>
    ),
  },
  {
    accessorKey: "symbol",
    header: "SYMBOL",
    cell: ({ row }) => {
      const symbol = row.getValue("symbol") as string
      const networkName = row.getValue("networkName") as string

      // Format the network name (e.g. "Binance Smart Chain" -> "BinanceSmartChain")
      const formattedName = networkName
        .split(/[- ]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("")

      // Dynamically get the Icon component from networkIcons
      const iconKey = `Network${formattedName}`
      const IconComponent = (networkIcons as any)[iconKey]

      return (
        <div className="flex items-center gap-2">
          {IconComponent ? (
            <IconComponent className="size-4 shrink-0" variant="branded" />
          ) : (
            <div className="size-4 shrink-0 rounded-full bg-white/10" />
          )}
          <span className="text-xs">{symbol}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "networkType",
    header: "NETWORK TYPE",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("networkType")}</span>
    ),
  },
  {
    accessorKey: "rpcUrl",
    header: "RPC URL",
    cell: ({ row }) => (
      <span className="block max-w-[150px] truncate text-xs">
        {row.getValue("rpcUrl")}
      </span>
    ),
  },
  {
    accessorKey: "usdtContractAddress",
    header: "USDT CONTRACT ADDRESS",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.getValue("usdtContractAddress")}
      </span>
    ),
  },
  {
    accessorKey: "usdtDecimals",
    header: "USDT DECIMALS",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("usdtDecimals")}</span>
    ),
  },
  {
    accessorKey: "gasFeeTokenName",
    header: "GAS FEE TOKEN",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("gasFeeTokenName")}</span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "IS ACTIVE",
    cell: ({ row }) => {
      const active = row.getValue("isActive") as boolean
      return (
        <div className="flex items-center">
          <Switch checked={active} />
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "CREATED AT",
    cell: ({ row }) => (
      <span className="text-xs text-[#4e4e4e]">
        {row.getValue("createdAt")}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "UPDATED AT",
    cell: ({ row }) => (
      <span className="text-xs text-[#4e4e4e]">
        {row.getValue("updatedAt")}
      </span>
    ),
  },
]

export function NetworksTable({ data }: NetworksTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No networks configured"
      pageSize={10}
    />
  )
}
