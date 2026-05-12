import { Suspense } from "react"
import { ActionsContainer } from "@/components/actions-container"
import {
  ExchangeRatesTable,
  type ExchangeRate,
} from "@/components/exchange-rates"
import { Button } from "@/components/ui/button"

import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

const MOCK_DATA: ExchangeRate[] = [
  {
    id: "1",
    currencyPair: "USDT → PHP",
    usdtPhpRefRate: "58.20",
    usdtPhpFinalRate: "58.15",
    usdtPhpProfitSpread: "0.05",
    phpUsdtRefRate: "58.30",
    phpUsdtRate: "58.35",
    active: true,
  },
  {
    id: "2",
    currencyPair: "PHP → USDT",
    usdtPhpRefRate: "58.20",
    usdtPhpFinalRate: "58.15",
    usdtPhpProfitSpread: "0.05",
    phpUsdtRefRate: "58.30",
    phpUsdtRate: "58.35",
    active: false,
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
              Exchange Rates List
            </p>
            <div className="flex items-center gap-3">
              <Suspense>
                <ActionsContainer
                  searchKey="q"
                  filterKey="filter"
                  currencyKey="currency"
                />
              </Suspense>
              <Button variant="outline" asChild>
                <Link href={"/dashboard/exchange-rates/create"}>
                  Create New
                  <HugeiconsIcon icon={Add01Icon} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Table */}
          <Suspense>
            <ExchangeRatesTable data={MOCK_DATA} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
