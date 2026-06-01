CREATE TABLE IF NOT EXISTS "public"."purchase_return" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "returnNo" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "purchaseOrderNo" TEXT,
    "supplierId" TEXT,
    "supplierCode" TEXT,
    "supplierName" TEXT,
    "materialName" TEXT,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalQuantity" DECIMAL(18,6),
    "totalAmount" DECIMAL(18,6),
    "returnReason" TEXT,
    "approvalStatus" "public"."ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "purchase_return_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_return_tenantId_returnNo_key" ON "public"."purchase_return"("tenantId", "returnNo");
ALTER TABLE "public"."sales_return" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "public"."sales_return" ADD COLUMN IF NOT EXISTS "customerCode" TEXT;
