-- CreateTable
CREATE TABLE "public"."sales_shipment_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "materialCode" TEXT,
    "materialName" TEXT,
    "spec" TEXT,
    "unit" TEXT,
    "orderQty" DECIMAL(18,6),
    "shippedQty" DECIMAL(18,6),
    "warehouseCode" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_shipment_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_shipment_line_tenantId_idx" ON "public"."sales_shipment_line"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "sales_shipment_line_shipmentId_idx" ON "public"."sales_shipment_line"("shipmentId" ASC);

-- AddForeignKey
ALTER TABLE "public"."sales_shipment_line" ADD CONSTRAINT "sales_shipment_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_shipment_line" ADD CONSTRAINT "sales_shipment_line_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."sales_shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
