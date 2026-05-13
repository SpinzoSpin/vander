import { prisma } from "@/lib/prisma"
import { CreateTreasuryForm } from "./create-form"

export default async function CreateTreasuryPage() {
  const networks = await prisma.networks.findMany({
    where: { is_active: true }
  })

  // Serialize Prisma Decimal objects to primitive types before passing to Client Component
  const serializedNetworks = networks.map(n => ({
    id: n.id,
    name: n.name,
    symbol: n.symbol,
  }))

  return (
    <div className="flex flex-1 flex-col p-8 text-[#ededed]">
      <div className="mb-8 border-b border-[#282828] pb-4">
        <h1 className="text-xl font-semibold">Create New Treasury</h1>
        <p className="text-sm text-[#4e4e4e] mt-1">Add a new wallet to the Spinzopay ecosystem.</p>
      </div>
      <CreateTreasuryForm networks={serializedNetworks} />
    </div>
  )
}
