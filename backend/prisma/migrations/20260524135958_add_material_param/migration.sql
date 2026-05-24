-- CreateTable
CREATE TABLE "material_param" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "codeFormat" TEXT,
    "allowDuplicateName" BOOLEAN NOT NULL DEFAULT false,
    "autoApproval" BOOLEAN NOT NULL DEFAULT false,
    "defaultStatus" "CommonStatus" NOT NULL DEFAULT 'ACTIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_param_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_param_tenantId_key" ON "material_param"("tenantId");

-- AddForeignKey
ALTER TABLE "material_param" ADD CONSTRAINT "material_param_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
