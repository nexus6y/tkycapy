-- CreateTable
CREATE TABLE "quotation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quotationNo" TEXT NOT NULL,
    "quotationName" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "departmentName" TEXT,
    "responsibleName" TEXT,
    "validUntil" TIMESTAMP(3),
    "totalAmount" DECIMAL(18,6),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "status" "CommonStatus" NOT NULL DEFAULT 'ACTIVE',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "quotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotation_tenantId_idx" ON "quotation"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_tenantId_quotationNo_key" ON "quotation"("tenantId", "quotationNo");

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
