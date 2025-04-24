CREATE TABLE IF NOT EXISTS workflow_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workflow_id uuid not null references workflows(id) on delete cascade,
  action_type text not null, -- e.g. "user_signup", "message_created"
  metadata jsonb,           -- optional: conditions or filters
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


CREATE POLICY "System & Tenant owners CRUD" ON "public"."workflow_actions" USING (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_owner"("tenant_id") OR "public"."is_system_admin"()));
ALTER TABLE "public"."workflow_actions" ENABLE ROW LEVEL SECURITY;
