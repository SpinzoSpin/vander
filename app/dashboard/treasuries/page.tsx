import { Suspense } from "react"
import { ActionsContainer } from "@/components/actions-container"
import {
  TreasuriesTable,
  type Treasury,
} from "@/components/treasuries"
import { Button } from "@/components/ui/button"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { getTreasuries } from "@/services/treasuries/get-treasuries"
import { format } from "date-fns"

export default async function Page(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const filter = typeof searchParams.filter === 'string' ? searchParams.filter : undefined
  const currency = typeof searchParams.currency === 'string' ? searchParams.currency : undefined

  const dbTreasuries = await getTreasuries({ q, filter, currency })

  const mappedData: Treasury[] = dbTreasuries.map(t => ({
    id: t.id.toString(),
    walletName: t.wallet_name,
    walletAddress: t.wallet_address,
    network: t.network.name,
    currentBalance: t.current_balance?.toString() || "0.00",
    latestTransactionAt: t.latest_transaction_at ? format(new Date(t.latest_transaction_at), "MMM d, yyyy h:mm a") : "-",
  }))

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 px-7.5">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-[#ededed]">
              Treasuries List
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
                <Link href={"/dashboard/treasuries/create"}>
                  Create New
                  <HugeiconsIcon icon={Add01Icon} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Table */}
          <Suspense>
            <TreasuriesTable data={mappedData} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
