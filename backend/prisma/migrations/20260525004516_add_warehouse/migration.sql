-- CreateTable
CREATE TABLE "warehouse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CommonStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "materialId" TEXT,
    "materialName" TEXT,
    "warehouseId" TEXT,
    "warehouseName" TEXT,
    "locationCode" TEXT,
    "batchNo" TEXT,
    "quantity" DECIMAL(18,6) NOT NULL,
    "availableQty" DECIMAL(18,6) NOT NULL,
    "lockedQty" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warehouse_tenantId_idx" ON "warehouse"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_tenantId_code_key" ON "warehouse"("tenantId", "code");

-- CreateIndex
CREATE INDEX "inventory_tenantId_idx" ON "inventory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_tenantId_materialId_warehouseId_batchNo_key" ON "inventory"("tenantId", "materialId", "warehouseId", "batchNo");

-- AddForeignKey
ALTER TABLE "warehouse" ADD CONSTRAINT "warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
