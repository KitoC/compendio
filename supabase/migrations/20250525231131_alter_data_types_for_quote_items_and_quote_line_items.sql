ALTER TABLE "public"."quote_items"
RENAME COLUMN "quantity" TO "default_quantity";

ALTER TABLE "public"."quote_items"
ALTER COLUMN "default_quantity" TYPE numeric USING "default_quantity"::numeric;

ALTER TABLE "public"."quote_line_items"
ALTER COLUMN "quantity" TYPE numeric USING "quantity"::numeric;