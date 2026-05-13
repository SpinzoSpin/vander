"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"

import { TransactionStatusChip } from "@/components/operations/transaction-status-chip"
import { Button } from "@/components/ui/button"
import { UploadInvoiceModal } from "@/components/operations/upload-invoice-modal"

import { DataTable } from "../data-table"

export interface OfframpTransaction {
  id: string
  orderId: string
  type: string
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "complete"
    | "fiat_arrival"
    | "crypto_arrival"
  totalAmountSent: string
  totalReceived: string
  profitUsdt: string
  profitPercentage: string
  targetAddress: string
  txHash: string
  createdAt: string
}

const columns: ColumnDef<OfframpTransaction>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue("id")}</span>
    ),
  },
  {
    accessorKey: "orderId",
    header: "ORDER ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-[#4e4e4e]">
        {(row.getValue("orderId") as string).slice(0, 8)}...
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "STATUS",
    cell: ({ row }) => (
      <TransactionStatusChip status={row.getValue("status") as string} />
    ),
  },
  {
    accessorKey: "totalAmountSent",
    header: "TOTAL AMOUNT SENT",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("totalAmountSent")}</span>
    ),
  },
  {
    accessorKey: "totalReceived",
    header: "TOTAL RECEIVED",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("totalReceived")}</span>
    ),
  },
  {
    accessorKey: "profitUsdt",
    header: "PROFIT ( USDT )",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("profitUsdt")}</span>
    ),
  },
  {
    accessorKey: "profitPercentage",
    header: "PROFIT PERCENTAGE",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("profitPercentage")}</span>
    ),
  },
  {
    id: "confirmAsSendingAction",
    header: "CONFIRM AS SENDING",
    cell: ({ row }) => (
      <UploadInvoiceModal transactionId={row.original.id}>
        <Button
          variant="outline"
          size="xs"
          id={`upload-invoice-${row.original.id}`}
        >
          Upload Invoice
        </Button>
      </UploadInvoiceModal>
    ),
  },
]

interface OfframpTableProps {
  data?: OfframpTransaction[]
}

export function OfframpTable({ data: initialData = [] }: OfframpTableProps) {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""
  const filter = searchParams.get("filter") || ""
  const currency = searchParams.get("currency") || ""

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", "crypto_to_fiat", q, filter, currency],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("type", "crypto_to_fiat")
      if (q) params.append("q", q)
      if (filter) params.append("filter", filter)
      if (currency) params.append("currency", currency)

      const res = await fetch(`/api/transactions?${params.toString()}`)
      const json = await res.json()
      return json.data as OfframpTransaction[]
    },
    initialData: initialData.length > 0 ? initialData : undefined,
  })

  return (
    <DataTable
      columns={columns}
      data={data || []}
      emptyMessage={
        isLoading ? "Loading transactions..." : "No transactions in this period"
      }
      pageSize={10}
    />
  )
}
