ALTER TABLE "public"."demand_plan" ADD COLUMN IF NOT EXISTS "projectCode" TEXT;
ALTER TABLE "public"."demand_plan" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "public"."demand_plan" ADD COLUMN IF NOT EXISTS "departmentName" TEXT;
