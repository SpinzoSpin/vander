"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth/auth";

export async function getPendingCounts() {
  const session = await auth();
  if (!session?.user) return { fiatToCrypto: 0, cryptoToFiat: 0 };

  try {
    const fiatToCrypto = await prisma.transactions.count({
      where: { type: "fiat_to_crypto", status: "pending" }
    });

    const cryptoToFiat = await prisma.transactions.count({
      where: { type: "crypto_to_fiat", status: "pending" }
    });

    return { fiatToCrypto, cryptoToFiat };
  } catch (error) {
    return { fiatToCrypto: 0, cryptoToFiat: 0 };
  }
}
