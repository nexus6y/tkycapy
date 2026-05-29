-- CreateTable: SalesOrderLine
CREATE TABLE "public"."sales_order_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "materialCode" TEXT,
    "materialName" TEXT,
    "spec" TEXT,
    "unit" TEXT,
    "quantity" DECIMAL(18,6),
    "unitPrice" DECIMAL(18,6),
    "amount" DECIMAL(18,6),
    "deliveryDate" TIMESTAMP(3),
    "shippedQty" DECIMAL(18,6) DEFAULT 0,
    "warehouseCode" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PurchasePlanLine
CREATE TABLE "public"."purchase_plan_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "purchasePlanId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "materialCode" TEXT,
    "materialName" TEXT,
    "spec" TEXT,
    "unit" TEXT,
    "quantity" DECIMAL(18,6),
    "unitPrice" DECIMAL(18,6),
    "amount" DECIMAL(18,6),
    "requiredDate" TIMESTAMP(3),
    "warehouseCode" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "purchase_plan_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductionOrderLine
CREATE TABLE "public"."production_order_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "materialCode" TEXT,
    "materialName" TEXT,
    "spec" TEXT,
    "unit" TEXT,
    "plannedQty" DECIMAL(18,6),
    "actualQty" DECIMAL(18,6) DEFAULT 0,
    "warehouseCode" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "production_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductionMaterialLine
CREATE TABLE "public"."production_material_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "materialCode" TEXT,
    "materialName" TEXT,
    "spec" TEXT,
    "unit" TEXT,
    "quantity" DECIMAL(18,6),
    "issuedQty" DECIMAL(18,6) DEFAULT 0,
    "warehouseCode" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "production_material_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InspectionLine
CREATE TABLE "public"."inspection_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "materialCode" TEXT,
    "materialName" TEXT,
    "spec" TEXT,
    "unit" TEXT,
    "inspectQty" DECIMAL(18,6),
    "qualifiedQty" DECIMAL(18,6) DEFAULT 0,
    "unqualifiedQty" DECIMAL(18,6) DEFAULT 0,
    "result" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inspection_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InboundOrderLine
CREATE TABLE "public"."inbound_order_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "inboundOrderId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "materialCode" TEXT,
    "materialName" TEXT,
    "spec" TEXT,
    "unit" TEXT,
    "quantity" DECIMAL(18,6),
    "unitPrice" DECIMAL(18,6),
    "amount" DECIMAL(18,6),
    "warehouseCode" TEXT,
    "locationCode" TEXT,
    "batchNo" TEXT,
    "qualifiedQty" DECIMAL(18,6) DEFAULT 0,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inbound_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OutboundOrderLine
CREATE TABLE "public"."outbound_order_line" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "outboundOrderId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "materialCode" TEXT,
    "materialName" TEXT,
    "spec" TEXT,
    "unit" TEXT,
    "quantity" DECIMAL(18,6),
    "unitPrice" DECIMAL(18,6),
    "amount" DECIMAL(18,6),
    "warehouseCode" TEXT,
    "locationCode" TEXT,
    "batchNo" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "outbound_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InventoryTransaction
CREATE TABLE "public"."inventory_transaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceNo" TEXT,
    "sourceLineNo" INTEGER,
    "materialCode" TEXT,
    "materialName" TEXT,
    "spec" TEXT,
    "unit" TEXT,
    "warehouseCode" TEXT,
    "locationCode" TEXT,
    "batchNo" TEXT,
    "qualityStatus" TEXT,
    "projectCode" TEXT,
    "quantity" DECIMAL(18,6),
    "unitPrice" DECIMAL(18,6),
    "totalAmount" DECIMAL(18,6),
    "balanceQty" DECIMAL(18,6),
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_transaction_pkey" PRIMARY KEY ("id")
);

-- Update Inventory: add new columns for code-based tracking
ALTER TABLE "public"."inventory" ADD COLUMN IF NOT EXISTS "materialCode" TEXT;
ALTER TABLE "public"."inventory" ADD COLUMN IF NOT EXISTS "warehouseCode" TEXT;
ALTER TABLE "public"."inventory" ADD COLUMN IF NOT EXISTS "locationCode" TEXT;
ALTER TABLE "public"."inventory" ADD COLUMN IF NOT EXISTS "batchNo" TEXT;
ALTER TABLE "public"."inventory" ADD COLUMN IF NOT EXISTS "qualityStatus" TEXT;
ALTER TABLE "public"."inventory" ADD COLUMN IF NOT EXISTS "projectCode" TEXT;
ALTER TABLE "public"."inventory" ADD COLUMN IF NOT EXISTS "spec" TEXT;
ALTER TABLE "public"."inventory" ADD COLUMN IF NOT EXISTS "unit" TEXT;

