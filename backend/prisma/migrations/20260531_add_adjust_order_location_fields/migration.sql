ALTER TABLE "public"."adjust_order" ADD COLUMN IF NOT EXISTS "materialCode" TEXT;
ALTER TABLE "public"."adjust_order" ADD COLUMN IF NOT EXISTS "spec" TEXT;
ALTER TABLE "public"."adjust_order" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "public"."adjust_order" ADD COLUMN IF NOT EXISTS "warehouseCode" TEXT;
ALTER TABLE "public"."adjust_order" ADD COLUMN IF NOT EXISTS "locationCode" TEXT;
ALTER TABLE "public"."adjust_order" ADD COLUMN IF NOT EXISTS "batchNo" TEXT;
ALTER TABLE "public"."adjust_order" ADD COLUMN IF NOT EXISTS "qualityStatus" TEXT;
