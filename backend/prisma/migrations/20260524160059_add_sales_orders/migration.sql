-- CreateTable
CREATE TABLE "pre_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "contractId" TEXT,
    "contractName" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "totalAmount" DECIMAL(18,6),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pre_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "projectName" TEXT,
    "contractName" TEXT,
    "orderType" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(18,6),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING_SHIP',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_shipment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shipmentNo" TEXT NOT NULL,
    "orderId" TEXT,
    "orderNo" TEXT,
    "customerName" TEXT,
    "shipmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalQuantity" DECIMAL(18,6),
    "totalAmount" DECIMAL(18,6),
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sales_shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_return" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "returnNo" TEXT NOT NULL,
    "shipmentId" TEXT,
    "shipmentNo" TEXT,
    "customerName" TEXT,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalQuantity" DECIMAL(18,6),
    "totalAmount" DECIMAL(18,6),
    "returnReason" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "businessStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sales_return_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pre_order_tenantId_idx" ON "pre_order"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "pre_order_tenantId_orderNo_key" ON "pre_order"("tenantId", "orderNo");

-- CreateIndex
CREATE INDEX "sales_order_tenantId_idx" ON "sales_order"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_tenantId_orderNo_key" ON "sales_order"("tenantId", "orderNo");

-- CreateIndex
CREATE INDEX "sales_shipment_tenantId_idx" ON "sales_shipment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_shipment_tenantId_shipmentNo_key" ON "sales_shipment"("tenantId", "shipmentNo");

-- CreateIndex
CREATE INDEX "sales_return_tenantId_idx" ON "sales_return"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_return_tenantId_returnNo_key" ON "sales_return"("tenantId", "returnNo");

-- AddForeignKey
ALTER TABLE "pre_order" ADD CONSTRAINT "pre_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_shipment" ADD CONSTRAINT "sales_shipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return" ADD CONSTRAINT "sales_return_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