-- Update Inventory unique constraint (drop old, add new unique key)
ALTER TABLE "public"."inventory" DROP CONSTRAINT IF EXISTS "inventory_tenantId_materialId_warehouseId_batchNo_key";
CREATE UNIQUE INDEX "inventory_tenantId_materialCode_warehouseCode_locationCode__key" ON "public"."inventory"("tenantId" ASC, "materialCode" ASC, "warehouseCode" ASC, "locationCode" ASC, "batchNo" ASC, "qualityStatus" ASC, "projectCode" ASC);

-- Indexes
CREATE INDEX "sales_order_line_tenantId_idx" ON "public"."sales_order_line"("tenantId" ASC);
CREATE INDEX "sales_order_line_salesOrderId_idx" ON "public"."sales_order_line"("salesOrderId" ASC);

CREATE INDEX "purchase_plan_line_tenantId_idx" ON "public"."purchase_plan_line"("tenantId" ASC);
CREATE INDEX "purchase_plan_line_purchasePlanId_idx" ON "public"."purchase_plan_line"("purchasePlanId" ASC);

CREATE INDEX "production_order_line_tenantId_idx" ON "public"."production_order_line"("tenantId" ASC);
CREATE INDEX "production_order_line_productionOrderId_idx" ON "public"."production_order_line"("productionOrderId" ASC);

CREATE INDEX "production_material_line_tenantId_idx" ON "public"."production_material_line"("tenantId" ASC);
CREATE INDEX "production_material_line_productionOrderId_idx" ON "public"."production_material_line"("productionOrderId" ASC);

CREATE INDEX "inspection_line_tenantId_idx" ON "public"."inspection_line"("tenantId" ASC);
CREATE INDEX "inspection_line_inspectionId_idx" ON "public"."inspection_line"("inspectionId" ASC);

CREATE INDEX "inbound_order_line_tenantId_idx" ON "public"."inbound_order_line"("tenantId" ASC);
CREATE INDEX "inbound_order_line_inboundOrderId_idx" ON "public"."inbound_order_line"("inboundOrderId" ASC);

CREATE INDEX "outbound_order_line_tenantId_idx" ON "public"."outbound_order_line"("tenantId" ASC);
CREATE INDEX "outbound_order_line_outboundOrderId_idx" ON "public"."outbound_order_line"("outboundOrderId" ASC);

CREATE INDEX "inventory_transaction_tenantId_idx" ON "public"."inventory_transaction"("tenantId" ASC);
CREATE INDEX "inventory_transaction_materialCode_idx" ON "public"."inventory_transaction"("materialCode" ASC);
CREATE INDEX "inventory_transaction_warehouseCode_idx" ON "public"."inventory_transaction"("warehouseCode" ASC);
CREATE INDEX "inventory_transaction_transactionDate_idx" ON "public"."inventory_transaction"("transactionDate" ASC);

CREATE INDEX "inventory_materialCode_idx" ON "public"."inventory"("materialCode" ASC);

-- Foreign Keys
ALTER TABLE "public"."sales_order_line" ADD CONSTRAINT "sales_order_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."sales_order_line" ADD CONSTRAINT "sales_order_line_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "public"."sales_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."purchase_plan_line" ADD CONSTRAINT "purchase_plan_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."purchase_plan_line" ADD CONSTRAINT "purchase_plan_line_purchasePlanId_fkey" FOREIGN KEY ("purchasePlanId") REFERENCES "public"."purchase_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."production_order_line" ADD CONSTRAINT "production_order_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."production_order_line" ADD CONSTRAINT "production_order_line_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "public"."production_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."production_material_line" ADD CONSTRAINT "production_material_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."production_material_line" ADD CONSTRAINT "production_material_line_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "public"."production_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."inspection_line" ADD CONSTRAINT "inspection_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."inspection_line" ADD CONSTRAINT "inspection_line_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "public"."inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."inbound_order_line" ADD CONSTRAINT "inbound_order_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."inbound_order_line" ADD CONSTRAINT "inbound_order_line_inboundOrderId_fkey" FOREIGN KEY ("inboundOrderId") REFERENCES "public"."inbound_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."outbound_order_line" ADD CONSTRAINT "outbound_order_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."outbound_order_line" ADD CONSTRAINT "outbound_order_line_outboundOrderId_fkey" FOREIGN KEY ("outboundOrderId") REFERENCES "public"."outbound_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."inventory_transaction" ADD CONSTRAINT "inventory_transaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
