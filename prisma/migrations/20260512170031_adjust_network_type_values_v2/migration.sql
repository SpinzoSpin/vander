/*
  Warnings:

  - The values [fiat_to_crypto,crypto_to_fiat] on the enum `enum_networks_network_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "enum_networks_network_type_new" AS ENUM ('mainnet', 'testnet');
ALTER TABLE "networks" ALTER COLUMN "network_type" TYPE "enum_networks_network_type_new" USING ("network_type"::text::"enum_networks_network_type_new");
ALTER TYPE "enum_networks_network_type" RENAME TO "enum_networks_network_type_old";
ALTER TYPE "enum_networks_network_type_new" RENAME TO "enum_networks_network_type";
DROP TYPE "public"."enum_networks_network_type_old";
COMMIT;
