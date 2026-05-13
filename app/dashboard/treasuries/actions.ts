"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"
import * as z from "zod"

export async function deleteTreasuryAction(id: string) {
  try {
    const treasuryId = parseInt(id, 10)

    await prisma.treasury.delete({
      where: { id: treasuryId }
    })

    logger.info({ id: treasuryId }, "Treasury deleted")
    revalidatePath("/dashboard/treasuries")

    return { success: true, message: "Treasury deleted successfully" }
  } catch (error: any) {
    logger.error({ err: error.message }, "Failed to delete treasury")
    return { success: false, message: "Failed to delete treasury" }
  }
}

const editTreasurySchema = z.object({
  id: z.coerce.number(),
  walletName: z.string().min(1, "Wallet name is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  networkId: z.coerce.number().min(1, "Network is required"),
  currentBalance: z.coerce.number().optional().default(0),
  privateKey: z.string().nullable().optional(),
})

export async function editTreasuryAction(prevState: any, formData: FormData) {
  try {
    const data = {
      id: formData.get("id"),
      walletName: formData.get("walletName"),
      walletAddress: formData.get("walletAddress"),
      networkId: formData.get("networkId"),
      currentBalance: formData.get("currentBalance") || 0,
      privateKey: formData.get("privateKey") || null,
    }

    const parsed = editTreasurySchema.parse(data)

    const result = await prisma.treasury.update({
      where: { id: parsed.id },
      data: {
        wallet_name: parsed.walletName,
        wallet_address: parsed.walletAddress,
        network_id: parsed.networkId,
        current_balance: parsed.currentBalance,
        private_key: parsed.privateKey,
      }
    })

    logger.info({ result }, "Edit results: ")

    revalidatePath("/dashboard/treasuries")

    return { success: true, message: "Treasury updated successfully" }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.info({ validationErr: error.message }, "zodValidation Errors")
      return { success: false, message: error.message }
    }
    return { success: false, message: "Failed to update treasury" }
  }
}
