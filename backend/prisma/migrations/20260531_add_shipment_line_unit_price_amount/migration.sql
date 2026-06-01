ALTER TABLE "public"."sales_shipment_line" ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(18,6);
ALTER TABLE "public"."sales_shipment_line" ADD COLUMN IF NOT EXISTS "amount" DECIMAL(18,6);
