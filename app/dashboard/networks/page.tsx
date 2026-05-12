import { Suspense } from "react"
import { ActionsContainer } from "@/components/actions-container"
import { NetworksTable, type Network } from "@/components/networks"
import { Button } from "@/components/ui/button"

import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

const MOCK_NETWORKS: Network[] = [
  {
    id: "1",
    networkName: "Tron",
    symbol: "TRX",
    networkType: "Mainnet",
    rpcUrl: "https://api.trongrid.io",
    usdtContractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    usdtDecimals: 6,
    gasFeeTokenName: "TRX",
    isActive: true,
    createdAt: "2026-01-01 10:00 AM",
    updatedAt: "2026-05-12 11:00 AM",
  },
  {
    id: "2",
    networkName: "Ethereum",
    symbol: "ETH",
    networkType: "Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR-PROJECT-ID",
    usdtContractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdtDecimals: 6,
    gasFeeTokenName: "ETH",
    isActive: false,
    createdAt: "2026-02-15 08:30 AM",
    updatedAt: "2026-05-10 09:15 AM",
  },
]

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 px-7.5">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-[#ededed]">
              Available Chain Networks
            </p>
            <div className="flex items-center gap-3">
              <Suspense>
                <ActionsContainer
                  searchKey="q"
                  filterKey="filter"
                  currencyKey="network"
                  currencies={["ALL", "TRON", "ETHEREUM"]}
                />
              </Suspense>
              <Button variant="outline" asChild>
                {/* Note: User may want a different create page, leaving existing link for now */}
                <Link href={"/dashboard/networks/create"}>
                  Create New
                  <HugeiconsIcon icon={Add01Icon} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Table */}
          <Suspense>
            <NetworksTable data={MOCK_NETWORKS} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
