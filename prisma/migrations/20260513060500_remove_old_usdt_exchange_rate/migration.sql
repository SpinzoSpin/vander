/*
  Warnings:

  - You are about to drop the column `php_to_usdt_markup_percentage` on the `exchange_rates` table. All the data in the column will be lost.
  - You are about to drop the column `usdt_to_php_markup_percentage` on the `exchange_rates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "exchange_rates" DROP COLUMN "php_to_usdt_markup_percentage",
DROP COLUMN "usdt_to_php_markup_percentage";
