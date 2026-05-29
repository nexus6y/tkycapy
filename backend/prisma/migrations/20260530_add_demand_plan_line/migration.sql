CREATE TABLE IF NOT EXISTS "public"."demand_plan_line" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "demandPlanId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL, "materialCode" TEXT, "materialName" TEXT,
    "spec" TEXT, "unit" TEXT, "quantity" DECIMAL(18,6),
    "requiredDate" TIMESTAMP(3), "warehouseCode" TEXT, "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "demand_plan_line_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "demand_plan_line_tenantId_idx" ON "public"."demand_plan_line"("tenantId" ASC);
CREATE INDEX IF NOT EXISTS "demand_plan_line_demandPlanId_idx" ON "public"."demand_plan_line"("demandPlanId" ASC);
ALTER TABLE "public"."demand_plan_line" ADD CONSTRAINT "demand_plan_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."demand_plan_line" ADD CONSTRAINT "demand_plan_line_demandPlanId_fkey" FOREIGN KEY ("demandPlanId") REFERENCES "public"."demand_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
