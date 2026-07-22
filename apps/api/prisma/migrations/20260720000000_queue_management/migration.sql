-- CreateEnum
CREATE TYPE "PriorityTier" AS ENUM ('VIP', 'PREGNANT', 'PWD', 'SENIOR', 'STANDARD');

-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('CUSTOMER', 'OWNER', 'SYSTEM');

-- AlterEnum
-- New BookingStatus values for the queue serving lifecycle. Postgres requires
-- these to be committed before they can be referenced by data; Prisma splits
-- this automatically when running `migrate deploy`.
ALTER TYPE "BookingStatus" ADD VALUE 'SERVING';
ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "ticketNumber" INTEGER,
ADD COLUMN     "priorityTier" "PriorityTier" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "servingAt" TIMESTAMP(3),
ADD COLUMN     "recallCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" "CancelledBy";

-- CreateTable
CREATE TABLE "QueueCounter" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "businessDate" DATE NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QueueCounter_businessId_idx" ON "QueueCounter"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "QueueCounter_businessId_businessDate_key" ON "QueueCounter"("businessId", "businessDate");

-- CreateIndex
CREATE INDEX "Booking_businessId_status_completedAt_idx" ON "Booking"("businessId", "status", "completedAt");
