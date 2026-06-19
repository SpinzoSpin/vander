import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { EditTreasuryForm } from "./edit-form"
import { auth } from "@/auth/auth"

export const metadata: Metadata = { title: "Edit Treasury" }

export default async function EditTreasuryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const role = (session?.user as any)?.role?.toLowerCase()

  if (role === "gic" || role === "lotto") {
    redirect("/dashboard/operations/fiat-to-crypto")
  }

  const resolvedParams = await params
  const treasuryId = parseInt(resolvedParams.id, 10)

  if (isNaN(treasuryId)) {
    notFound()
  }

  const [treasury, networks] = await Promise.all([
    prisma.treasury.findUnique({ where: { id: treasuryId } }),
    prisma.networks.findMany({ where: { is_active: true } })
  ])

  if (!treasury) {
    notFound()
  }

  // Serialize Prisma objects to primitive types before passing to Client Component
  const serializedNetworks = networks.map(n => ({
    id: n.id,
    name: n.name,
    symbol: n.symbol,
  }))

  const serializedTreasury = {
    id: treasury.id,
    walletName: treasury.wallet_name,
    walletAddress: treasury.wallet_address,
    networkId: treasury.network_id,
    currentBalance: treasury.current_balance ? treasury.current_balance.toString() : "0",
    privateKey: treasury.private_key || "",
  }

  return (
    <div className="flex flex-1 flex-col p-8 text-foreground dark:text-[#ededed]">
      <div className="mb-8 border-b border-border dark:border-[#282828] pb-4">
        <h1 className="text-xl font-semibold">Edit Treasury</h1>
        <p className="text-sm text-muted-foreground dark:text-[#4e4e4e] mt-1">Update wallet details.</p>
      </div>
      <EditTreasuryForm treasury={serializedTreasury} networks={serializedNetworks} />
    </div>
  )
}
