CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "public"."quotes" ADD COLUMN staff_member_id UUID REFERENCES staff_members(id);

ALTER TABLE "public"."staff_members" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");

ALTER TABLE "public"."staff_members" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System & Tenant owners CRUD" ON "public"."staff_members" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));

