-- AlterTable
ALTER TABLE "exchange_rates" ADD COLUMN     "php_to_usdt_markup_percentage" DECIMAL DEFAULT 0,
ADD COLUMN     "usdt_to_php_markup_percentage" DECIMAL DEFAULT 0;
