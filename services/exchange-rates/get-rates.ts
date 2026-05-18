import { prisma } from "@/lib/prisma"

export async function getExchangeRates(params?: {
  q?: string;
  filter?: string;
  currency?: string;
  role?: string;
}) {
  const where: any = {}

  if (params?.filter === "active") where.is_active = true
  if (params?.filter === "inactive") where.is_active = false
  
  if (params?.currency) {
      where.pair = params.currency
  }

  if (params?.q) {
      where.pair = { contains: params.q, mode: "insensitive" }
  }

  const rates = await prisma.exchange_rates.findMany({
    where,
    orderBy: {
      created_at: 'desc',
    },
  })

  if (params?.role === "gic") {
    return rates.map((rate) => {
      // For USDT -> PHP
      const usdtToPhpSpinzoFee = Number(rate.usdt_to_php_spinzo_fee || 0);
      const usdtToPhpRef = Number(rate.usdt_to_php_reference_rate);
      const maskedUsdtToPhpRef = usdtToPhpRef - usdtToPhpSpinzoFee;
      const usdtToPhpGicFee = Number(rate.usdt_to_php_gic_fee || 0);
      
      const newUsdtToPhpSpreadPct = maskedUsdtToPhpRef > 0 
        ? (usdtToPhpGicFee / maskedUsdtToPhpRef) * 100 
        : 0;

      // For PHP -> USDT
      const phpToUsdtSpinzoFee = Number(rate.php_to_usdt_spinzo_fee || 0);
      const phpToUsdtRef = Number(rate.php_to_usdt_reference_rate);
      // Wait, is it ref * (1 - spinzo/100) or ref - spinzo? 
      // Our creation logic for PHP->USDT uses proportional: ref * (1 - (spinzo + gic)/100)
      // The guide says: "Shift the referenceRate down by the exact amount of the spinzoFee". 
      // Let's assume spinzo is a percentage for PHP->USDT, so the masked ref is: ref * (1 - spinzo/100)
      const maskedPhpToUsdtRef = phpToUsdtRef * (1 - phpToUsdtSpinzoFee / 100);
      const phpToUsdtGicFee = Number(rate.php_to_usdt_gic_fee || 0);
      const newPhpToUsdtSpreadPct = phpToUsdtGicFee; // since it's already a percentage

      return {
        ...rate,
        usdt_to_php_reference_rate: maskedUsdtToPhpRef as any,
        usdt_to_php_spinzo_fee: 0 as any,
        usdt_to_php_spread_percentage: newUsdtToPhpSpreadPct as any,
        // Wait, spread is also updated to only GIC fee
        usdt_to_php_spread: usdtToPhpGicFee as any,

        php_to_usdt_reference_rate: maskedPhpToUsdtRef as any,
        php_to_usdt_spinzo_fee: 0 as any,
        php_to_usdt_spread_percentage: newPhpToUsdtSpreadPct as any,
        // Proportional spread value in PHP
        php_to_usdt_spread: (maskedPhpToUsdtRef * (phpToUsdtGicFee / 100)) as any,
      }
    })
  }

  return rates
}
