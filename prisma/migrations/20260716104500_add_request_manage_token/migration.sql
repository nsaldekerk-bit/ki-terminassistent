-- AlterEnum
-- Safe inside a transaction on PG12+ as long as the new value is not used in
-- this same migration (the backfill below only touches manage_token).
ALTER TYPE "RequestStatus" ADD VALUE 'cancelled';

-- AlterTable
ALTER TABLE "booking_requests" ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "manage_token" TEXT,
ADD COLUMN     "rescheduled_at" TIMESTAMP(3);

-- Backfill: give every existing request a manage token so their confirmation
-- links keep working. gen_random_uuid() is built into PostgreSQL 13+.
UPDATE "booking_requests" SET "manage_token" = gen_random_uuid()::text WHERE "manage_token" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "booking_requests_manage_token_key" ON "booking_requests"("manage_token");
