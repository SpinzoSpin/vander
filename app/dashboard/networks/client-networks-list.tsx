"use client"

import { useSearchParams } from "next/navigation"
import { NetworksTable } from "@/components/networks"
import { PaginatedNetworks, useNetworks } from "@/services/networks/use-networks"
import { TGetNetworkByStatusSchema } from "@/services/networks/dto-network"
import { useMemo } from "react"

interface ClientNetworksListProps {
  initialData: PaginatedNetworks
}

export function ClientNetworksList({ initialData }: ClientNetworksListProps) {
  const searchParams = useSearchParams()

  // Extract params from URL, defaulting to the same standard defaults
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10
  const filterByRaw = searchParams.get("filter") || "all"
  
  // Cast filterBy securely
  const filterBy = ["all", "active", "disable"].includes(filterByRaw) 
    ? (filterByRaw as TGetNetworkByStatusSchema["filterBy"]) 
    : "all"

  // Fetch data using React Query with the initial data provided by the server
  const { data, isLoading } = useNetworks(
    { page, limit, offset: 0, filterBy },
    initialData
  )

  // Fallback to initial data if the query hasn't resolved yet
  const networks = data?.data || initialData.data

  return (
    <div className="flex flex-col gap-4">
      <div className={`${isLoading ? "opacity-50 pointer-events-none transition-opacity" : ""}`}>
        {/* We map the backend data model to the Network UI model if necessary, 
            but based on the schema they seem very similar or identical */}
        <NetworksTable data={networks as any} />
      </div>
      
      {/* Basic Pagination Meta Display */}
      <div className="flex items-center justify-between px-2 py-4 text-xs text-[#888888]">
        <div>
          Showing {networks.length} records.
        </div>
        <div>
          Page {data?.meta.page || 1} of {data?.meta.totalPages || 1} 
          <span className="mx-2">•</span> 
          Total: {data?.meta.total || 0}
        </div>
      </div>
    </div>
  )
}
