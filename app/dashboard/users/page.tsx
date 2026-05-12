import { Suspense } from "react"

import { ActionsContainer } from "@/components/actions-container"
import { UsersTable, type User } from "@/components/users"

const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "admin@spinzopay.com",
    roles: ["Admin", "Superuser"],
    updatedAt: "2026-05-12 10:00 AM",
    createdAt: "2026-01-01 08:00 AM",
  },
  {
    id: "2",
    email: "manager@spinzopay.com",
    roles: ["Manager"],
    updatedAt: "2026-05-10 02:30 PM",
    createdAt: "2026-02-15 11:20 AM",
  },
  {
    id: "3",
    email: "support@spinzopay.com",
    roles: ["Support"],
    updatedAt: "2026-05-11 09:15 AM",
    createdAt: "2026-03-20 01:45 PM",
  },
]

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 px-7.5">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-[#ededed]">Users List</p>
            <div className="flex items-center gap-3">
              <Suspense>
                <ActionsContainer
                  searchKey="q"
                  filterKey="filter"
                  currencyKey="role"
                  currencies={["ALL", "ADMIN", "MANAGER", "SUPPORT"]}
                />
              </Suspense>
            </div>
          </div>

          {/* Table */}
          <Suspense>
            <UsersTable data={MOCK_USERS} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
