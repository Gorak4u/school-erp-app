-- Add transport route targeting field
ALTER TABLE "school"."DiscountRequest"
ADD COLUMN IF NOT EXISTS "transportRouteIds" TEXT NOT NULL DEFAULT '[]';

-- Add flexible metadata column for future enhancements
ALTER TABLE "school"."DiscountRequest"
ADD COLUMN IF NOT EXISTS "metadata" JSONB;
