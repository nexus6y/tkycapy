ALTER TABLE "public"."sales_shipment_line" ADD COLUMN IF NOT EXISTS "salesOrderLineId" TEXT;
ALTER TABLE "public"."outbound_order_line" ADD COLUMN IF NOT EXISTS "salesOrderLineId" TEXT;
