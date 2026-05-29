CREATE TABLE IF NOT EXISTS "public"."issue_order_line" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "issueOrderId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL, "materialCode" TEXT, "materialName" TEXT,
    "spec" TEXT, "unit" TEXT, "quantity" DECIMAL(18,6),
    "warehouseCode" TEXT, "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "issue_order_line_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "issue_order_line_tenantId_idx" ON "public"."issue_order_line"("tenantId" ASC);
CREATE INDEX IF NOT EXISTS "issue_order_line_issueOrderId_idx" ON "public"."issue_order_line"("issueOrderId" ASC);
ALTER TABLE "public"."issue_order_line" ADD CONSTRAINT "issue_order_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."issue_order_line" ADD CONSTRAINT "issue_order_line_issueOrderId_fkey" FOREIGN KEY ("issueOrderId") REFERENCES "public"."issue_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."complete_report_line" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "reportId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL, "materialCode" TEXT, "materialName" TEXT,
    "spec" TEXT, "unit" TEXT, "plannedQty" DECIMAL(18,6), "actualQty" DECIMAL(18,6),
    "warehouseCode" TEXT, "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "complete_report_line_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "complete_report_line_tenantId_idx" ON "public"."complete_report_line"("tenantId" ASC);
CREATE INDEX IF NOT EXISTS "complete_report_line_reportId_idx" ON "public"."complete_report_line"("reportId" ASC);
ALTER TABLE "public"."complete_report_line" ADD CONSTRAINT "complete_report_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."complete_report_line" ADD CONSTRAINT "complete_report_line_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."complete_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
