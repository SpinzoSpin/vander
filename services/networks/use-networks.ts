import { useQuery } from "@tanstack/react-query"
import { TGetNetworkByStatusSchema } from "./dto-network"
import { Network } from "@/components/networks/networks-table"

// Represents the standard ApiResponse wrapper we created
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// Represents the data structure returned by getNetworks
export interface PaginatedNetworks {
  data: Network[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function useNetworks(params: TGetNetworkByStatusSchema, initialData?: PaginatedNetworks) {
  return useQuery({
    queryKey: ["networks", params],
    queryFn: async () => {
      // Build the query string
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set("page", params.page.toString())
      if (params.limit) searchParams.set("limit", params.limit.toString())
      if (params.offset) searchParams.set("offset", params.offset.toString())
      if (params.filterBy) searchParams.set("filterBy", params.filterBy)

      const response = await fetch(`/api/networks?${searchParams.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch networks")
      }
      
      const json = (await response.json()) as ApiResponse<PaginatedNetworks>
      return json.data
    },
    initialData, // Allows server-side prefetching hydration
  })
}
