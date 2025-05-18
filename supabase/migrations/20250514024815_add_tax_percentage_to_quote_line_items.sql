
ALTER TABLE "public"."quote_line_items" ADD COLUMN "tax_percentage" numeric NOT NULL DEFAULT 0;
ALTER TABLE "public"."quote_items" ADD COLUMN "default_tax_percentage" numeric NOT NULL DEFAULT 0;
ALTER TABLE "public"."quote_items" ADD COLUMN "default_discount_percentage" numeric NOT NULL DEFAULT 0;
ALTER TABLE "public"."quote_items" ADD COLUMN "default_discount_amount" numeric NOT NULL DEFAULT 0;
