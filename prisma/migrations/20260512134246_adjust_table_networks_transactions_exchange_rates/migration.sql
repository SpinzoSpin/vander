-- CreateEnum
CREATE TYPE "enum_transactions_status" AS ENUM ('pending', 'confirmed', 'processing', 'complete', 'fiat_arrival', 'crypto_arrival');

-- CreateEnum
CREATE TYPE "enum_transactions_type" AS ENUM ('fiat_to_crypto', 'crypto_to_fiat');

-- CreateEnum
CREATE TYPE "enum_networks_network_type" AS ENUM ('evm', 'svm', 'btc', 'ton');

-- CreateTable
CREATE TABLE "treasury" (
    "id" SERIAL NOT NULL,
    "wallet_address" VARCHAR NOT NULL,
    "network_id" INTEGER NOT NULL,
    "current_balance" DECIMAL,
    "latest_transaction_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "private_key" VARCHAR,
    "wallet_name" VARCHAR NOT NULL,

    CONSTRAINT "treasury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER,
    "amount_php" DECIMAL NOT NULL,
    "amount_usdt" DECIMAL,
    "gas_fee" DECIMAL,
    "network_id" INTEGER NOT NULL,
    "status" "enum_transactions_status" NOT NULL DEFAULT 'pending',
    "fiat_settlement_id" VARCHAR,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "enum_transactions_type" NOT NULL DEFAULT 'fiat_to_crypto',
    "treasury_id" INTEGER NOT NULL,
    "target_address" VARCHAR,
    "tx_hash" VARCHAR,
    "fail_reason" VARCHAR,
    "profit" DECIMAL DEFAULT 0,
    "amount_usdt_original" DECIMAL,
    "exchange_rate_id" INTEGER NOT NULL,
    "order_id" VARCHAR,
    "bank_details" VARCHAR,
    "received_record_id" INTEGER,
    "sending_record_id" INTEGER,
    "notes" VARCHAR,
    "invoice_image_id" INTEGER,
    "usdt_to_php_reference_rate_snapshot" DECIMAL,
    "usdt_to_php_rate_snapshot" DECIMAL,
    "php_to_usdt_reference_rate_snapshot" DECIMAL,
    "php_to_usdt_rate_snapshot" DECIMAL,
    "rate_snapshot" DECIMAL,
    "reference_rate_snapshot" DECIMAL,
    "applied_rate_snapshot" DECIMAL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "networks" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "symbol" VARCHAR NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "network_type" "enum_networks_network_type" NOT NULL,
    "usdt_contract_address" VARCHAR NOT NULL,
    "gas_fee_token_name" VARCHAR NOT NULL,
    "rpc_url" VARCHAR NOT NULL,
    "usdt_decimals" DECIMAL NOT NULL DEFAULT 6,

    CONSTRAINT "networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" SERIAL NOT NULL,
    "pair" VARCHAR NOT NULL DEFAULT 'USDT/PHP',
    "usdt_to_php_rate" DECIMAL NOT NULL,
    "php_to_usdt_rate" DECIMAL NOT NULL,
    "usdt_to_php_markup_percentage" DECIMAL DEFAULT 0,
    "php_to_usdt_markup_percentage" DECIMAL DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usdt_to_php_reference_rate" DECIMAL NOT NULL,
    "usdt_to_php_spread" DECIMAL,
    "usdt_to_php_spread_percentage" DECIMAL,
    "php_to_usdt_reference_rate" DECIMAL NOT NULL,
    "php_to_usdt_spread" DECIMAL,
    "php_to_usdt_spread_percentage" DECIMAL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "alt" VARCHAR NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" VARCHAR,
    "thumbnail_u_r_l" VARCHAR,
    "filename" VARCHAR,
    "mime_type" VARCHAR,
    "filesize" DECIMAL,
    "width" DECIMAL,
    "height" DECIMAL,
    "focal_x" DECIMAL,
    "focal_y" DECIMAL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);
