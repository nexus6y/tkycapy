-- CreateTable
CREATE TABLE "inbound_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "materialName" TEXT,
    "specification" TEXT,
    "quantity" DECIMAL(18,6),
    "qualifiedQty" DECIMAL(18,6) DEFAULT 0,
    "unqualifiedQty" DECIMAL(18,6) DEFAULT 0,
    "warehouseId" TEXT,
    "warehouseName" TEXT,
    "unitPrice" DECIMAL(18,6),
    "totalAmount" DECIMAL(18,6),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inbound_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "materialName" TEXT,
    "specification" TEXT,
    "quantity" DECIMAL(18,6),
    "warehouseId" TEXT,
    "warehouseName" TEXT,
    "unitPrice" DECIMAL(18,6),
    "totalAmount" DECIMAL(18,6),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "shipmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "outbound_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inbound_order_tenantId_idx" ON "inbound_order"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_order_tenantId_orderNo_key" ON "inbound_order"("tenantId", "orderNo");

-- CreateIndex
CREATE INDEX "outbound_order_tenantId_idx" ON "outbound_order"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "outbound_order_tenantId_orderNo_key" ON "outbound_order"("tenantId", "orderNo");

-- AddForeignKey
ALTER TABLE "inbound_order" ADD CONSTRAINT "inbound_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_order" ADD CONSTRAINT "outbound_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
