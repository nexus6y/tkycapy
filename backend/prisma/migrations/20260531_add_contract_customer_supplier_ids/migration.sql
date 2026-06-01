ALTER TABLE "public"."contract" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "public"."contract" ADD COLUMN IF NOT EXISTS "customerCode" TEXT;
ALTER TABLE "public"."contract" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "public"."contract" ADD COLUMN IF NOT EXISTS "supplierCode" TEXT;
ALTER TABLE "public"."contract" ADD COLUMN IF NOT EXISTS "projectCode" TEXT;
ALTER TABLE "public"."contract" ADD COLUMN IF NOT EXISTS "projectName" TEXT;
