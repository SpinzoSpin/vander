"use client"

import { type ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/data-table"

export interface User {
  id: string
  email: string
  roles: string[]
  updatedAt: string
  createdAt: string
}

interface UsersTableProps {
  data: User[]
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "EMAIL",
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("email")}</span>
    ),
  },
  {
    accessorKey: "roles",
    header: "ROLES",
    cell: ({ row }) => {
      const roles = row.getValue("roles") as string[]
      return (
        <span className="text-xs">
          {roles.join(", ")}
        </span>
      )
    },
  },
  {
    accessorKey: "updatedAt",
    header: "UPDATED AT",
    cell: ({ row }) => (
      <span className="text-xs text-[#4e4e4e]">{row.getValue("updatedAt")}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "CREATED AT",
    cell: ({ row }) => (
      <span className="text-xs text-[#4e4e4e]">{row.getValue("createdAt")}</span>
    ),
  },
  {
    id: "action",
    header: "ACTION",
    cell: ({ row }) => (
      <span className="text-xs font-medium cursor-pointer text-[#ededed] hover:text-[#83b047] transition-colors">
        Edit
      </span>
    ),
  },
]

export function UsersTable({ data }: UsersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No users in this period"
      pageSize={10}
    />
  )
}
