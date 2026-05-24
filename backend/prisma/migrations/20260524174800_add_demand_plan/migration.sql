-- CreateTable
CREATE TABLE "demand_plan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planNo" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "demandSource" TEXT,
    "demandUse" TEXT,
    "projectId" TEXT,
    "projectName" TEXT,
    "requiredDate" TIMESTAMP(3),
    "totalQuantity" DECIMAL(18,6),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "demand_plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demand_plan_tenantId_idx" ON "demand_plan"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "demand_plan_tenantId_planNo_key" ON "demand_plan"("tenantId", "planNo");

-- AddForeignKey
ALTER TABLE "demand_plan" ADD CONSTRAINT "demand_plan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
