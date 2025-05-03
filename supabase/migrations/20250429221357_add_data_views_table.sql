CREATE TABLE IF NOT EXISTS "public"."data_views" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "data_table_id" uuid NOT NULL,
    "external_table_id" text NOT NULL,
    "view_type" text NOT NULL,
    "label" text NOT NULL,
    "config" JSONB NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" uuid NOT NULL
);

CREATE POLICY "System & Tenant owners CRUD" ON "public"."data_views" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));
ALTER TABLE "public"."data_views" ENABLE ROW LEVEL SECURITY;