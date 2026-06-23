import { prisma } from "@/lib/prisma"
import { fetchOnchainBalance } from "@/lib/onchain-balance"
import { Prisma } from "@/generated/prisma/client"

export async function getTreasuries(params?: {
  q?: string;
  filter?: string;
  currency?: string;
}) {
  const where: any = {}

  if (params?.currency) {
      where.network = {
        symbol: params.currency
      }
  }

  if (params?.q) {
      where.OR = [
        { wallet_name: { contains: params.q, mode: "insensitive" } },
        { wallet_address: { contains: params.q, mode: "insensitive" } }
      ]
  }

  const treasuries = await prisma.treasury.findMany({
    where,
    include: {
        network: true
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  // Dynamically fetch balance from on-chain and update the DB/memory
  const updatedTreasuries = await Promise.all(
    treasuries.map(async (t) => {
      if (!t.network.rpc_url || !t.network.usdt_contract_address) {
        return t;
      }

      const onchainBalance = await fetchOnchainBalance({
        rpcUrl: t.network.rpc_url,
        walletAddress: t.wallet_address,
        usdtContractAddress: t.network.usdt_contract_address,
        usdtDecimals: Number(t.network.usdt_decimals),
        networkSymbol: t.network.symbol,
        networkCategory: t.network.network_category,
        networkName: t.network.name,
      });

      if (onchainBalance !== null) {
        try {
          await prisma.treasury.update({
            where: { id: t.id },
            data: { current_balance: onchainBalance },
          });
          t.current_balance = new Prisma.Decimal(onchainBalance);
        } catch (dbError) {
          console.error(`Failed to update database balance for treasury ${t.id}:`, dbError);
        }
      }

      return t;
    })
  );

  return updatedTreasuries;
}
