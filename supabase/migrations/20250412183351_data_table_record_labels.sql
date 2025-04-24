CREATE TABLE IF NOT EXISTS "public"."data_table_record_labels" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "data_table_id" uuid NOT NULL,
    "external_table_id" text NOT NULL,
    "record_id" text NOT NULL,
    "label" text NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "deleted_at" timestamp without time zone,
    "tenant_id" uuid NOT NULL
);

ALTER TABLE "public"."data_table_record_labels" OWNER TO "postgres";
ALTER TABLE "public"."data_table_record_labels" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."data_table_record_labels" ADD CONSTRAINT "data_table_record_labels_data_table_id_fkey" FOREIGN KEY ("data_table_id") REFERENCES "public"."data_tables"("id") ON DELETE CASCADE;

ALTER TABLE "public"."data_table_record_labels" ADD CONSTRAINT "data_table_record_labels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
