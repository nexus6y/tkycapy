CREATE TABLE IF NOT EXISTS "public"."quotation_line" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "quotationId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL, "materialCode" TEXT, "materialName" TEXT,
    "spec" TEXT, "unit" TEXT, "quantity" DECIMAL(18,6), "unitPrice" DECIMAL(18,6),
    "amount" DECIMAL(18,6), "deliveryDate" TIMESTAMP(3), "warehouseCode" TEXT, "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quotation_line_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "quotation_line_tenantId_idx" ON "public"."quotation_line"("tenantId" ASC);
CREATE INDEX IF NOT EXISTS "quotation_line_quotationId_idx" ON "public"."quotation_line"("quotationId" ASC);
ALTER TABLE "public"."quotation_line" ADD CONSTRAINT "quotation_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."quotation_line" ADD CONSTRAINT "quotation_line_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."pre_order_line" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "preOrderId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL, "materialCode" TEXT, "materialName" TEXT,
    "spec" TEXT, "unit" TEXT, "quantity" DECIMAL(18,6), "unitPrice" DECIMAL(18,6),
    "amount" DECIMAL(18,6), "deliveryDate" TIMESTAMP(3), "warehouseCode" TEXT, "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pre_order_line_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "pre_order_line_tenantId_idx" ON "public"."pre_order_line"("tenantId" ASC);
CREATE INDEX IF NOT EXISTS "pre_order_line_preOrderId_idx" ON "public"."pre_order_line"("preOrderId" ASC);
ALTER TABLE "public"."pre_order_line" ADD CONSTRAINT "pre_order_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."pre_order_line" ADD CONSTRAINT "pre_order_line_preOrderId_fkey" FOREIGN KEY ("preOrderId") REFERENCES "public"."pre_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
