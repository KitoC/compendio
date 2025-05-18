create table addresses (
    id uuid primary key default uuid_generate_v4(),
    address_line_1 text not null,
    address_line_2 text,
    city text not null,
    state text not null,
    zip text not null,
    country text not null,
    tenant_id uuid not null references tenants(id),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);


create table companies (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    tenant_id uuid not null references tenants(id),
    address_id uuid references addresses(id),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

ALTER TABLE "public"."companies" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");
ALTER TABLE "public"."companies" ADD CONSTRAINT "fk_address_id" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");
ALTER TABLE "public"."addresses" ADD CONSTRAINT "fk_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");

alter table clients add column company_id uuid references companies(id);
alter table clients add column address_id uuid references addresses(id);

alter table quotes add column company_id uuid references companies(id);
alter table quotes add column address_id uuid references addresses(id);

alter table tenants add column company_id uuid references companies(id);

ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System & Tenant owners CRUD" ON "public"."companies" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));

ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System & Tenant owners CRUD" ON "public"."addresses" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));
