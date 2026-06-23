import "dotenv/config";
import { prisma } from "./lib/prisma";
import { createExchangeRate, getPhpToUsdRate } from "./services/exchange-rates/create-rate";
import { startTelegramBot } from "./services/telegram/bot";


// Decides if two rates are close enough to be considered equal
const isRateEqual = (rateA, rateB) => {
    return Math.abs(Number(rateA) - Number(rateB)) < 0.000001;
};

async function runUpdate() {
    try {
        console.log(`[${new Date().toISOString()}] Fetching current live rate from Coins.ph...`);

        // 1. Get live reference rate from Coins.ph (returns 1 PHP = ? USDT)
        const phpToUsdtReferenceRate = await getPhpToUsdRate();
        const usdtToPhpReferenceRate = Math.round((1 / phpToUsdtReferenceRate) * 1000000) / 1000000;

        // 2. Fetch the current active exchange rate from the database
        const activeRate = await prisma.exchange_rates.findFirst({
            where: { is_active: true }
        });

        // 3. Prevent redundant database writes if the reference rate has not changed
        if (activeRate) {
            const currentDbRefRate = Number(activeRate.usdt_to_php_reference_rate);
            console.log("CurrentDbRefRate", currentDbRefRate)
            if (isRateEqual(currentDbRefRate, usdtToPhpReferenceRate)) {
                console.log(`[${new Date().toISOString()}] Exchange rate unchanged at ${usdtToPhpReferenceRate} PHP/USDT. Skipping database update.`);
                return;
            }
        }

        // 4. Create and save the new rate if it has changed
        console.log(`[${new Date().toISOString()}] Rate changed. Saving new rate: 1 USDT = ${usdtToPhpReferenceRate} PHP...`);
        const newRate = await createExchangeRate();
        console.log(`[${new Date().toISOString()}] Successfully updated exchange rate to ID: ${newRate.id} (1 USDT = ${newRate.usdt_to_php_rate} PHP final, reference: ${newRate.usdt_to_php_reference_rate})`);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during background exchange rate update:`, error);
    }
}

function start() {
    const intervalMinutes = process.env.UPDATE_INTERVAL_MINUTES
        ? parseInt(process.env.UPDATE_INTERVAL_MINUTES, 10)
        : 10; // Default to 10 minutes (average currency changing time)

    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`[${new Date().toISOString()}] Starting exchange rate updater daemon.`);
    console.log(`Interval: ${intervalMinutes} minutes (${intervalMs} ms).`);

    // Start the Telegram bot listener
    try {
        startTelegramBot();
    } catch (e) {
        console.log("Failed to start telegram bot")
        console.error(e);
    }

    // Run the update immediately on startup
    runUpdate();

    // Schedule subsequent updates
    setInterval(runUpdate, intervalMs);
}

start();
