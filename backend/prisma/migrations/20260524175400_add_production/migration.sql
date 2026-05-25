-- CreateTable
CREATE TABLE "bom" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "materialId" TEXT,
    "materialName" TEXT,
    "version" TEXT,
    "quantity" DECIMAL(18,6),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "bomId" TEXT,
    "materialId" TEXT,
    "materialName" TEXT,
    "quantity" DECIMAL(18,6),
    "departmentId" TEXT,
    "departmentName" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING_ISSUE',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "production_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bom_tenantId_idx" ON "bom"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "bom_tenantId_code_key" ON "bom"("tenantId", "code");

-- CreateIndex
CREATE INDEX "production_order_tenantId_idx" ON "production_order"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "production_order_tenantId_orderNo_key" ON "production_order"("tenantId", "orderNo");

-- AddForeignKey
ALTER TABLE "bom" ADD CONSTRAINT "bom_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order" ADD CONSTRAINT "production_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
