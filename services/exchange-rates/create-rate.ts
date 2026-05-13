import { prisma } from "@/lib/prisma"
import { GIC_MARKUP_RATE, SPINZO_MARKUP_RATE } from "@/constants"
import { ApiError } from "@/lib/api-response"

const API_URL = process.env.EXCHANGE_RATE_API_URL || 'https://v6.exchangerate-api.com/v6'
const API_KEY = process.env.EXCHANGE_RATE_API_KEY

async function getPhpToUsdRate(): Promise<number> {
    if (!API_KEY) {
        throw new ApiError('EXCHANGE_RATE_API_KEY is not configured in environment variables', 500)
    }

    const url = `${API_URL}/${API_KEY}/pair/PHP/USD`

    const response = await fetch(url)
    if (!response.ok) {
        throw new ApiError(`Exchange rate API error: ${response.status} ${response.statusText}`, 502)
    }

    const data = await response.json()
    if (data.result !== 'success') {
        throw new ApiError(`Exchange rate API error: ${data['error-type'] || 'Unknown error'}`, 502)
    }

    return data.conversion_rate
}

const roundToSixDecimals = (value: number) => Math.round(value * 1000000) / 1000000
const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100

export interface ManualRates {
    usdtToPhpReferenceRate: number;
    usdtToPhpRate: number;
    usdtToPhpSpread: number;
    usdtToPhpSpreadPercentage: number;
    phpToUsdtReferenceRate: number;
    phpToUsdtRate: number;
    phpToUsdtSpread: number;
    phpToUsdtSpreadPercentage: number;
    isActive: boolean;
}

export async function createExchangeRate(manualRates?: ManualRates) {
    if (manualRates) {
        if (manualRates.isActive) {
            await prisma.exchange_rates.updateMany({
                where: { is_active: true },
                data: { is_active: false }
            })
        }

        const newRate = await prisma.exchange_rates.create({
            data: {
                pair: "USDT/PHP",
                usdt_to_php_reference_rate: manualRates.usdtToPhpReferenceRate,
                usdt_to_php_rate: manualRates.usdtToPhpRate,
                usdt_to_php_spread: manualRates.usdtToPhpSpread,
                usdt_to_php_spread_percentage: manualRates.usdtToPhpSpreadPercentage,
                php_to_usdt_reference_rate: manualRates.phpToUsdtReferenceRate,
                php_to_usdt_rate: manualRates.phpToUsdtRate,
                php_to_usdt_spread: manualRates.phpToUsdtSpread,
                php_to_usdt_spread_percentage: manualRates.phpToUsdtSpreadPercentage,
                is_active: manualRates.isActive
            }
        })
        return newRate
    }

    // 1. Fetch live market rate (PHP -> USD/USDT)
    const phpToUsdtReferenceRate = await getPhpToUsdRate()
    const usdtToPhpReferenceRate = roundToSixDecimals(1 / phpToUsdtReferenceRate)

    // 2. Load markup rates from constants (e.g. 0.2 means 0.2%)
    const gicMarkupPct = Number(GIC_MARKUP_RATE || 0)
    const spinzoMarkupPct = Number(SPINZO_MARKUP_RATE || 0)

    // 3. Compute Fiat to Crypto (PHP -> USDT) - Uses GIC markup
    // Buying USDT: user gets LESS USDT per PHP than market (platform keeps margin)
    const phpToUsdtRate = roundToSixDecimals(phpToUsdtReferenceRate * (1 - (gicMarkupPct / 100)))
    const phpToUsdtDiff = Math.abs(phpToUsdtReferenceRate - phpToUsdtRate)
    const phpToUsdtSpread = roundToSixDecimals(phpToUsdtDiff)
    const phpToUsdtSpreadPercentage = roundToTwoDecimals(
        phpToUsdtReferenceRate > 0 ? (phpToUsdtDiff / phpToUsdtReferenceRate) * 100 : 0
    )

    // 4. Compute Crypto to Fiat (USDT -> PHP) - Uses SPINZO markup
    // Selling USDT: user gets LESS PHP than market (discount for platform)
    const usdtToPhpRate = roundToSixDecimals(usdtToPhpReferenceRate * (1 - (spinzoMarkupPct / 100)))
    const usdtToPhpDiff = Math.abs(usdtToPhpReferenceRate - usdtToPhpRate)
    const usdtToPhpSpread = roundToSixDecimals(usdtToPhpDiff)
    const usdtToPhpSpreadPercentage = roundToTwoDecimals(
        usdtToPhpReferenceRate > 0 ? (usdtToPhpDiff / usdtToPhpReferenceRate) * 100 : 0
    )

    // 5. Invalidate older active rates
    await prisma.exchange_rates.updateMany({
        where: { is_active: true },
        data: { is_active: false }
    })

    // 6. Save the newly calculated rate
    const newRate = await prisma.exchange_rates.create({
        data: {
            pair: "USDT/PHP",
            usdt_to_php_reference_rate: usdtToPhpReferenceRate,
            usdt_to_php_rate: usdtToPhpRate,
            usdt_to_php_spread: usdtToPhpSpread,
            usdt_to_php_spread_percentage: usdtToPhpSpreadPercentage,
            php_to_usdt_reference_rate: phpToUsdtReferenceRate,
            php_to_usdt_rate: phpToUsdtRate,
            php_to_usdt_spread: phpToUsdtSpread,
            php_to_usdt_spread_percentage: phpToUsdtSpreadPercentage,
            is_active: true
        }
    })

    return newRate
}