-- AlterTable
ALTER TABLE "school"."DiscountApplication" 
  ALTER COLUMN "feeRecordId" DROP NOT NULL,
  ADD COLUMN "feeArrearsId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DiscountApplication_feeArrearsId_idx" ON "school"."DiscountApplication"("feeArrearsId");
