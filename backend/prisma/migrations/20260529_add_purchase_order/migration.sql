-- CreateTable
CREATE TABLE "public"."purchase_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "creationType" TEXT NOT NULL DEFAULT 'MANUAL',
    "purchaseType" TEXT,
    "departmentId" TEXT,
    "departmentName" TEXT,
    "purchaser" TEXT,
    "supplierId" TEXT,
    "supplierName" TEXT,
    "projectId" TEXT,
    "projectName" TEXT,
    "contractId" TEXT,
    "contractName" TEXT,
    "organizationName" TEXT,
    "purchasePlanId" TEXT,
    "purchasePlanNo" TEXT,
    "demandPlanId" TEXT,
    "demandPlanNo" TEXT,
    "expectedDeliveryDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(18,6),
    "approvalStatus" "public"."ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING_RECEIPT',
    "remark" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "materialCode" TEXT,
    "materialName" TEXT,
    "spec" TEXT,
    "unit" TEXT,
    "quantity" DECIMAL(18,6),
    "unitPrice" DECIMAL(18,6),
    "amount" DECIMAL(18,6),
    "requiredDate" TIMESTAMP(3),
    "warehouseCode" TEXT,
    "receivedQty" DECIMAL(18,6) DEFAULT 0,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_tenantId_orderNo_key" ON "public"."purchase_order"("tenantId" ASC, "orderNo" ASC);

-- CreateIndex
CREATE INDEX "purchase_order_tenantId_idx" ON "public"."purchase_order"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "purchase_order_supplierId_idx" ON "public"."purchase_order"("supplierId" ASC);

-- CreateIndex
CREATE INDEX "purchase_order_line_tenantId_idx" ON "public"."purchase_order_line"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "purchase_order_line_purchaseOrderId_idx" ON "public"."purchase_order_line"("purchaseOrderId" ASC);

-- AddForeignKey
ALTER TABLE "public"."purchase_order" ADD CONSTRAINT "purchase_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_line" ADD CONSTRAINT "purchase_order_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_line" ADD CONSTRAINT "purchase_order_line_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
