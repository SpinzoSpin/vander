import type { Metadata } from "next"
import { Suspense } from "react"
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"

import { NotifierTable, AddChatDialog, type NotifierChat } from "@/components/notifier/notifier-table"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Notifier Allowed List" }

export default async function Page() {
  const session = await auth()
  const role = (session?.user as any)?.role?.toLowerCase()

  // Guard: Only Admin role is allowed to view or edit the bot notifier allowlist
  if (role !== "admin") {
    redirect("/dashboard/operations/fiat-to-crypto")
  }

  // 1. Fetch statically configured environment IDs
  const envIds: string[] = []
  if (process.env.TELEGRAM_CHAT_ID) {
    const parsed = process.env.TELEGRAM_CHAT_ID.split(",")
      .map(id => id.trim())
      .filter(id => id.length > 0)
    envIds.push(...parsed)
  }

  // 2. Fetch dynamically configured database IDs
  const dbEntries = await prisma.telegram.findMany({
    orderBy: { created_at: "asc" }
  })
  const fileIds = dbEntries.map(entry => entry.chat_id)

  // 3. Map all values to display format
  const mappedData: NotifierChat[] = []

  // Add env IDs
  envIds.forEach((chatId, index) => {
    mappedData.push({
      id: `env-${index}-${chatId}`,
      chatId,
      source: "Static (Env)",
      status: "Active"
    })
  })

  // Add file IDs (ensure no duplicates)
  fileIds.forEach((chatId, index) => {
    if (!envIds.includes(chatId)) {
      mappedData.push({
        id: `file-${index}-${chatId}`,
        chatId,
        source: "Dynamic (Dashboard)",
        status: "Active"
      })
    }
  })

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 px-7.5">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-foreground dark:text-white">Notifier Allowed List</p>
              <p className="text-xs text-muted-foreground dark:text-[#848484] mt-0.5">
                Authorized Telegram users and groups that receive transaction alerts and have permission to confirm settlements.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AddChatDialog />
            </div>
          </div>

          {/* Table */}
          <Suspense fallback={
            <div className="text-sm text-muted-foreground py-4">Loading Telegram Allowed List...</div>
          }>
            <NotifierTable data={mappedData} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
