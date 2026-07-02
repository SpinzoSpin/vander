-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "dedupe_expires_at" TIMESTAMPTZ(3);
