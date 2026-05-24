-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "creditLevel" TEXT,
    "taxId" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "status" "CommonStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_tenantId_idx" ON "supplier"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_tenantId_code_key" ON "supplier"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
