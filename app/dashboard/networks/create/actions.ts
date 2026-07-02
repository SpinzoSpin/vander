"use server"

import { auth } from "@/auth/auth"
import { logger } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { createNetwork } from "@/services/networks/create-network"
import { CreateNetworkSchema } from "@/services/networks/dto-network"
import { z } from "zod"

export async function createNetworkAction(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized" }
    }
    const role = (session.user as any).role?.toLowerCase()
    if (role !== "admin") {
      return { success: false, message: "Forbidden: Admins only" }
    }

    const rawIsActive = formData.get("isActive")
    const isActive = rawIsActive === "true" || rawIsActive === "on" || rawIsActive === "1"

    const rawCurrencyDecimals = formData.get("currencyDecimals")
    const currencyDecimals = rawCurrencyDecimals ? Number(rawCurrencyDecimals) : 6

    const data = {
      name: (formData.get("name") as string)?.trim() || "",
      symbol: (formData.get("symbol") as string)?.trim() || "",
      type: ((formData.get("type") as string)?.toLowerCase().trim() || "mainnet") as "mainnet" | "testnet",
      rpcUrl: (formData.get("rpcUrl") as string)?.trim() || "",
      contractAddress: (formData.get("contractAddress") as string)?.trim() || "",
      currencyDecimals,
      feeToken: (formData.get("feeToken") as string)?.trim() || "",
      isActive,
    }

    const parsed = CreateNetworkSchema.safeParse(data)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Validation error"
      return { success: false, message: issue }
    }

    const result = await createNetwork(parsed.data)

    if (!result) {
      return { success: false, message: "Failed to create network" }
    }

    logger.info({ result }, "Network created successfully")

    revalidatePath("/dashboard/networks")

    return { success: true, message: "Network created successfully" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0]?.message || "Validation error" }
    }
    return { success: false, message: "An unexpected error occurred" }
  }
}
