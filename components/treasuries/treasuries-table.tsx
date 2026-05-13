"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons"
import { deleteTreasuryAction } from "@/app/dashboard/treasuries/actions"
import { toast } from "sonner"

export interface Treasury {
  id: string
  walletName: string
  walletAddress: string
  network: string
  currentBalance: string
  latestTransactionAt: string
}

interface TreasuriesTableProps {
  data: Treasury[]
}

const columns: ColumnDef<Treasury>[] = [
  {
    accessorKey: "walletName",
    header: "WALLET NAME OR IDENTIFIER",
    cell: ({ row }) => (
      <span className="text-xs font-medium text-[#ededed]">
        {row.getValue("walletName")}
      </span>
    ),
  },
  {
    accessorKey: "walletAddress",
    header: "WALLET ADDRESS",
    cell: ({ row }) => (
      <span className="text-xs text-[#4e4e4e]">
        {row.getValue("walletAddress")}
      </span>
    ),
  },
  {
    accessorKey: "network",
    header: "NETWORK",
    cell: ({ row }) => (
      <span className="text-xs text-[#4e4e4e]">
        {row.getValue("network")}
      </span>
    ),
  },
  {
    accessorKey: "currentBalance",
    header: "CURRENT BALANCE",
    cell: ({ row }) => {
      const amount = row.getValue("currentBalance") as string
      return <span className="text-xs font-medium text-[#ededed]">{amount}</span>
    },
  },
  {
    accessorKey: "latestTransactionAt",
    header: "LATEST TRANSACTION AT",
    cell: ({ row }) => (
      <span className="text-xs text-[#4e4e4e]">
        {row.getValue("latestTransactionAt")}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <TreasuryActions row={row} />,
  },
]

function TreasuryActions({ row }: { row: any }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const treasury = row.original as Treasury

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete treasury "${treasury.walletName}"?`)) {
      const res = await deleteTreasuryAction(treasury.id)
      if (res.success) {
        toast.success(res.message)
        queryClient.invalidateQueries({ queryKey: ["treasuries"] })
      } else {
        toast.error(res.message)
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/dashboard/treasuries/${treasury.id}/edit`)}>
          Edit Treasury
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-500">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TreasuriesTable({ data: initialData }: TreasuriesTableProps) {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""
  const filter = searchParams.get("filter") || ""
  const currency = searchParams.get("currency") || ""

  const { data, isLoading } = useQuery({
    queryKey: ["treasuries", q, filter, currency],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (q) params.append("q", q)
      if (filter) params.append("filter", filter)
      if (currency) params.append("currency", currency)
      
      const res = await fetch(`/api/treasuries?${params.toString()}`)
      const json = await res.json()
      return json.data as Treasury[]
    },
    initialData,
  })

  return (
    <DataTable
      columns={columns}
      data={data || []}
      emptyMessage={isLoading ? "Loading treasuries..." : "No treasuries in this period"}
      pageSize={10}
    />
  )
}
