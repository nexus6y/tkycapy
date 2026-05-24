-- CreateTable
CREATE TABLE "material_category" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "CommonStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "material_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "material_category_tenantId_idx" ON "material_category"("tenantId");

-- CreateIndex
CREATE INDEX "material_category_parentId_idx" ON "material_category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "material_category_tenantId_code_key" ON "material_category"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "material_category" ADD CONSTRAINT "material_category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_category" ADD CONSTRAINT "material_category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "material_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
