import { prisma } from "@/lib/prisma"
import { GIC_MARKUP_RATE, SPINZO_MARKUP_RATE } from "@/constants"
import { ApiError } from "@/lib/api-response"

export async function getPhpToUsdRate(): Promise<number> {
    const url = 'https://api.pro.coins.ph/openapi/quote/v1/ticker/price?symbol=USDTPHP'

    const response = await fetch(url)
    if (!response.ok) {
        throw new ApiError(`Coins.ph API error: ${response.status} ${response.statusText}`, 502)
    }

    const data = await response.json()
    if (!data || typeof data.price !== 'string') {
        throw new ApiError(`Invalid response format from Coins.ph API`, 502)
    }

    const usdtToPhpRate = Number(data.price)
    if (isNaN(usdtToPhpRate) || usdtToPhpRate <= 0) {
        throw new ApiError(`Invalid price value from Coins.ph API: ${data.price}`, 502)
    }

    // Convert 1 USDT / PHP rate to 1 PHP / USDT rate
    return 1 / usdtToPhpRate
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
    usdtToPhpSpinzoFee: number;
    usdtToPhpGicFee: number;
    phpToUsdtSpinzoFee: number;
    phpToUsdtGicFee: number;
    isActive: boolean;
}

export async function createExchangeRate(manualRates?: ManualRates) {
    const existingRate = await prisma.exchange_rates.findFirst()

    if (manualRates) {
        const rateData = {
            pair: "USDT/PHP",
            usdt_to_php_reference_rate: manualRates.usdtToPhpReferenceRate,
            usdt_to_php_rate: manualRates.usdtToPhpRate,
            usdt_to_php_spread: manualRates.usdtToPhpSpread,
            usdt_to_php_spread_percentage: manualRates.usdtToPhpSpreadPercentage,
            php_to_usdt_reference_rate: manualRates.phpToUsdtReferenceRate,
            php_to_usdt_rate: manualRates.phpToUsdtRate,
            php_to_usdt_spread: manualRates.phpToUsdtSpread,
            php_to_usdt_spread_percentage: manualRates.phpToUsdtSpreadPercentage,
            usdt_to_php_spinzo_fee: manualRates.usdtToPhpSpinzoFee,
            usdt_to_php_gic_fee: manualRates.usdtToPhpGicFee,
            php_to_usdt_spinzo_fee: manualRates.phpToUsdtSpinzoFee,
            php_to_usdt_gic_fee: manualRates.phpToUsdtGicFee,
            is_active: manualRates.isActive
        }

        if (existingRate) {
            return await prisma.exchange_rates.update({
                where: { id: existingRate.id },
                data: rateData
            })
        } else {
            return await prisma.exchange_rates.create({
                data: rateData
            })
        }
    }

    // 1. Fetch live market rate (PHP -> USD/USDT)
    const phpToUsdtReferenceRate = await getPhpToUsdRate()
    const usdtToPhpReferenceRate = roundToSixDecimals(1 / phpToUsdtReferenceRate)

    // 2. Load markup rates from constants (representing fixed PHP fee per USDT)
    const gicFee = Number(GIC_MARKUP_RATE || 0)
    const spinzoFee = Number(SPINZO_MARKUP_RATE || 0)

    // 3. Compute Fiat to Crypto (PHP -> USDT)
    // Buying USDT: user gets LESS USDT per PHP than market. Fee is in PHP.
    const phpToUsdtSpinzoRate = spinzoFee / (usdtToPhpReferenceRate * usdtToPhpReferenceRate)
    const phpToUsdtGicRate = gicFee / (usdtToPhpReferenceRate * usdtToPhpReferenceRate)
    const phpToUsdtRate = roundToSixDecimals(phpToUsdtReferenceRate - phpToUsdtSpinzoRate - phpToUsdtGicRate)
    const phpToUsdtDiff = Math.abs(phpToUsdtReferenceRate - phpToUsdtRate)
    const phpToUsdtSpread = roundToSixDecimals(phpToUsdtDiff)
    const phpToUsdtSpreadPercentage = roundToTwoDecimals(
        phpToUsdtReferenceRate > 0 ? (phpToUsdtDiff / phpToUsdtReferenceRate) * 100 : 0
    )

    // 4. Compute Crypto to Fiat (USDT -> PHP)
    // Selling USDT: user gets LESS PHP than market. Fee is in PHP.
    const usdtToPhpRate = roundToSixDecimals(usdtToPhpReferenceRate - spinzoFee - gicFee)
    const usdtToPhpDiff = Math.abs(usdtToPhpReferenceRate - usdtToPhpRate)
    const usdtToPhpSpread = roundToSixDecimals(usdtToPhpDiff)
    const usdtToPhpSpreadPercentage = roundToTwoDecimals(
        usdtToPhpReferenceRate > 0 ? (usdtToPhpDiff / usdtToPhpReferenceRate) * 100 : 0
    )

    const rateData = {
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

    if (existingRate) {
        return await prisma.exchange_rates.update({
            where: { id: existingRate.id },
            data: rateData
        })
    } else {
        return await prisma.exchange_rates.create({
            data: rateData
        })
    }
}