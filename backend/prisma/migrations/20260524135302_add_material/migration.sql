-- CreateTable
CREATE TABLE "measurement_unit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CommonStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "measurement_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specification" TEXT,
    "externalCode" TEXT,
    "categoryId" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL DEFAULT 'PHYSICAL',
    "materialProperty" TEXT,
    "productCategory" TEXT,
    "unitId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CommonStatus" NOT NULL DEFAULT 'ACTIVE',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "measurement_unit_tenantId_idx" ON "measurement_unit"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "measurement_unit_tenantId_code_key" ON "measurement_unit"("tenantId", "code");

-- CreateIndex
CREATE INDEX "material_tenantId_categoryId_idx" ON "material"("tenantId", "categoryId");

-- CreateIndex
CREATE INDEX "material_unitId_idx" ON "material"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "material_tenantId_code_key" ON "material"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "measurement_unit" ADD CONSTRAINT "measurement_unit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "material_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "measurement_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
