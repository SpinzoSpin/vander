/*
  Warnings:

  - You are about to drop the column `php_to_usdt_markup_percentage` on the `exchange_rates` table. All the data in the column will be lost.
  - You are about to drop the column `usdt_to_php_markup_percentage` on the `exchange_rates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "exchange_rates" DROP COLUMN "php_to_usdt_markup_percentage",
DROP COLUMN "usdt_to_php_markup_percentage",
ADD COLUMN     "php_to_usdt_gic_fee" DECIMAL DEFAULT 0,
ADD COLUMN     "php_to_usdt_spinzo_fee" DECIMAL DEFAULT 0,
ADD COLUMN     "usdt_to_php_gic_fee" DECIMAL DEFAULT 0,
ADD COLUMN     "usdt_to_php_spinzo_fee" DECIMAL DEFAULT 0;
