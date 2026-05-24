-- CreateTable
CREATE TABLE "inspection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "inspectionNo" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceNo" TEXT,
    "materialId" TEXT,
    "materialName" TEXT,
    "quantity" DECIMAL(18,6),
    "qualifiedQty" DECIMAL(18,6),
    "unqualifiedQty" DECIMAL(18,6),
    "inspector" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "result" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspection_tenantId_idx" ON "inspection"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_tenantId_inspectionNo_key" ON "inspection"("tenantId", "inspectionNo");

-- AddForeignKey
ALTER TABLE "inspection" ADD CONSTRAINT "inspection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
