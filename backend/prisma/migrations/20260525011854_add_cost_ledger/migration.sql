-- CreateTable
CREATE TABLE "cost_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "materialName" TEXT,
    "quantity" DECIMAL(18,6),
    "unitPrice" DECIMAL(18,6),
    "totalAmount" DECIMAL(18,6),
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cost_ledger_tenantId_idx" ON "cost_ledger"("tenantId");

-- AddForeignKey
ALTER TABLE "cost_ledger" ADD CONSTRAINT "cost_ledger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
