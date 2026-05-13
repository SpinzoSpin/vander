"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

const createTreasurySchema = z.object({
  walletName: z.string().min(1, "Wallet name is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  networkId: z.coerce.number().min(1, "Network is required"),
  currentBalance: z.coerce.number().optional().default(0),
  privateKey: z.string().nullable().optional(),
})

export async function createTreasuryAction(prevState: any, formData: FormData) {
  try {
    const data = {
      walletName: formData.get("walletName"),
      walletAddress: formData.get("walletAddress"),
      networkId: formData.get("networkId"),
      currentBalance: formData.get("currentBalance") || 0,
      privateKey: formData.get("privateKey") || null,
    }

    const parsed = createTreasurySchema.parse(data)

    const result = await prisma.treasury.create({
      data: {
        wallet_name: parsed.walletName,
        wallet_address: parsed.walletAddress,
        network_id: parsed.networkId,
        current_balance: parsed.currentBalance,
        private_key: parsed.privateKey,
      }
    })

    logger.info({ result }, "Creation results: ")

    revalidatePath("/dashboard/treasuries")

    return { success: true, message: "Treasury created successfully" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.info({ validationErr: error.message }, "zodValidation Errors")
      return { success: false, message: error.message }
    }
    return { success: false, message: "Failed to create treasury" }
  }
}
