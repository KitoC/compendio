CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid NOT NULL REFERENCES tenants(id),
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text NOT NULL,
    "notes" text,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

CREATE TYPE "public"."quote_status" AS ENUM (
    'draft',
    'sent',
    'accepted',
    'declined'
);

ALTER TYPE "public"."quote_status" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid NOT NULL REFERENCES tenants(id),
    "name" text NOT NULL,
    "client_id" uuid NOT NULL REFERENCES clients(id),
    "description" text,
    "status" "public"."quote_status" NOT NULL DEFAULT 'draft',
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    PRIMARY KEY ("id")
);


CREATE TABLE IF NOT EXISTS "public"."quote_items" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid NOT NULL REFERENCES tenants(id),
    "name" text NOT NULL,
    "description" text,
    "code" text,
    "quantity" integer NOT NULL DEFAULT 1,
    "unit_price" numeric NOT NULL DEFAULT 0,
    "total_price" numeric NOT NULL DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."quote_line_items" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid NOT NULL REFERENCES tenants(id),
    "quote_id" uuid NOT NULL REFERENCES quotes(id),
    "quote_item_id" uuid NOT NULL REFERENCES quote_items(id),
    "quantity" integer NOT NULL DEFAULT 1,
    "unit_price" numeric NOT NULL DEFAULT 0,
    "total_price" numeric NOT NULL DEFAULT 0,
    "discount_percentage" numeric NOT NULL DEFAULT 0,
    "discount_amount" numeric NOT NULL DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    PRIMARY KEY ("id")
);


ALTER TABLE "public"."quotes" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");
ALTER TABLE "public"."clients" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");
ALTER TABLE "public"."quote_items" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");
ALTER TABLE "public"."quote_line_items" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");

ALTER TABLE "public"."quotes" ADD CONSTRAINT "fk_client_id" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");
ALTER TABLE "public"."quote_line_items" ADD CONSTRAINT "fk_quote_id" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id");
ALTER TABLE "public"."quote_line_items" ADD CONSTRAINT "fk_quote_item_id" FOREIGN KEY ("quote_item_id") REFERENCES "public"."quote_items"("id");


CREATE POLICY "System & Tenant owners CRUD" ON "public"."quotes" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));
ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System & Tenant owners CRUD" ON "public"."clients" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));
ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System & Tenant owners CRUD" ON "public"."quote_items" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));
ALTER TABLE "public"."quote_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System & Tenant owners CRUD" ON "public"."quote_line_items" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));
ALTER TABLE "public"."quote_line_items" ENABLE ROW LEVEL SECURITY;
