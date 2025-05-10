CREATE TABLE IF NOT EXISTS "public"."data_navigation_items" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "path" text NOT NULL,
    "icon" text NOT NULL,
    "tenant_id" uuid NOT NULL REFERENCES tenants(id),
    "description" text,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

ALTER TABLE "public"."data_views" ADD COLUMN "data_navigation_item_id" UUID;

ALTER TABLE "public"."data_views" ADD CONSTRAINT "fk_data_navigation_item_id" FOREIGN KEY ("data_navigation_item_id") REFERENCES "public"."data_navigation_items"("id");

