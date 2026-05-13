"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"
import * as z from "zod"

export async function deleteExchangeRateAction(id: string) {
  try {
    const rateId = parseInt(id, 10)
    
    await prisma.exchange_rates.delete({
      where: { id: rateId }
    })

    logger.info({ id: rateId }, "Exchange rate deleted")
    revalidatePath("/dashboard/exchange-rates")
    
    return { success: true, message: "Exchange rate deleted successfully" }
  } catch (error: any) {
    logger.error({ err: error.message }, "Failed to delete exchange rate")
    return { success: false, message: "Failed to delete exchange rate" }
  }
}

// Minimal schema for editing status, as full calculation logic is usually done in creation
// But if they want to edit rates manually, we need all fields
const editExchangeRateSchema = z.object({
  id: z.coerce.number(),
  usdtToPhpReferenceRate: z.coerce.number(),
  usdtToPhpRate: z.coerce.number(),
  usdtToPhpSpread: z.coerce.number(),
  usdtToPhpSpreadPercentage: z.coerce.number(),
  
  phpToUsdtReferenceRate: z.coerce.number(),
  phpToUsdtRate: z.coerce.number(),
  phpToUsdtSpread: z.coerce.number(),
  phpToUsdtSpreadPercentage: z.coerce.number(),
  
  isActive: z.boolean(),
})

export async function editExchangeRateAction(prevState: any, formData: FormData) {
  try {
    const data = {
      id: formData.get("id"),
      usdtToPhpReferenceRate: formData.get("usdtToPhpReferenceRate"),
      usdtToPhpRate: formData.get("usdtToPhpRate"),
      usdtToPhpSpread: formData.get("usdtToPhpSpread"),
      usdtToPhpSpreadPercentage: formData.get("usdtToPhpSpreadPercentage"),
      phpToUsdtReferenceRate: formData.get("phpToUsdtReferenceRate"),
      phpToUsdtRate: formData.get("phpToUsdtRate"),
      phpToUsdtSpread: formData.get("phpToUsdtSpread"),
      phpToUsdtSpreadPercentage: formData.get("phpToUsdtSpreadPercentage"),
      isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    }

    const parsed = editExchangeRateSchema.parse(data)

    const result = await prisma.exchange_rates.update({
      where: { id: parsed.id },
      data: {
        usdt_to_php_reference_rate: parsed.usdtToPhpReferenceRate,
        usdt_to_php_rate: parsed.usdtToPhpRate,
        usdt_to_php_spread: parsed.usdtToPhpSpread,
        usdt_to_php_spread_percentage: parsed.usdtToPhpSpreadPercentage,
        
        php_to_usdt_reference_rate: parsed.phpToUsdtReferenceRate,
        php_to_usdt_rate: parsed.phpToUsdtRate,
        php_to_usdt_spread: parsed.phpToUsdtSpread,
        php_to_usdt_spread_percentage: parsed.phpToUsdtSpreadPercentage,
        
        is_active: parsed.isActive,
      }
    })

    logger.info({ result }, "Exchange rate edited: ")

    revalidatePath("/dashboard/exchange-rates")
    
    return { success: true, message: "Exchange rate updated successfully" }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.info({ validationErr: error.message }, "zodValidation Errors")
      return { success: false, message: error.message }
    }
    return { success: false, message: "Failed to update exchange rate" }
  }
}
