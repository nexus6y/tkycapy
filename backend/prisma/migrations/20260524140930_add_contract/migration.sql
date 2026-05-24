-- CreateTable
CREATE TABLE "contract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isProjectContract" BOOLEAN NOT NULL DEFAULT false,
    "isFrameworkContract" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT,
    "customerName" TEXT,
    "supplierName" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(18,6),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_tenantId_idx" ON "contract"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_tenantId_code_key" ON "contract"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
