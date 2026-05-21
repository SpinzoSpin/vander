import type { Metadata } from "next"
import { Suspense } from "react"
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"

import { ActionsContainer } from "@/components/actions-container"
import { UsersTable, type User } from "@/components/users"
import { Button } from "@/components/ui/button"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { getUsers } from "@/services/users/get-users"

export const metadata: Metadata = { title: "Users" }

export default async function Page(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth()
  const role = (session?.user as any)?.role?.toLowerCase()

  if (role === "gic" || role === "lotto") {
    redirect("/dashboard/operations/fiat-to-crypto")
  }

  const searchParams = await props.searchParams
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const filterRole = typeof searchParams.role === 'string' ? searchParams.role : undefined

  const dbUsers = await getUsers({ q, role: filterRole })

  const mappedData: User[] = dbUsers.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    apiKey: u.apiKey ?? undefined,
    updatedAt: format(new Date(u.updatedAt), "MMM d, yyyy h:mm a"),
    createdAt: format(new Date(u.createdAt), "MMM d, yyyy h:mm a"),
  }))

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 px-7.5">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-foreground dark:text-white">Users List</p>
            <div className="flex items-center gap-3">
              <Suspense>
                <ActionsContainer
                  searchKey="q"
                  filterKey="filter"
                  currencyKey="role"
                  currencies={["ALL", "ADMIN", "GIC", "LOTTO", "ARCA", "USER"]}
                />
              </Suspense>
              {role === "admin" && (
                <Button variant="outline" asChild>
                  <Link href={"/dashboard/users/create"}>
                    Create New
                    <HugeiconsIcon icon={Add01Icon} />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <Suspense>
            <UsersTable data={mappedData} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
