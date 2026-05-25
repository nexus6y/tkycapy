-- CreateTable
CREATE TABLE "transfer_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "materialName" TEXT,
    "quantity" DECIMAL(18,6),
    "fromWarehouse" TEXT,
    "toWarehouse" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lend_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LEND',
    "materialName" TEXT,
    "quantity" DECIMAL(18,6),
    "borrower" TEXT,
    "borrowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturn" TIMESTAMP(3),
    "actualReturn" TIMESTAMP(3),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lend_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrap_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "materialName" TEXT,
    "quantity" DECIMAL(18,6),
    "scrapReason" TEXT,
    "disposalMethod" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "scrapDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scrap_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transfer_order_tenantId_idx" ON "transfer_order"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_order_tenantId_orderNo_key" ON "transfer_order"("tenantId", "orderNo");

-- CreateIndex
CREATE INDEX "lend_order_tenantId_idx" ON "lend_order"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "lend_order_tenantId_orderNo_key" ON "lend_order"("tenantId", "orderNo");

-- CreateIndex
CREATE INDEX "scrap_order_tenantId_idx" ON "scrap_order"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "scrap_order_tenantId_orderNo_key" ON "scrap_order"("tenantId", "orderNo");

-- AddForeignKey
ALTER TABLE "transfer_order" ADD CONSTRAINT "transfer_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lend_order" ADD CONSTRAINT "lend_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrap_order" ADD CONSTRAINT "scrap_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
